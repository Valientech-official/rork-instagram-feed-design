"use strict";
/**
 * API Gateway (REST API) Stack
 * React Nativeアプリ向けのREST API設定
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiGatewayStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
class ApiGatewayStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const { environment, lambdaFunctions, userPool } = props;
        // =====================================================
        // CloudWatch Logs
        // =====================================================
        const accessLogGroup = new logs.LogGroup(this, 'ApiGatewayAccessLogs', {
            logGroupName: `/aws/apigateway/piece-app-${environment}`,
            retention: environment === 'prod'
                ? logs.RetentionDays.ONE_MONTH
                : logs.RetentionDays.ONE_WEEK,
            removalPolicy: environment === 'prod'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });
        // =====================================================
        // REST API作成
        // =====================================================
        this.api = new apigateway.RestApi(this, 'PieceAppRestApi', {
            restApiName: `piece-app-api-${environment}`,
            description: `Piece App REST API (${environment})`,
            // デプロイメント設定
            deploy: true,
            deployOptions: {
                stageName: environment,
                // アクセスログ
                accessLogDestination: new apigateway.LogGroupLogDestination(accessLogGroup),
                accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
                    caller: true,
                    httpMethod: true,
                    ip: true,
                    protocol: true,
                    requestTime: true,
                    resourcePath: true,
                    responseLength: true,
                    status: true,
                    user: true,
                }),
                // CloudWatch メトリクス
                metricsEnabled: true,
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: environment === 'dev', // 開発環境のみ詳細ログ
                // スロットリング
                throttlingBurstLimit: environment === 'prod' ? 5000 : 100,
                throttlingRateLimit: environment === 'prod' ? 2000 : 50,
            },
            // CORS設定（React Native対応）
            defaultCorsPreflightOptions: {
                allowOrigins: environment === 'prod'
                    ? ['https://piece-app.com', 'https://www.piece-app.com'] // 本番ドメイン
                    : apigateway.Cors.ALL_ORIGINS, // 開発環境は全許可
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: [
                    'Content-Type',
                    'X-Amz-Date',
                    'Authorization',
                    'X-Api-Key',
                    'X-Amz-Security-Token',
                    'X-Amz-User-Agent',
                    'X-Account-Id', // カスタムヘッダー（開発用）
                    'X-Account-Type', // カスタムヘッダー（開発用）
                ],
                allowCredentials: true,
                maxAge: cdk.Duration.hours(1),
            },
            // エンドポイント設定
            endpointConfiguration: {
                types: [apigateway.EndpointType.REGIONAL],
            },
            // CloudWatch設定
            cloudWatchRole: true,
            // 失敗時のレスポンス
            defaultMethodOptions: {
                authorizationType: apigateway.AuthorizationType.COGNITO,
            },
        });
        // =====================================================
        // Cognito Authorizer作成
        // =====================================================
        this.authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
            cognitoUserPools: [userPool],
            authorizerName: `piece-app-authorizer-${environment}`,
            identitySource: 'method.request.header.Authorization',
            resultsCacheTtl: cdk.Duration.minutes(5), // キャッシュ5分
        });
        // =====================================================
        // API Gatewayのモデル定義（リクエストバリデーション用）
        // =====================================================
        const errorResponseModel = this.api.addModel('ErrorResponseModel', {
            contentType: 'application/json',
            modelName: 'ErrorResponse',
            schema: {
                type: apigateway.JsonSchemaType.OBJECT,
                properties: {
                    success: { type: apigateway.JsonSchemaType.BOOLEAN },
                    error: {
                        type: apigateway.JsonSchemaType.OBJECT,
                        properties: {
                            code: { type: apigateway.JsonSchemaType.STRING },
                            message: { type: apigateway.JsonSchemaType.STRING },
                        },
                    },
                },
            },
        });
        // リクエストバリデーター
        const requestValidator = new apigateway.RequestValidator(this, 'RequestValidator', {
            restApi: this.api,
            requestValidatorName: 'request-body-validator',
            validateRequestBody: true,
            validateRequestParameters: true,
        });
        // =====================================================
        // /accounts リソース
        // =====================================================
        const accountsResource = this.api.root.addResource('accounts');
        // POST /accounts - アカウント作成（認証不要）
        accountsResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.createAccount, {
            proxy: true,
        }), {
            authorizationType: apigateway.AuthorizationType.NONE, // 認証不要
            requestValidator,
        });
        // GET /accounts/{account_id} - プロフィール取得
        const accountResource = accountsResource.addResource('{account_id}');
        accountResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getProfile, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // PUT /accounts/{account_id} - プロフィール更新
        accountResource.addMethod('PUT', new apigateway.LambdaIntegration(lambdaFunctions.updateProfile, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // =====================================================
        // /posts リソース
        // =====================================================
        const postsResource = this.api.root.addResource('posts');
        // POST /posts - 投稿作成
        postsResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.createPost, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /posts/{post_id} - 投稿取得
        const postResource = postsResource.addResource('{post_id}');
        postResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getPost, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // DELETE /posts/{post_id} - 投稿削除
        postResource.addMethod('DELETE', new apigateway.LambdaIntegration(lambdaFunctions.deletePost, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // POST /posts/{post_id}/like - いいね
        const likeResource = postResource.addResource('like');
        likeResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.likePost, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // DELETE /posts/{post_id}/like - いいね解除
        likeResource.addMethod('DELETE', new apigateway.LambdaIntegration(lambdaFunctions.unlikePost, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // POST /posts/{post_id}/comments - コメント作成
        const commentsResource = postResource.addResource('comments');
        commentsResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.createComment, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /posts/{post_id}/comments - コメント一覧取得
        commentsResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getComments, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // =====================================================
        // /comments リソース
        // =====================================================
        const commentRootResource = this.api.root.addResource('comments');
        const commentResource = commentRootResource.addResource('{comment_id}');
        // DELETE /comments/{comment_id} - コメント削除
        commentResource.addMethod('DELETE', new apigateway.LambdaIntegration(lambdaFunctions.deleteComment, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // =====================================================
        // /timeline リソース
        // =====================================================
        const timelineResource = this.api.root.addResource('timeline');
        timelineResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getTimeline, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // =====================================================
        // /follow リソース
        // =====================================================
        const followResource = this.api.root.addResource('follow');
        // POST /follow - フォロー
        followResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.followUser, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // DELETE /follow - フォロー解除
        followResource.addMethod('DELETE', new apigateway.LambdaIntegration(lambdaFunctions.unfollowUser, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // =====================================================
        // /rooms リソース
        // =====================================================
        const roomsResource = this.api.root.addResource('rooms');
        // POST /rooms - ROOM作成
        roomsResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.createRoom, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // POST /rooms/{room_id}/join - ROOM参加 (後で作成するため、ここではスキップ)
        // =====================================================
        // /conversations リソース（DM機能）
        // =====================================================
        const conversationsResource = this.api.root.addResource('conversations');
        // POST /conversations - 会話作成
        conversationsResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.createConversation, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /conversations - 会話一覧取得
        conversationsResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getConversations, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // /conversations/{conversation_id} リソース
        const conversationResource = conversationsResource.addResource('{conversation_id}');
        // POST /conversations/{conversation_id}/messages - メッセージ送信
        const messagesResource = conversationResource.addResource('messages');
        messagesResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.sendMessage, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /conversations/{conversation_id}/messages - メッセージ履歴取得
        messagesResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getMessages, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // =====================================================
        // /block リソース（ブロック機能）
        // =====================================================
        const blockResource = this.api.root.addResource('block');
        // POST /block - ユーザーブロック
        blockResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.blockUser, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /block - ブロックリスト取得
        blockResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getBlockList, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // DELETE /block/{account_id} - ブロック解除
        const blockAccountResource = blockResource.addResource('{account_id}');
        blockAccountResource.addMethod('DELETE', new apigateway.LambdaIntegration(lambdaFunctions.unblockUser, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // =====================================================
        // /posts/{post_id}/repost リソース（リポスト機能）
        // =====================================================
        // POST /posts/{post_id}/repost - リポスト作成
        const postRepostResource = postResource.addResource('repost');
        postRepostResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.createRepost, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // =====================================================
        // /reposts リソース（リポスト機能）
        // =====================================================
        const repostsResource = this.api.root.addResource('reposts');
        // DELETE /reposts/{repost_id} - リポスト削除
        const repostIdResource = repostsResource.addResource('{repost_id}');
        repostIdResource.addMethod('DELETE', new apigateway.LambdaIntegration(lambdaFunctions.deleteRepost, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // =====================================================
        // /reports リソース（レポート機能）
        // =====================================================
        const reportsResource = this.api.root.addResource('reports');
        // POST /reports - レポート作成
        reportsResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.createReport, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /reports - レポート一覧取得
        reportsResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getReports, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // =====================================================
        // /notifications リソース（通知機能）
        // =====================================================
        const notificationsResource = this.api.root.addResource('notifications');
        // GET /notifications - 通知一覧取得
        notificationsResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getNotifications, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // PUT /notifications/{id}/read - 通知を既読にする
        const notificationIdResource = notificationsResource.addResource('{id}');
        const notificationReadResource = notificationIdResource.addResource('read');
        notificationReadResource.addMethod('PUT', new apigateway.LambdaIntegration(lambdaFunctions.readNotification, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // PUT /notifications/read - すべての通知を既読にする
        const readAllResource = notificationsResource.addResource('read');
        readAllResource.addMethod('PUT', new apigateway.LambdaIntegration(lambdaFunctions.readAllNotifications, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // GET /notifications/settings - 通知設定取得
        const notificationSettingsResource = notificationsResource.addResource('settings');
        notificationSettingsResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getNotificationSettings, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // PUT /notifications/settings - 通知設定更新
        notificationSettingsResource.addMethod('PUT', new apigateway.LambdaIntegration(lambdaFunctions.updateNotificationSettings, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // =====================================================
        // /sessions リソース（セッション機能）
        // =====================================================
        const sessionsResource = this.api.root.addResource('sessions');
        // POST /sessions - セッション作成
        sessionsResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.createSession, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /accounts/{account_id}/sessions - アカウントのセッション一覧取得
        const accountSessionsResource = accountResource.addResource('sessions');
        accountSessionsResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getAccountSessions, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // DELETE /sessions/{device_id} - セッション削除
        const sessionDeviceResource = sessionsResource.addResource('{device_id}');
        sessionDeviceResource.addMethod('DELETE', new apigateway.LambdaIntegration(lambdaFunctions.deleteSession, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // =====================================================
        // /hashtags リソース（ハッシュタグ機能）
        // =====================================================
        const hashtagsResource = this.api.root.addResource('hashtags');
        // GET /hashtags/trending - トレンディングハッシュタグ取得
        const trendingResource = hashtagsResource.addResource('trending');
        trendingResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getTrendingHashtags, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // GET /hashtags/{hashtag}/posts - ハッシュタグの投稿取得
        const hashtagResource = hashtagsResource.addResource('{hashtag}');
        const hashtagPostsResource = hashtagResource.addResource('posts');
        hashtagPostsResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getHashtagPosts, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // =====================================================
        // /mute リソース（ミュート機能）
        // =====================================================
        const muteResource = this.api.root.addResource('mute');
        // POST /mute - アカウントをミュート
        muteResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.muteAccount, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /mute - ミュートリスト取得
        muteResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getMuteList, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // DELETE /mute/{account_id} - ミュート解除
        const muteAccountResource = muteResource.addResource('{account_id}');
        muteAccountResource.addMethod('DELETE', new apigateway.LambdaIntegration(lambdaFunctions.unmuteAccount, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // =====================================================
        // Stage 2A: Existing Feature Extensions (14 endpoints)
        // =====================================================
        // PUT /posts/{post_id} - 投稿更新
        postResource.addMethod('PUT', new apigateway.LambdaIntegration(lambdaFunctions.updatePost, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /accounts/{account_id}/posts - ユーザー投稿一覧
        const accountPostsResource = accountResource.addResource('posts');
        accountPostsResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getUserPosts, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /feed/discovery - 発見フィード
        const feedResource = this.api.root.addResource('feed');
        feedResource.addResource('discovery').addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getDiscoveryFeed, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // {room_id}リソース作成（後続のエンドポイントで使用）
        const roomResource = roomsResource.addResource('{room_id}');
        // GET /rooms/{room_id}/posts - ルーム投稿一覧
        const roomPostsResource = roomResource.addResource('posts');
        roomPostsResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getRoomPosts, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /accounts/{account_id}/following - フォロー中一覧
        const accountFollowingResource = accountResource.addResource('following');
        accountFollowingResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getFollowing, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /accounts/{account_id}/followers - フォロワー一覧
        const accountFollowersResource = accountResource.addResource('followers');
        accountFollowersResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getFollowers, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /posts/{post_id}/likes - 投稿のいいね一覧
        const postLikesResource = postResource.addResource('likes');
        postLikesResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getPostLikes, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /accounts/{account_id}/likes - ユーザーのいいね一覧
        const accountLikesResource = accountResource.addResource('likes');
        accountLikesResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getUserLikes, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /accounts/{account_id}/reposts - ユーザーのリポスト一覧
        const accountRepostsResource = accountResource.addResource('reposts');
        accountRepostsResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getUserReposts, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /posts/{post_id}/reposts - 投稿のリポスト一覧
        const postRepostsResource = postResource.addResource('reposts');
        postRepostsResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getPostReposts, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /rooms/{room_id} - ルーム詳細
        roomResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getRoom, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // PUT /rooms/{room_id} - ルーム更新
        roomResource.addMethod('PUT', new apigateway.LambdaIntegration(lambdaFunctions.updateRoom, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // POST /rooms/{room_id}/join - ROOM参加
        const joinResource = roomResource.addResource('join');
        joinResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.joinRoom, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // GET /rooms/{room_id}/members - ルームメンバー一覧
        const roomMembersResource = roomResource.addResource('members');
        roomMembersResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getRoomMembers, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // DELETE /rooms/{room_id}/members/me - ルーム退出
        roomMembersResource.addResource('me').addMethod('DELETE', new apigateway.LambdaIntegration(lambdaFunctions.leaveRoom, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // =====================================================
        // Stage 2B: Analytics (4 endpoints)
        // =====================================================
        // POST /analytics/events - イベント追跡
        const analyticsResource = this.api.root.addResource('analytics');
        analyticsResource.addResource('events').addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.trackEvent, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /posts/{post_id}/analytics - 投稿分析データ
        postResource
            .addResource('analytics')
            .addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getPostAnalytics, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /accounts/{account_id}/analytics - アカウント分析データ
        accountResource
            .addResource('analytics')
            .addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getAccountAnalytics, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /dashboard - ダッシュボード
        this.api.root.addResource('dashboard').addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getDashboard, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // =====================================================
        // Stage 2C: Product/Shop (8 endpoints)
        // =====================================================
        // POST /products - 商品作成
        const productsResource = this.api.root.addResource('products');
        productsResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.createProduct, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /products - 商品一覧
        productsResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getProducts, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /products/{product_id} - 商品詳細
        const productIdResource = productsResource.addResource('{product_id}');
        productIdResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getProduct, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // PUT /products/{product_id} - 商品更新
        productIdResource.addMethod('PUT', new apigateway.LambdaIntegration(lambdaFunctions.updateProduct, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // DELETE /products/{product_id} - 商品削除
        productIdResource.addMethod('DELETE', new apigateway.LambdaIntegration(lambdaFunctions.deleteProduct, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // POST /products/{product_id}/click - クリック追跡
        productIdResource.addResource('click').addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.clickProduct, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // /posts/{post_id}/products - 投稿の商品
        const postProductsResource = postResource.addResource('products');
        // POST /posts/{post_id}/products - 投稿に商品タグ付け
        postProductsResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.tagProductOnPost, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /posts/{post_id}/products - 投稿の商品一覧
        postProductsResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getPostProducts, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // =====================================================
        // Stage 2E: Live Streaming (14 REST API endpoints)
        // =====================================================
        // POST /live-streams - ライブ配信作成
        const liveStreamsResource = this.api.root.addResource('live-streams');
        liveStreamsResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.createLiveStream, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /live-streams - ライブ配信一覧
        liveStreamsResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getLiveStreams, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /live-streams/{stream_id} - ライブ配信詳細
        const streamIdResource = liveStreamsResource.addResource('{stream_id}');
        streamIdResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getLiveStream, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // DELETE /live-streams/{stream_id} - ライブ配信削除
        streamIdResource.addMethod('DELETE', new apigateway.LambdaIntegration(lambdaFunctions.deleteLiveStream, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // POST /live-streams/{stream_id}/end - 配信終了
        streamIdResource.addResource('end').addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.endLiveStream, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // POST /live-streams/{stream_id}/join - 配信参加
        streamIdResource.addResource('join').addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.joinLiveStream, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // POST /live-streams/{stream_id}/leave - 配信退出
        streamIdResource.addResource('leave').addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.leaveLiveStream, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /live-streams/{stream_id}/chat - チャット一覧
        const chatResource = streamIdResource.addResource('chat');
        chatResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getLiveChats, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // POST /live-streams/{stream_id}/chat - チャット送信
        chatResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.sendLiveChat, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // POST /live-streams/{stream_id}/gifts - ギフト送信
        streamIdResource.addResource('gifts').addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.sendGift, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // POST /live-streams/{stream_id}/moderators - モデレーター追加
        streamIdResource.addResource('moderators').addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.addModerator, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // POST /live-streams/{stream_id}/ban - ユーザーBAN
        streamIdResource.addResource('ban').addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.banUserFromLive, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // POST /webhooks/mux - Mux Webhook（認証なし）
        this.api.root
            .addResource('webhooks')
            .addResource('mux')
            .addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.muxWebhook, { proxy: true }), {
            authorizationType: apigateway.AuthorizationType.NONE,
            requestValidator,
        });
        // =====================================================
        // Outputs
        // =====================================================
        new cdk.CfnOutput(this, 'ApiUrl', {
            value: this.api.url,
            description: 'API Gateway URL',
            exportName: `PieceApp-ApiUrl-${environment}`,
        });
        new cdk.CfnOutput(this, 'ApiId', {
            value: this.api.restApiId,
            description: 'API Gateway ID',
            exportName: `PieceApp-ApiId-${environment}`,
        });
    }
}
exports.ApiGatewayStack = ApiGatewayStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLWdhdGV3YXktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvYXBpLWdhdGV3YXktc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsaURBQW1DO0FBQ25DLHVFQUF5RDtBQUd6RCwyREFBNkM7QUE0SDdDLE1BQWEsZUFBZ0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUk1QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTJCO1FBQ25FLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sRUFBRSxXQUFXLEVBQUUsZUFBZSxFQUFFLFFBQVEsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUV6RCx3REFBd0Q7UUFDeEQsa0JBQWtCO1FBQ2xCLHdEQUF3RDtRQUN4RCxNQUFNLGNBQWMsR0FBRyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLHNCQUFzQixFQUFFO1lBQ3JFLFlBQVksRUFBRSw2QkFBNkIsV0FBVyxFQUFFO1lBQ3hELFNBQVMsRUFBRSxXQUFXLEtBQUssTUFBTTtnQkFDL0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUztnQkFDOUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUTtZQUMvQixhQUFhLEVBQUUsV0FBVyxLQUFLLE1BQU07Z0JBQ25DLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU07Z0JBQzFCLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDOUIsQ0FBQyxDQUFDO1FBRUgsd0RBQXdEO1FBQ3hELGFBQWE7UUFDYix3REFBd0Q7UUFDeEQsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ3pE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YUFDdkIsV0FBVyxDQUFDLEtBQUssQ0FBQzthQUNsQixTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLGVBQWUsQ0FBQyxVQUFVLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRTtZQUNoRyxpQkFBaUIsRUFBRSxVQUFVLENBQUMsaUJBQWlCLENBQUMsSUFBSTtZQUNwRCxnQkFBZ0I7U0FDakIsQ0FBQyxDQUFDO1FBRUwsd0RBQXdEO1FBQ3hELFVBQVU7UUFDVix3REFBd0Q7UUFDeEQsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUU7WUFDaEMsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRztZQUNuQixXQUFXLEVBQUUsaUJBQWlCO1lBQzlCLFVBQVUsRUFBRSxtQkFBbUIsV0FBVyxFQUFFO1NBQzdDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFO1lBQy9CLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVM7WUFDekIsV0FBVyxFQUFFLGdCQUFnQjtZQUM3QixVQUFVLEVBQUUsa0JBQWtCLFdBQVcsRUFBRTtTQUM1QyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUE3ckNELDBDQTZyQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQVBJIEdhdGV3YXkgKFJFU1QgQVBJKSBTdGFja1xyXG4gKiBSZWFjdCBOYXRpdmXjgqLjg5fjg6rlkJHjgZHjga5SRVNUIEFQSeioreWumlxyXG4gKi9cclxuXHJcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XHJcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xyXG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XHJcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZ25pdG8nO1xyXG5pbXBvcnQgKiBhcyBsb2dzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sb2dzJztcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcblxyXG5pbnRlcmZhY2UgQXBpR2F0ZXdheVN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XHJcbiAgZW52aXJvbm1lbnQ6ICdkZXYnIHwgJ3Byb2QnO1xyXG4gIGxhbWJkYUZ1bmN0aW9uczoge1xyXG4gICAgLy8gQWNjb3VudFxyXG4gICAgY3JlYXRlQWNjb3VudDogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZ2V0UHJvZmlsZTogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgdXBkYXRlUHJvZmlsZTogbGFtYmRhLkZ1bmN0aW9uO1xyXG5cclxuICAgIC8vIFBvc3RcclxuICAgIGNyZWF0ZVBvc3Q6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldFBvc3Q6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGRlbGV0ZVBvc3Q6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldFRpbWVsaW5lOiBsYW1iZGEuRnVuY3Rpb247XHJcblxyXG4gICAgLy8gTGlrZVxyXG4gICAgbGlrZVBvc3Q6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIHVubGlrZVBvc3Q6IGxhbWJkYS5GdW5jdGlvbjtcclxuXHJcbiAgICAvLyBDb21tZW50XHJcbiAgICBjcmVhdGVDb21tZW50OiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBkZWxldGVDb21tZW50OiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBnZXRDb21tZW50czogbGFtYmRhLkZ1bmN0aW9uO1xyXG5cclxuICAgIC8vIEZvbGxvd1xyXG4gICAgZm9sbG93VXNlcjogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgdW5mb2xsb3dVc2VyOiBsYW1iZGEuRnVuY3Rpb247XHJcblxyXG4gICAgLy8gUm9vbVxyXG4gICAgY3JlYXRlUm9vbTogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgam9pblJvb206IGxhbWJkYS5GdW5jdGlvbjtcclxuXHJcbiAgICAvLyBETSAoQ29udmVyc2F0aW9uICYgTWVzc2FnZSlcclxuICAgIGNyZWF0ZUNvbnZlcnNhdGlvbjogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZ2V0Q29udmVyc2F0aW9uczogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgc2VuZE1lc3NhZ2U6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldE1lc3NhZ2VzOiBsYW1iZGEuRnVuY3Rpb247XHJcblxyXG4gICAgLy8gQmxvY2tcclxuICAgIGJsb2NrVXNlcjogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgdW5ibG9ja1VzZXI6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldEJsb2NrTGlzdDogbGFtYmRhLkZ1bmN0aW9uO1xyXG5cclxuICAgIC8vIFJlcG9zdFxyXG4gICAgY3JlYXRlUmVwb3N0OiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBkZWxldGVSZXBvc3Q6IGxhbWJkYS5GdW5jdGlvbjtcclxuXHJcbiAgICAvLyBSZXBvcnRcclxuICAgIGNyZWF0ZVJlcG9ydDogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZ2V0UmVwb3J0czogbGFtYmRhLkZ1bmN0aW9uO1xyXG5cclxuICAgIC8vIE5vdGlmaWNhdGlvblxyXG4gICAgZ2V0Tm90aWZpY2F0aW9uczogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgcmVhZE5vdGlmaWNhdGlvbjogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgcmVhZEFsbE5vdGlmaWNhdGlvbnM6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldE5vdGlmaWNhdGlvblNldHRpbmdzOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICB1cGRhdGVOb3RpZmljYXRpb25TZXR0aW5nczogbGFtYmRhLkZ1bmN0aW9uO1xyXG5cclxuICAgIC8vIFNlc3Npb25cclxuICAgIGNyZWF0ZVNlc3Npb246IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldEFjY291bnRTZXNzaW9uczogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZGVsZXRlU2Vzc2lvbjogbGFtYmRhLkZ1bmN0aW9uO1xyXG5cclxuICAgIC8vIEhhc2h0YWdcclxuICAgIGdldEhhc2h0YWdQb3N0czogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZ2V0VHJlbmRpbmdIYXNodGFnczogbGFtYmRhLkZ1bmN0aW9uO1xyXG5cclxuICAgIC8vIE11dGVcclxuICAgIG11dGVBY2NvdW50OiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICB1bm11dGVBY2NvdW50OiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBnZXRNdXRlTGlzdDogbGFtYmRhLkZ1bmN0aW9uO1xyXG5cclxuICAgIC8vIFN0YWdlIDJBOiBFeGlzdGluZyBGZWF0dXJlIEV4dGVuc2lvbnNcclxuICAgIHVwZGF0ZVBvc3Q6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldFVzZXJQb3N0czogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZ2V0RGlzY292ZXJ5RmVlZDogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZ2V0Um9vbVBvc3RzOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBnZXRGb2xsb3dpbmc6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldEZvbGxvd2VyczogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZ2V0UG9zdExpa2VzOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBnZXRVc2VyTGlrZXM6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldFVzZXJSZXBvc3RzOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBnZXRQb3N0UmVwb3N0czogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZ2V0Um9vbTogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgdXBkYXRlUm9vbTogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZ2V0Um9vbU1lbWJlcnM6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGxlYXZlUm9vbTogbGFtYmRhLkZ1bmN0aW9uO1xyXG5cclxuICAgIC8vIFN0YWdlIDJCOiBBbmFseXRpY3NcclxuICAgIHRyYWNrRXZlbnQ6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldFBvc3RBbmFseXRpY3M6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldEFjY291bnRBbmFseXRpY3M6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldERhc2hib2FyZDogbGFtYmRhLkZ1bmN0aW9uO1xyXG5cclxuICAgIC8vIFN0YWdlIDJDOiBQcm9kdWN0L1Nob3BcclxuICAgIGNyZWF0ZVByb2R1Y3Q6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldFByb2R1Y3Q6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIHVwZGF0ZVByb2R1Y3Q6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGRlbGV0ZVByb2R1Y3Q6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldFByb2R1Y3RzOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICB0YWdQcm9kdWN0T25Qb3N0OiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBnZXRQb3N0UHJvZHVjdHM6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGNsaWNrUHJvZHVjdDogbGFtYmRhLkZ1bmN0aW9uO1xyXG5cclxuICAgIC8vIFN0YWdlIDJFOiBMaXZlIFN0cmVhbWluZ1xyXG4gICAgY3JlYXRlTGl2ZVN0cmVhbTogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZGVsZXRlTGl2ZVN0cmVhbTogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZ2V0TGl2ZVN0cmVhbTogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZ2V0TGl2ZVN0cmVhbXM6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGVuZExpdmVTdHJlYW06IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGpvaW5MaXZlU3RyZWFtOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBsZWF2ZUxpdmVTdHJlYW06IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIHNlbmRMaXZlQ2hhdDogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZ2V0TGl2ZUNoYXRzOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBzZW5kR2lmdDogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgYWRkTW9kZXJhdG9yOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBiYW5Vc2VyRnJvbUxpdmU6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIG11eFdlYmhvb2s6IGxhbWJkYS5GdW5jdGlvbjtcclxuICB9O1xyXG4gIHVzZXJQb29sOiBjb2duaXRvLlVzZXJQb29sO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQXBpR2F0ZXdheVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcclxuICBwdWJsaWMgcmVhZG9ubHkgYXBpOiBhcGlnYXRld2F5LlJlc3RBcGk7XHJcbiAgcHVibGljIHJlYWRvbmx5IGF1dGhvcml6ZXI6IGFwaWdhdGV3YXkuQ29nbml0b1VzZXJQb29sc0F1dGhvcml6ZXI7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBBcGlHYXRld2F5U3RhY2tQcm9wcykge1xyXG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XHJcblxyXG4gICAgY29uc3QgeyBlbnZpcm9ubWVudCwgbGFtYmRhRnVuY3Rpb25zLCB1c2VyUG9vbCB9ID0gcHJvcHM7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIENsb3VkV2F0Y2ggTG9nc1xyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIGNvbnN0IGFjY2Vzc0xvZ0dyb3VwID0gbmV3IGxvZ3MuTG9nR3JvdXAodGhpcywgJ0FwaUdhdGV3YXlBY2Nlc3NMb2dzJywge1xyXG4gICAgICBsb2dHcm91cE5hbWU6IGAvYXdzL2FwaWdhdGV3YXkvcGllY2UtYXBwLSR7ZW52aXJvbm1lbnR9YCxcclxuICAgICAgcmV0ZW50aW9uOiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnXHJcbiAgICAgICAgPyBsb2dzLlJldGVudGlvbkRheXMuT05FX01PTlRIXHJcbiAgICAgICAgOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXHJcbiAgICAgIHJlbW92YWxQb2xpY3k6IGVudmlyb25tZW50ID09PSAncHJvZCdcclxuICAgICAgICA/IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTlxyXG4gICAgICAgIDogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyBSRVNUIEFQSeS9nOaIkFxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIHRoaXMuYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnUGllY2VBcHBSZXN0QXBpJywge1xyXG4gICAgICByZXN0QXBpTmFtZTogYHBpZWNlLWFwcC1hcGktJHtlbnZpcm9ubWVudH1gLFxyXG4gICAgICBkZXNjcmlwdGlvbjogYFBpZWNlIEFwcCBSRVNUIEFQSSAoJHtlbnZpcm9ubWVudH0pYCxcclxuXHJcbiAgICAgIC8vIOODh+ODl+ODreOCpOODoeODs+ODiOioreWumlxyXG4gICAgICBkZXBsb3k6IHRydWUsXHJcbiAgICAgIGRlcGxveU9wdGlvbnM6IHtcclxuICAgICAgICBzdGFnZU5hbWU6IGVudmlyb25tZW50LFxyXG5cclxuICAgICAgICAvLyDjgqLjgq/jgrvjgrnjg63jgrBcclxuICAgICAgICBhY2Nlc3NMb2dEZXN0aW5hdGlvbjogbmV3IGFwaWdhdGV3YXkuTG9nR3JvdXBMb2dEZXN0aW5hdGlvbihhY2Nlc3NMb2dHcm91cCksXHJcbiAgICAgICAgYWNjZXNzTG9nRm9ybWF0OiBhcGlnYXRld2F5LkFjY2Vzc0xvZ0Zvcm1hdC5qc29uV2l0aFN0YW5kYXJkRmllbGRzKHtcclxuICAgICAgICAgIGNhbGxlcjogdHJ1ZSxcclxuICAgICAgICAgIGh0dHBNZXRob2Q6IHRydWUsXHJcbiAgICAgICAgICBpcDogdHJ1ZSxcclxuICAgICAgICAgIHByb3RvY29sOiB0cnVlLFxyXG4gICAgICAgICAgcmVxdWVzdFRpbWU6IHRydWUsXHJcbiAgICAgICAgICByZXNvdXJjZVBhdGg6IHRydWUsXHJcbiAgICAgICAgICByZXNwb25zZUxlbmd0aDogdHJ1ZSxcclxuICAgICAgICAgIHN0YXR1czogdHJ1ZSxcclxuICAgICAgICAgIHVzZXI6IHRydWUsXHJcbiAgICAgICAgfSksXHJcblxyXG4gICAgICAgIC8vIENsb3VkV2F0Y2gg44Oh44OI44Oq44Kv44K5XHJcbiAgICAgICAgbWV0cmljc0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgbG9nZ2luZ0xldmVsOiBhcGlnYXRld2F5Lk1ldGhvZExvZ2dpbmdMZXZlbC5JTkZPLFxyXG4gICAgICAgIGRhdGFUcmFjZUVuYWJsZWQ6IGVudmlyb25tZW50ID09PSAnZGV2JywgLy8g6ZaL55m655Kw5aKD44Gu44G/6Kmz57Sw44Ot44KwXHJcblxyXG4gICAgICAgIC8vIOOCueODreODg+ODiOODquODs+OCsFxyXG4gICAgICAgIHRocm90dGxpbmdCdXJzdExpbWl0OiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnID8gNTAwMCA6IDEwMCxcclxuICAgICAgICB0aHJvdHRsaW5nUmF0ZUxpbWl0OiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnID8gMjAwMCA6IDUwLFxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gQ09SU+ioreWumu+8iFJlYWN0IE5hdGl2ZeWvvuW/nO+8iVxyXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcclxuICAgICAgICBhbGxvd09yaWdpbnM6IGVudmlyb25tZW50ID09PSAncHJvZCdcclxuICAgICAgICAgID8gWydodHRwczovL3BpZWNlLWFwcC5jb20nLCAnaHR0cHM6Ly93d3cucGllY2UtYXBwLmNvbSddIC8vIOacrOeVquODieODoeOCpOODs1xyXG4gICAgICAgICAgOiBhcGlnYXRld2F5LkNvcnMuQUxMX09SSUdJTlMsIC8vIOmWi+eZuueSsOWig+OBr+WFqOioseWPr1xyXG4gICAgICAgIGFsbG93TWV0aG9kczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9NRVRIT0RTLFxyXG4gICAgICAgIGFsbG93SGVhZGVyczogW1xyXG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZScsXHJcbiAgICAgICAgICAnWC1BbXotRGF0ZScsXHJcbiAgICAgICAgICAnQXV0aG9yaXphdGlvbicsXHJcbiAgICAgICAgICAnWC1BcGktS2V5JyxcclxuICAgICAgICAgICdYLUFtei1TZWN1cml0eS1Ub2tlbicsXHJcbiAgICAgICAgICAnWC1BbXotVXNlci1BZ2VudCcsXHJcbiAgICAgICAgICAnWC1BY2NvdW50LUlkJywgLy8g44Kr44K544K/44Og44OY44OD44OA44O877yI6ZaL55m655So77yJXHJcbiAgICAgICAgICAnWC1BY2NvdW50LVR5cGUnLCAvLyDjgqvjgrnjgr/jg6Djg5jjg4Pjg4Djg7zvvIjplovnmbrnlKjvvIlcclxuICAgICAgICBdLFxyXG4gICAgICAgIGFsbG93Q3JlZGVudGlhbHM6IHRydWUsXHJcbiAgICAgICAgbWF4QWdlOiBjZGsuRHVyYXRpb24uaG91cnMoMSksXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyDjgqjjg7Pjg4njg53jgqTjg7Pjg4joqK3lrppcclxuICAgICAgZW5kcG9pbnRDb25maWd1cmF0aW9uOiB7XHJcbiAgICAgICAgdHlwZXM6IFthcGlnYXRld2F5LkVuZHBvaW50VHlwZS5SRUdJT05BTF0sXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBDbG91ZFdhdGNo6Kit5a6aXHJcbiAgICAgIGNsb3VkV2F0Y2hSb2xlOiB0cnVlLFxyXG5cclxuICAgICAgLy8g5aSx5pWX5pmC44Gu44Os44K544Od44Oz44K5XHJcbiAgICAgIGRlZmF1bHRNZXRob2RPcHRpb25zOiB7XHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyBDb2duaXRvIEF1dGhvcml6ZXLkvZzmiJBcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICB0aGlzLmF1dGhvcml6ZXIgPSBuZXcgYXBpZ2F0ZXdheS5Db2duaXRvVXNlclBvb2xzQXV0aG9yaXplcihcclxuICAgICAgdGhpcyxcclxuICAgICAgJ0NvZ25pdG9BdXRob3JpemVyJyxcclxuICAgICAge1xyXG4gICAgICAgIGNvZ25pdG9Vc2VyUG9vbHM6IFt1c2VyUG9vbF0sXHJcbiAgICAgICAgYXV0aG9yaXplck5hbWU6IGBwaWVjZS1hcHAtYXV0aG9yaXplci0ke2Vudmlyb25tZW50fWAsXHJcbiAgICAgICAgaWRlbnRpdHlTb3VyY2U6ICdtZXRob2QucmVxdWVzdC5oZWFkZXIuQXV0aG9yaXphdGlvbicsXHJcbiAgICAgICAgcmVzdWx0c0NhY2hlVHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSwgLy8g44Kt44Oj44OD44K344OlNeWIhlxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyBBUEkgR2F0ZXdheeOBruODouODh+ODq+Wumue+qe+8iOODquOCr+OCqOOCueODiOODkOODquODh+ODvOOCt+ODp+ODs+eUqO+8iVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIGNvbnN0IGVycm9yUmVzcG9uc2VNb2RlbCA9IHRoaXMuYXBpLmFkZE1vZGVsKCdFcnJvclJlc3BvbnNlTW9kZWwnLCB7XHJcbiAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgIG1vZGVsTmFtZTogJ0Vycm9yUmVzcG9uc2UnLFxyXG4gICAgICBzY2hlbWE6IHtcclxuICAgICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLk9CSkVDVCxcclxuICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICBzdWNjZXNzOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuQk9PTEVBTiB9LFxyXG4gICAgICAgICAgZXJyb3I6IHtcclxuICAgICAgICAgICAgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5PQkpFQ1QsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBjb2RlOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICAgICAgbWVzc2FnZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8g44Oq44Kv44Ko44K544OI44OQ44Oq44OH44O844K/44O8XHJcbiAgICBjb25zdCByZXF1ZXN0VmFsaWRhdG9yID0gbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihcclxuICAgICAgdGhpcyxcclxuICAgICAgJ1JlcXVlc3RWYWxpZGF0b3InLFxyXG4gICAgICB7XHJcbiAgICAgICAgcmVzdEFwaTogdGhpcy5hcGksXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvck5hbWU6ICdyZXF1ZXN0LWJvZHktdmFsaWRhdG9yJyxcclxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RCb2R5OiB0cnVlLFxyXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IHRydWUsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIC9hY2NvdW50cyDjg6rjgr3jg7zjgrlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBjb25zdCBhY2NvdW50c1Jlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgnYWNjb3VudHMnKTtcclxuXHJcbiAgICAvLyBQT1NUIC9hY2NvdW50cyAtIOOCouOCq+OCpuODs+ODiOS9nOaIkO+8iOiqjeiovOS4jeimge+8iVxyXG4gICAgYWNjb3VudHNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmNyZWF0ZUFjY291bnQsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5OT05FLCAvLyDoqo3oqLzkuI3opoFcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEdFVCAvYWNjb3VudHMve2FjY291bnRfaWR9IC0g44OX44Ot44OV44Kj44O844Or5Y+W5b6XXHJcbiAgICBjb25zdCBhY2NvdW50UmVzb3VyY2UgPSBhY2NvdW50c1Jlc291cmNlLmFkZFJlc291cmNlKCd7YWNjb3VudF9pZH0nKTtcclxuICAgIGFjY291bnRSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdHRVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0UHJvZmlsZSwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIFBVVCAvYWNjb3VudHMve2FjY291bnRfaWR9IC0g44OX44Ot44OV44Kj44O844Or5pu05pawXHJcbiAgICBhY2NvdW50UmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnUFVUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLnVwZGF0ZVByb2ZpbGUsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAvcG9zdHMg44Oq44K944O844K5XHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgY29uc3QgcG9zdHNSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3Bvc3RzJyk7XHJcblxyXG4gICAgLy8gUE9TVCAvcG9zdHMgLSDmipXnqL/kvZzmiJBcclxuICAgIHBvc3RzUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnUE9TVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5jcmVhdGVQb3N0LCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL3Bvc3RzL3twb3N0X2lkfSAtIOaKleeov+WPluW+l1xyXG4gICAgY29uc3QgcG9zdFJlc291cmNlID0gcG9zdHNSZXNvdXJjZS5hZGRSZXNvdXJjZSgne3Bvc3RfaWR9Jyk7XHJcbiAgICBwb3N0UmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldFBvc3QsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBERUxFVEUgL3Bvc3RzL3twb3N0X2lkfSAtIOaKleeov+WJiumZpFxyXG4gICAgcG9zdFJlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0RFTEVURScsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5kZWxldGVQb3N0LCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gUE9TVCAvcG9zdHMve3Bvc3RfaWR9L2xpa2UgLSDjgYTjgYTjga1cclxuICAgIGNvbnN0IGxpa2VSZXNvdXJjZSA9IHBvc3RSZXNvdXJjZS5hZGRSZXNvdXJjZSgnbGlrZScpO1xyXG4gICAgbGlrZVJlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ1BPU1QnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMubGlrZVBvc3QsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBERUxFVEUgL3Bvc3RzL3twb3N0X2lkfS9saWtlIC0g44GE44GE44Gt6Kej6ZmkXHJcbiAgICBsaWtlUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnREVMRVRFJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLnVubGlrZVBvc3QsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBQT1NUIC9wb3N0cy97cG9zdF9pZH0vY29tbWVudHMgLSDjgrPjg6Hjg7Pjg4jkvZzmiJBcclxuICAgIGNvbnN0IGNvbW1lbnRzUmVzb3VyY2UgPSBwb3N0UmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2NvbW1lbnRzJyk7XHJcbiAgICBjb21tZW50c1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ1BPU1QnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuY3JlYXRlQ29tbWVudCwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gR0VUIC9wb3N0cy97cG9zdF9pZH0vY29tbWVudHMgLSDjgrPjg6Hjg7Pjg4jkuIDopqflj5blvpdcclxuICAgIGNvbW1lbnRzUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldENvbW1lbnRzLCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIC9jb21tZW50cyDjg6rjgr3jg7zjgrlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBjb25zdCBjb21tZW50Um9vdFJlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgnY29tbWVudHMnKTtcclxuICAgIGNvbnN0IGNvbW1lbnRSZXNvdXJjZSA9IGNvbW1lbnRSb290UmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3tjb21tZW50X2lkfScpO1xyXG5cclxuICAgIC8vIERFTEVURSAvY29tbWVudHMve2NvbW1lbnRfaWR9IC0g44Kz44Oh44Oz44OI5YmK6ZmkXHJcbiAgICBjb21tZW50UmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnREVMRVRFJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmRlbGV0ZUNvbW1lbnQsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gL3RpbWVsaW5lIOODquOCveODvOOCuVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIGNvbnN0IHRpbWVsaW5lUmVzb3VyY2UgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCd0aW1lbGluZScpO1xyXG4gICAgdGltZWxpbmVSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdHRVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0VGltZWxpbmUsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gL2ZvbGxvdyDjg6rjgr3jg7zjgrlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBjb25zdCBmb2xsb3dSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2ZvbGxvdycpO1xyXG5cclxuICAgIC8vIFBPU1QgL2ZvbGxvdyAtIOODleOCqeODreODvFxyXG4gICAgZm9sbG93UmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnUE9TVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5mb2xsb3dVc2VyLCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBERUxFVEUgL2ZvbGxvdyAtIOODleOCqeODreODvOino+mZpFxyXG4gICAgZm9sbG93UmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnREVMRVRFJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLnVuZm9sbG93VXNlciwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIC9yb29tcyDjg6rjgr3jg7zjgrlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBjb25zdCByb29tc1Jlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgncm9vbXMnKTtcclxuXHJcbiAgICAvLyBQT1NUIC9yb29tcyAtIFJPT03kvZzmiJBcclxuICAgIHJvb21zUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnUE9TVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5jcmVhdGVSb29tLCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBQT1NUIC9yb29tcy97cm9vbV9pZH0vam9pbiAtIFJPT03lj4LliqAgKOW+jOOBp+S9nOaIkOOBmeOCi+OBn+OCgeOAgeOBk+OBk+OBp+OBr+OCueOCreODg+ODlylcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gL2NvbnZlcnNhdGlvbnMg44Oq44K944O844K577yIRE3mqZ/og73vvIlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBjb25zdCBjb252ZXJzYXRpb25zUmVzb3VyY2UgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdjb252ZXJzYXRpb25zJyk7XHJcblxyXG4gICAgLy8gUE9TVCAvY29udmVyc2F0aW9ucyAtIOS8muipseS9nOaIkFxyXG4gICAgY29udmVyc2F0aW9uc1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ1BPU1QnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuY3JlYXRlQ29udmVyc2F0aW9uLCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL2NvbnZlcnNhdGlvbnMgLSDkvJroqbHkuIDopqflj5blvpdcclxuICAgIGNvbnZlcnNhdGlvbnNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdHRVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0Q29udmVyc2F0aW9ucywge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIC9jb252ZXJzYXRpb25zL3tjb252ZXJzYXRpb25faWR9IOODquOCveODvOOCuVxyXG4gICAgY29uc3QgY29udmVyc2F0aW9uUmVzb3VyY2UgPSBjb252ZXJzYXRpb25zUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3tjb252ZXJzYXRpb25faWR9Jyk7XHJcblxyXG4gICAgLy8gUE9TVCAvY29udmVyc2F0aW9ucy97Y29udmVyc2F0aW9uX2lkfS9tZXNzYWdlcyAtIOODoeODg+OCu+ODvOOCuOmAgeS/oVxyXG4gICAgY29uc3QgbWVzc2FnZXNSZXNvdXJjZSA9IGNvbnZlcnNhdGlvblJlc291cmNlLmFkZFJlc291cmNlKCdtZXNzYWdlcycpO1xyXG4gICAgbWVzc2FnZXNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLnNlbmRNZXNzYWdlLCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL2NvbnZlcnNhdGlvbnMve2NvbnZlcnNhdGlvbl9pZH0vbWVzc2FnZXMgLSDjg6Hjg4Pjgrvjg7zjgrjlsaXmrbTlj5blvpdcclxuICAgIG1lc3NhZ2VzUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldE1lc3NhZ2VzLCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIC9ibG9jayDjg6rjgr3jg7zjgrnvvIjjg5bjg63jg4Pjgq/mqZ/og73vvIlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBjb25zdCBibG9ja1Jlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgnYmxvY2snKTtcclxuXHJcbiAgICAvLyBQT1NUIC9ibG9jayAtIOODpuODvOOCtuODvOODluODreODg+OCr1xyXG4gICAgYmxvY2tSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmJsb2NrVXNlciwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gR0VUIC9ibG9jayAtIOODluODreODg+OCr+ODquOCueODiOWPluW+l1xyXG4gICAgYmxvY2tSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdHRVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0QmxvY2tMaXN0LCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gREVMRVRFIC9ibG9jay97YWNjb3VudF9pZH0gLSDjg5bjg63jg4Pjgq/op6PpmaRcclxuICAgIGNvbnN0IGJsb2NrQWNjb3VudFJlc291cmNlID0gYmxvY2tSZXNvdXJjZS5hZGRSZXNvdXJjZSgne2FjY291bnRfaWR9Jyk7XHJcbiAgICBibG9ja0FjY291bnRSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdERUxFVEUnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMudW5ibG9ja1VzZXIsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gL3Bvc3RzL3twb3N0X2lkfS9yZXBvc3Qg44Oq44K944O844K577yI44Oq44Od44K544OI5qmf6IO977yJXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gUE9TVCAvcG9zdHMve3Bvc3RfaWR9L3JlcG9zdCAtIOODquODneOCueODiOS9nOaIkFxyXG4gICAgY29uc3QgcG9zdFJlcG9zdFJlc291cmNlID0gcG9zdFJlc291cmNlLmFkZFJlc291cmNlKCdyZXBvc3QnKTtcclxuICAgIHBvc3RSZXBvc3RSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmNyZWF0ZVJlcG9zdCwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIC9yZXBvc3RzIOODquOCveODvOOCue+8iOODquODneOCueODiOapn+iDve+8iVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIGNvbnN0IHJlcG9zdHNSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3JlcG9zdHMnKTtcclxuXHJcbiAgICAvLyBERUxFVEUgL3JlcG9zdHMve3JlcG9zdF9pZH0gLSDjg6rjg53jgrnjg4jliYrpmaRcclxuICAgIGNvbnN0IHJlcG9zdElkUmVzb3VyY2UgPSByZXBvc3RzUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3tyZXBvc3RfaWR9Jyk7XHJcbiAgICByZXBvc3RJZFJlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0RFTEVURScsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5kZWxldGVSZXBvc3QsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gL3JlcG9ydHMg44Oq44K944O844K577yI44Os44Od44O844OI5qmf6IO977yJXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgY29uc3QgcmVwb3J0c1Jlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgncmVwb3J0cycpO1xyXG5cclxuICAgIC8vIFBPU1QgL3JlcG9ydHMgLSDjg6zjg53jg7zjg4jkvZzmiJBcclxuICAgIHJlcG9ydHNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmNyZWF0ZVJlcG9ydCwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gR0VUIC9yZXBvcnRzIC0g44Os44Od44O844OI5LiA6Kan5Y+W5b6XXHJcbiAgICByZXBvcnRzUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldFJlcG9ydHMsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gL25vdGlmaWNhdGlvbnMg44Oq44K944O844K577yI6YCa55+l5qmf6IO977yJXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgY29uc3Qgbm90aWZpY2F0aW9uc1Jlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgnbm90aWZpY2F0aW9ucycpO1xyXG5cclxuICAgIC8vIEdFVCAvbm90aWZpY2F0aW9ucyAtIOmAmuefpeS4gOimp+WPluW+l1xyXG4gICAgbm90aWZpY2F0aW9uc1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0dFVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXROb3RpZmljYXRpb25zLCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gUFVUIC9ub3RpZmljYXRpb25zL3tpZH0vcmVhZCAtIOmAmuefpeOCkuaXouiqreOBq+OBmeOCi1xyXG4gICAgY29uc3Qgbm90aWZpY2F0aW9uSWRSZXNvdXJjZSA9IG5vdGlmaWNhdGlvbnNSZXNvdXJjZS5hZGRSZXNvdXJjZSgne2lkfScpO1xyXG4gICAgY29uc3Qgbm90aWZpY2F0aW9uUmVhZFJlc291cmNlID0gbm90aWZpY2F0aW9uSWRSZXNvdXJjZS5hZGRSZXNvdXJjZSgncmVhZCcpO1xyXG4gICAgbm90aWZpY2F0aW9uUmVhZFJlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ1BVVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5yZWFkTm90aWZpY2F0aW9uLCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gUFVUIC9ub3RpZmljYXRpb25zL3JlYWQgLSDjgZnjgbnjgabjga7pgJrnn6XjgpLml6Loqq3jgavjgZnjgotcclxuICAgIGNvbnN0IHJlYWRBbGxSZXNvdXJjZSA9IG5vdGlmaWNhdGlvbnNSZXNvdXJjZS5hZGRSZXNvdXJjZSgncmVhZCcpO1xyXG4gICAgcmVhZEFsbFJlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ1BVVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5yZWFkQWxsTm90aWZpY2F0aW9ucywge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEdFVCAvbm90aWZpY2F0aW9ucy9zZXR0aW5ncyAtIOmAmuefpeioreWumuWPluW+l1xyXG4gICAgY29uc3Qgbm90aWZpY2F0aW9uU2V0dGluZ3NSZXNvdXJjZSA9IG5vdGlmaWNhdGlvbnNSZXNvdXJjZS5hZGRSZXNvdXJjZSgnc2V0dGluZ3MnKTtcclxuICAgIG5vdGlmaWNhdGlvblNldHRpbmdzUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldE5vdGlmaWNhdGlvblNldHRpbmdzLCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gUFVUIC9ub3RpZmljYXRpb25zL3NldHRpbmdzIC0g6YCa55+l6Kit5a6a5pu05pawXHJcbiAgICBub3RpZmljYXRpb25TZXR0aW5nc1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ1BVVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy51cGRhdGVOb3RpZmljYXRpb25TZXR0aW5ncywge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIC9zZXNzaW9ucyDjg6rjgr3jg7zjgrnvvIjjgrvjg4Pjgrfjg6fjg7PmqZ/og73vvIlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBjb25zdCBzZXNzaW9uc1Jlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgnc2Vzc2lvbnMnKTtcclxuXHJcbiAgICAvLyBQT1NUIC9zZXNzaW9ucyAtIOOCu+ODg+OCt+ODp+ODs+S9nOaIkFxyXG4gICAgc2Vzc2lvbnNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmNyZWF0ZVNlc3Npb24sIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEdFVCAvYWNjb3VudHMve2FjY291bnRfaWR9L3Nlc3Npb25zIC0g44Ki44Kr44Km44Oz44OI44Gu44K744OD44K344On44Oz5LiA6Kan5Y+W5b6XXHJcbiAgICBjb25zdCBhY2NvdW50U2Vzc2lvbnNSZXNvdXJjZSA9IGFjY291bnRSZXNvdXJjZS5hZGRSZXNvdXJjZSgnc2Vzc2lvbnMnKTtcclxuICAgIGFjY291bnRTZXNzaW9uc1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0dFVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXRBY2NvdW50U2Vzc2lvbnMsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBERUxFVEUgL3Nlc3Npb25zL3tkZXZpY2VfaWR9IC0g44K744OD44K344On44Oz5YmK6ZmkXHJcbiAgICBjb25zdCBzZXNzaW9uRGV2aWNlUmVzb3VyY2UgPSBzZXNzaW9uc1Jlc291cmNlLmFkZFJlc291cmNlKCd7ZGV2aWNlX2lkfScpO1xyXG4gICAgc2Vzc2lvbkRldmljZVJlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0RFTEVURScsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5kZWxldGVTZXNzaW9uLCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIC9oYXNodGFncyDjg6rjgr3jg7zjgrnvvIjjg4/jg4Pjgrfjg6Xjgr/jgrDmqZ/og73vvIlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBjb25zdCBoYXNodGFnc1Jlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgnaGFzaHRhZ3MnKTtcclxuXHJcbiAgICAvLyBHRVQgL2hhc2h0YWdzL3RyZW5kaW5nIC0g44OI44Os44Oz44OH44Kj44Oz44Kw44OP44OD44K344Ol44K/44Kw5Y+W5b6XXHJcbiAgICBjb25zdCB0cmVuZGluZ1Jlc291cmNlID0gaGFzaHRhZ3NSZXNvdXJjZS5hZGRSZXNvdXJjZSgndHJlbmRpbmcnKTtcclxuICAgIHRyZW5kaW5nUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldFRyZW5kaW5nSGFzaHRhZ3MsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL2hhc2h0YWdzL3toYXNodGFnfS9wb3N0cyAtIOODj+ODg+OCt+ODpeOCv+OCsOOBruaKleeov+WPluW+l1xyXG4gICAgY29uc3QgaGFzaHRhZ1Jlc291cmNlID0gaGFzaHRhZ3NSZXNvdXJjZS5hZGRSZXNvdXJjZSgne2hhc2h0YWd9Jyk7XHJcbiAgICBjb25zdCBoYXNodGFnUG9zdHNSZXNvdXJjZSA9IGhhc2h0YWdSZXNvdXJjZS5hZGRSZXNvdXJjZSgncG9zdHMnKTtcclxuICAgIGhhc2h0YWdQb3N0c1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0dFVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXRIYXNodGFnUG9zdHMsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gL211dGUg44Oq44K944O844K577yI44Of44Ol44O844OI5qmf6IO977yJXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgY29uc3QgbXV0ZVJlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgnbXV0ZScpO1xyXG5cclxuICAgIC8vIFBPU1QgL211dGUgLSDjgqLjgqvjgqbjg7Pjg4jjgpLjg5/jg6Xjg7zjg4hcclxuICAgIG11dGVSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLm11dGVBY2NvdW50LCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL211dGUgLSDjg5/jg6Xjg7zjg4jjg6rjgrnjg4jlj5blvpdcclxuICAgIG11dGVSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdHRVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0TXV0ZUxpc3QsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBERUxFVEUgL211dGUve2FjY291bnRfaWR9IC0g44Of44Ol44O844OI6Kej6ZmkXHJcbiAgICBjb25zdCBtdXRlQWNjb3VudFJlc291cmNlID0gbXV0ZVJlc291cmNlLmFkZFJlc291cmNlKCd7YWNjb3VudF9pZH0nKTtcclxuICAgIG11dGVBY2NvdW50UmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnREVMRVRFJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLnVubXV0ZUFjY291bnQsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gU3RhZ2UgMkE6IEV4aXN0aW5nIEZlYXR1cmUgRXh0ZW5zaW9ucyAoMTQgZW5kcG9pbnRzKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuXHJcbiAgICAvLyBQVVQgL3Bvc3RzL3twb3N0X2lkfSAtIOaKleeov+abtOaWsFxyXG4gICAgcG9zdFJlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ1BVVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy51cGRhdGVQb3N0LCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL2FjY291bnRzL3thY2NvdW50X2lkfS9wb3N0cyAtIOODpuODvOOCtuODvOaKleeov+S4gOimp1xyXG4gICAgY29uc3QgYWNjb3VudFBvc3RzUmVzb3VyY2UgPSBhY2NvdW50UmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3Bvc3RzJyk7XHJcbiAgICBhY2NvdW50UG9zdHNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdHRVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0VXNlclBvc3RzLCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL2ZlZWQvZGlzY292ZXJ5IC0g55m66KaL44OV44Kj44O844OJXHJcbiAgICBjb25zdCBmZWVkUmVzb3VyY2UgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdmZWVkJyk7XHJcbiAgICBmZWVkUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2Rpc2NvdmVyeScpLmFkZE1ldGhvZChcclxuICAgICAgJ0dFVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXREaXNjb3ZlcnlGZWVkLCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyB7cm9vbV9pZH3jg6rjgr3jg7zjgrnkvZzmiJDvvIjlvozntprjga7jgqjjg7Pjg4njg53jgqTjg7Pjg4jjgafkvb/nlKjvvIlcclxuICAgIGNvbnN0IHJvb21SZXNvdXJjZSA9IHJvb21zUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3tyb29tX2lkfScpO1xyXG5cclxuICAgIC8vIEdFVCAvcm9vbXMve3Jvb21faWR9L3Bvc3RzIC0g44Or44O844Og5oqV56i/5LiA6KanXHJcbiAgICBjb25zdCByb29tUG9zdHNSZXNvdXJjZSA9IHJvb21SZXNvdXJjZS5hZGRSZXNvdXJjZSgncG9zdHMnKTtcclxuICAgIHJvb21Qb3N0c1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0dFVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXRSb29tUG9zdHMsIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEdFVCAvYWNjb3VudHMve2FjY291bnRfaWR9L2ZvbGxvd2luZyAtIOODleOCqeODreODvOS4reS4gOimp1xyXG4gICAgY29uc3QgYWNjb3VudEZvbGxvd2luZ1Jlc291cmNlID0gYWNjb3VudFJlc291cmNlLmFkZFJlc291cmNlKCdmb2xsb3dpbmcnKTtcclxuICAgIGFjY291bnRGb2xsb3dpbmdSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdHRVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0Rm9sbG93aW5nLCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL2FjY291bnRzL3thY2NvdW50X2lkfS9mb2xsb3dlcnMgLSDjg5Xjgqnjg63jg6/jg7zkuIDopqdcclxuICAgIGNvbnN0IGFjY291bnRGb2xsb3dlcnNSZXNvdXJjZSA9IGFjY291bnRSZXNvdXJjZS5hZGRSZXNvdXJjZSgnZm9sbG93ZXJzJyk7XHJcbiAgICBhY2NvdW50Rm9sbG93ZXJzUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldEZvbGxvd2VycywgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gR0VUIC9wb3N0cy97cG9zdF9pZH0vbGlrZXMgLSDmipXnqL/jga7jgYTjgYTjga3kuIDopqdcclxuICAgIGNvbnN0IHBvc3RMaWtlc1Jlc291cmNlID0gcG9zdFJlc291cmNlLmFkZFJlc291cmNlKCdsaWtlcycpO1xyXG4gICAgcG9zdExpa2VzUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldFBvc3RMaWtlcywgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gR0VUIC9hY2NvdW50cy97YWNjb3VudF9pZH0vbGlrZXMgLSDjg6bjg7zjgrbjg7zjga7jgYTjgYTjga3kuIDopqdcclxuICAgIGNvbnN0IGFjY291bnRMaWtlc1Jlc291cmNlID0gYWNjb3VudFJlc291cmNlLmFkZFJlc291cmNlKCdsaWtlcycpO1xyXG4gICAgYWNjb3VudExpa2VzUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldFVzZXJMaWtlcywgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gR0VUIC9hY2NvdW50cy97YWNjb3VudF9pZH0vcmVwb3N0cyAtIOODpuODvOOCtuODvOOBruODquODneOCueODiOS4gOimp1xyXG4gICAgY29uc3QgYWNjb3VudFJlcG9zdHNSZXNvdXJjZSA9IGFjY291bnRSZXNvdXJjZS5hZGRSZXNvdXJjZSgncmVwb3N0cycpO1xyXG4gICAgYWNjb3VudFJlcG9zdHNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdHRVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0VXNlclJlcG9zdHMsIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEdFVCAvcG9zdHMve3Bvc3RfaWR9L3JlcG9zdHMgLSDmipXnqL/jga7jg6rjg53jgrnjg4jkuIDopqdcclxuICAgIGNvbnN0IHBvc3RSZXBvc3RzUmVzb3VyY2UgPSBwb3N0UmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3JlcG9zdHMnKTtcclxuICAgIHBvc3RSZXBvc3RzUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldFBvc3RSZXBvc3RzLCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL3Jvb21zL3tyb29tX2lkfSAtIOODq+ODvOODoOips+e0sFxyXG4gICAgcm9vbVJlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0dFVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXRSb29tLCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBQVVQgL3Jvb21zL3tyb29tX2lkfSAtIOODq+ODvOODoOabtOaWsFxyXG4gICAgcm9vbVJlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ1BVVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy51cGRhdGVSb29tLCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBQT1NUIC9yb29tcy97cm9vbV9pZH0vam9pbiAtIFJPT03lj4LliqBcclxuICAgIGNvbnN0IGpvaW5SZXNvdXJjZSA9IHJvb21SZXNvdXJjZS5hZGRSZXNvdXJjZSgnam9pbicpO1xyXG4gICAgam9pblJlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ1BPU1QnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuam9pblJvb20sIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL3Jvb21zL3tyb29tX2lkfS9tZW1iZXJzIC0g44Or44O844Og44Oh44Oz44OQ44O85LiA6KanXHJcbiAgICBjb25zdCByb29tTWVtYmVyc1Jlc291cmNlID0gcm9vbVJlc291cmNlLmFkZFJlc291cmNlKCdtZW1iZXJzJyk7XHJcbiAgICByb29tTWVtYmVyc1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0dFVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXRSb29tTWVtYmVycywgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gREVMRVRFIC9yb29tcy97cm9vbV9pZH0vbWVtYmVycy9tZSAtIOODq+ODvOODoOmAgOWHulxyXG4gICAgcm9vbU1lbWJlcnNSZXNvdXJjZS5hZGRSZXNvdXJjZSgnbWUnKS5hZGRNZXRob2QoXHJcbiAgICAgICdERUxFVEUnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMubGVhdmVSb29tLCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gU3RhZ2UgMkI6IEFuYWx5dGljcyAoNCBlbmRwb2ludHMpXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5cclxuICAgIC8vIFBPU1QgL2FuYWx5dGljcy9ldmVudHMgLSDjgqTjg5njg7Pjg4jov73ot6FcclxuICAgIGNvbnN0IGFuYWx5dGljc1Jlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgnYW5hbHl0aWNzJyk7XHJcbiAgICBhbmFseXRpY3NSZXNvdXJjZS5hZGRSZXNvdXJjZSgnZXZlbnRzJykuYWRkTWV0aG9kKFxyXG4gICAgICAnUE9TVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy50cmFja0V2ZW50LCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL3Bvc3RzL3twb3N0X2lkfS9hbmFseXRpY3MgLSDmipXnqL/liIbmnpDjg4fjg7zjgr9cclxuICAgIHBvc3RSZXNvdXJjZVxyXG4gICAgICAuYWRkUmVzb3VyY2UoJ2FuYWx5dGljcycpXHJcbiAgICAgIC5hZGRNZXRob2QoXHJcbiAgICAgICAgJ0dFVCcsXHJcbiAgICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldFBvc3RBbmFseXRpY3MsIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgICAgfVxyXG4gICAgICApO1xyXG5cclxuICAgIC8vIEdFVCAvYWNjb3VudHMve2FjY291bnRfaWR9L2FuYWx5dGljcyAtIOOCouOCq+OCpuODs+ODiOWIhuaekOODh+ODvOOCv1xyXG4gICAgYWNjb3VudFJlc291cmNlXHJcbiAgICAgIC5hZGRSZXNvdXJjZSgnYW5hbHl0aWNzJylcclxuICAgICAgLmFkZE1ldGhvZChcclxuICAgICAgICAnR0VUJyxcclxuICAgICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0QWNjb3VudEFuYWx5dGljcywgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgICB9XHJcbiAgICAgICk7XHJcblxyXG4gICAgLy8gR0VUIC9kYXNoYm9hcmQgLSDjg4Djg4Pjgrfjg6Xjg5zjg7zjg4lcclxuICAgIHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2Rhc2hib2FyZCcpLmFkZE1ldGhvZChcclxuICAgICAgJ0dFVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXREYXNoYm9hcmQsIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyBTdGFnZSAyQzogUHJvZHVjdC9TaG9wICg4IGVuZHBvaW50cylcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG4gICAgLy8gUE9TVCAvcHJvZHVjdHMgLSDllYblk4HkvZzmiJBcclxuICAgIGNvbnN0IHByb2R1Y3RzUmVzb3VyY2UgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdwcm9kdWN0cycpO1xyXG4gICAgcHJvZHVjdHNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmNyZWF0ZVByb2R1Y3QsIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEdFVCAvcHJvZHVjdHMgLSDllYblk4HkuIDopqdcclxuICAgIHByb2R1Y3RzUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldFByb2R1Y3RzLCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL3Byb2R1Y3RzL3twcm9kdWN0X2lkfSAtIOWVhuWTgeips+e0sFxyXG4gICAgY29uc3QgcHJvZHVjdElkUmVzb3VyY2UgPSBwcm9kdWN0c1Jlc291cmNlLmFkZFJlc291cmNlKCd7cHJvZHVjdF9pZH0nKTtcclxuICAgIHByb2R1Y3RJZFJlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0dFVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXRQcm9kdWN0LCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBQVVQgL3Byb2R1Y3RzL3twcm9kdWN0X2lkfSAtIOWVhuWTgeabtOaWsFxyXG4gICAgcHJvZHVjdElkUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnUFVUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLnVwZGF0ZVByb2R1Y3QsIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIERFTEVURSAvcHJvZHVjdHMve3Byb2R1Y3RfaWR9IC0g5ZWG5ZOB5YmK6ZmkXHJcbiAgICBwcm9kdWN0SWRSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdERUxFVEUnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZGVsZXRlUHJvZHVjdCwgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gUE9TVCAvcHJvZHVjdHMve3Byb2R1Y3RfaWR9L2NsaWNrIC0g44Kv44Oq44OD44Kv6L+96LehXHJcbiAgICBwcm9kdWN0SWRSZXNvdXJjZS5hZGRSZXNvdXJjZSgnY2xpY2snKS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmNsaWNrUHJvZHVjdCwgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gL3Bvc3RzL3twb3N0X2lkfS9wcm9kdWN0cyAtIOaKleeov+OBruWVhuWTgVxyXG4gICAgY29uc3QgcG9zdFByb2R1Y3RzUmVzb3VyY2UgPSBwb3N0UmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3Byb2R1Y3RzJyk7XHJcblxyXG4gICAgLy8gUE9TVCAvcG9zdHMve3Bvc3RfaWR9L3Byb2R1Y3RzIC0g5oqV56i/44Gr5ZWG5ZOB44K/44Kw5LuY44GRXHJcbiAgICBwb3N0UHJvZHVjdHNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLnRhZ1Byb2R1Y3RPblBvc3QsIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEdFVCAvcG9zdHMve3Bvc3RfaWR9L3Byb2R1Y3RzIC0g5oqV56i/44Gu5ZWG5ZOB5LiA6KanXHJcbiAgICBwb3N0UHJvZHVjdHNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdHRVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0UG9zdFByb2R1Y3RzLCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gU3RhZ2UgMkU6IExpdmUgU3RyZWFtaW5nICgxNCBSRVNUIEFQSSBlbmRwb2ludHMpXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5cclxuICAgIC8vIFBPU1QgL2xpdmUtc3RyZWFtcyAtIOODqeOCpOODlumFjeS/oeS9nOaIkFxyXG4gICAgY29uc3QgbGl2ZVN0cmVhbXNSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2xpdmUtc3RyZWFtcycpO1xyXG4gICAgbGl2ZVN0cmVhbXNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmNyZWF0ZUxpdmVTdHJlYW0sIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEdFVCAvbGl2ZS1zdHJlYW1zIC0g44Op44Kk44OW6YWN5L+h5LiA6KanXHJcbiAgICBsaXZlU3RyZWFtc1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0dFVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXRMaXZlU3RyZWFtcywgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gR0VUIC9saXZlLXN0cmVhbXMve3N0cmVhbV9pZH0gLSDjg6njgqTjg5bphY3kv6HoqbPntLBcclxuICAgIGNvbnN0IHN0cmVhbUlkUmVzb3VyY2UgPSBsaXZlU3RyZWFtc1Jlc291cmNlLmFkZFJlc291cmNlKCd7c3RyZWFtX2lkfScpO1xyXG4gICAgc3RyZWFtSWRSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdHRVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0TGl2ZVN0cmVhbSwgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gREVMRVRFIC9saXZlLXN0cmVhbXMve3N0cmVhbV9pZH0gLSDjg6njgqTjg5bphY3kv6HliYrpmaRcclxuICAgIHN0cmVhbUlkUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnREVMRVRFJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmRlbGV0ZUxpdmVTdHJlYW0sIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIFBPU1QgL2xpdmUtc3RyZWFtcy97c3RyZWFtX2lkfS9lbmQgLSDphY3kv6HntYLkuoZcclxuICAgIHN0cmVhbUlkUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2VuZCcpLmFkZE1ldGhvZChcclxuICAgICAgJ1BPU1QnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZW5kTGl2ZVN0cmVhbSwgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gUE9TVCAvbGl2ZS1zdHJlYW1zL3tzdHJlYW1faWR9L2pvaW4gLSDphY3kv6Hlj4LliqBcclxuICAgIHN0cmVhbUlkUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2pvaW4nKS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmpvaW5MaXZlU3RyZWFtLCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBQT1NUIC9saXZlLXN0cmVhbXMve3N0cmVhbV9pZH0vbGVhdmUgLSDphY3kv6HpgIDlh7pcclxuICAgIHN0cmVhbUlkUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2xlYXZlJykuYWRkTWV0aG9kKFxyXG4gICAgICAnUE9TVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5sZWF2ZUxpdmVTdHJlYW0sIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEdFVCAvbGl2ZS1zdHJlYW1zL3tzdHJlYW1faWR9L2NoYXQgLSDjg4Hjg6Pjg4Pjg4jkuIDopqdcclxuICAgIGNvbnN0IGNoYXRSZXNvdXJjZSA9IHN0cmVhbUlkUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2NoYXQnKTtcclxuICAgIGNoYXRSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdHRVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0TGl2ZUNoYXRzLCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBQT1NUIC9saXZlLXN0cmVhbXMve3N0cmVhbV9pZH0vY2hhdCAtIOODgeODo+ODg+ODiOmAgeS/oVxyXG4gICAgY2hhdFJlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ1BPU1QnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuc2VuZExpdmVDaGF0LCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBQT1NUIC9saXZlLXN0cmVhbXMve3N0cmVhbV9pZH0vZ2lmdHMgLSDjgq7jg5Xjg4jpgIHkv6FcclxuICAgIHN0cmVhbUlkUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2dpZnRzJykuYWRkTWV0aG9kKFxyXG4gICAgICAnUE9TVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5zZW5kR2lmdCwgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gUE9TVCAvbGl2ZS1zdHJlYW1zL3tzdHJlYW1faWR9L21vZGVyYXRvcnMgLSDjg6Ljg4fjg6zjg7zjgr/jg7zov73liqBcclxuICAgIHN0cmVhbUlkUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ21vZGVyYXRvcnMnKS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmFkZE1vZGVyYXRvciwgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gUE9TVCAvbGl2ZS1zdHJlYW1zL3tzdHJlYW1faWR9L2JhbiAtIOODpuODvOOCtuODvEJBTlxyXG4gICAgc3RyZWFtSWRSZXNvdXJjZS5hZGRSZXNvdXJjZSgnYmFuJykuYWRkTWV0aG9kKFxyXG4gICAgICAnUE9TVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5iYW5Vc2VyRnJvbUxpdmUsIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIFBPU1QgL3dlYmhvb2tzL211eCAtIE11eCBXZWJob29r77yI6KqN6Ki844Gq44GX77yJXHJcbiAgICB0aGlzLmFwaS5yb290XHJcbiAgICAgIC5hZGRSZXNvdXJjZSgnd2ViaG9va3MnKVxyXG4gICAgICAuYWRkUmVzb3VyY2UoJ211eCcpXHJcbiAgICAgIC5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMubXV4V2ViaG9vaywgeyBwcm94eTogdHJ1ZSB9KSwge1xyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLk5PTkUsXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIE91dHB1dHNcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpVXJsJywge1xyXG4gICAgICB2YWx1ZTogdGhpcy5hcGkudXJsLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBHYXRld2F5IFVSTCcsXHJcbiAgICAgIGV4cG9ydE5hbWU6IGBQaWVjZUFwcC1BcGlVcmwtJHtlbnZpcm9ubWVudH1gLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FwaUlkJywge1xyXG4gICAgICB2YWx1ZTogdGhpcy5hcGkucmVzdEFwaUlkLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBHYXRld2F5IElEJyxcclxuICAgICAgZXhwb3J0TmFtZTogYFBpZWNlQXBwLUFwaUlkLSR7ZW52aXJvbm1lbnR9YCxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iXX0=