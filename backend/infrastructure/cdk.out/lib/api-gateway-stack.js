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
        postsResource
            .addResource('{post_id}')
            .addMethod('PUT', new apigateway.LambdaIntegration(lambdaFunctions.updatePost, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /accounts/{account_id}/posts - ユーザー投稿一覧
        const accountPostsResource = accountsResource
            .addResource('{account_id}')
            .addResource('posts');
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
        // GET /rooms/{room_id}/posts - ルーム投稿一覧
        const roomPostsResource = roomsResource
            .addResource('{room_id}')
            .addResource('posts');
        roomPostsResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getRoomPosts, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /accounts/{account_id}/following - フォロー中一覧
        const accountFollowingResource = accountsResource
            .addResource('{account_id}')
            .addResource('following');
        accountFollowingResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getFollowing, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /accounts/{account_id}/followers - フォロワー一覧
        const accountFollowersResource = accountsResource
            .addResource('{account_id}')
            .addResource('followers');
        accountFollowersResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getFollowers, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /posts/{post_id}/likes - 投稿のいいね一覧
        const postLikesResource = postsResource
            .addResource('{post_id}')
            .addResource('likes');
        postLikesResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getPostLikes, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /accounts/{account_id}/likes - ユーザーのいいね一覧
        const accountLikesResource = accountsResource
            .addResource('{account_id}')
            .addResource('likes');
        accountLikesResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getUserLikes, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /accounts/{account_id}/reposts - ユーザーのリポスト一覧
        const accountRepostsResource = accountsResource
            .addResource('{account_id}')
            .addResource('reposts');
        accountRepostsResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getUserReposts, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /posts/{post_id}/reposts - 投稿のリポスト一覧
        const postRepostsResource = postsResource
            .addResource('{post_id}')
            .addResource('reposts');
        postRepostsResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getPostReposts, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /rooms/{room_id} - ルーム詳細
        const roomResource = roomsResource.addResource('{room_id}');
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
        postsResource
            .addResource('{post_id}')
            .addResource('analytics')
            .addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getPostAnalytics, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /accounts/{account_id}/analytics - アカウント分析データ
        accountsResource
            .addResource('{account_id}')
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
        // POST /posts/{post_id}/products - 投稿に商品タグ付け
        postsResource
            .addResource('{post_id}')
            .addResource('products')
            .addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.tagProductOnPost, { proxy: true }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /posts/{post_id}/products - 投稿の商品一覧
        postsResource
            .addResource('{post_id}')
            .addResource('products')
            .addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getPostProducts, { proxy: true }), {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLWdhdGV3YXktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvYXBpLWdhdGV3YXktc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsaURBQW1DO0FBQ25DLHVFQUF5RDtBQUd6RCwyREFBNkM7QUE0SDdDLE1BQWEsZUFBZ0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUk1QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTJCO1FBQ25FLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sRUFBRSxXQUFXLEVBQUUsZUFBZSxFQUFFLFFBQVEsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUV6RCx3REFBd0Q7UUFDeEQsa0JBQWtCO1FBQ2xCLHdEQUF3RDtRQUN4RCxNQUFNLGNBQWMsR0FBRyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLHNCQUFzQixFQUFFO1lBQ3JFLFlBQVksRUFBRSw2QkFBNkIsV0FBVyxFQUFFO1lBQ3hELFNBQVMsRUFBRSxXQUFXLEtBQUssTUFBTTtnQkFDL0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUztnQkFDOUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUTtZQUMvQixhQUFhLEVBQUUsV0FBVyxLQUFLLE1BQU07Z0JBQ25DLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU07Z0JBQzFCLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDOUIsQ0FBQyxDQUFDO1FBRUgsd0RBQXdEO1FBQ3hELGFBQWE7UUFDYix3REFBd0Q7UUFDeEQsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ3pE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biAqIEFQSSBHYXRld2F5IChSRVNUIEFQSSkgU3RhY2tcclxuICogUmVhY3QgTmF0aXZl44Ki44OX44Oq5ZCR44GR44GuUkVTVCBBUEnoqK3lrppcclxuICovXHJcblxyXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xyXG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcclxuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xyXG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2duaXRvJztcclxuaW1wb3J0ICogYXMgbG9ncyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbG9ncyc7XHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xyXG5cclxuaW50ZXJmYWNlIEFwaUdhdGV3YXlTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xyXG4gIGVudmlyb25tZW50OiAnZGV2JyB8ICdwcm9kJztcclxuICBsYW1iZGFGdW5jdGlvbnM6IHtcclxuICAgIC8vIEFjY291bnRcclxuICAgIGNyZWF0ZUFjY291bnQ6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldFByb2ZpbGU6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIHVwZGF0ZVByb2ZpbGU6IGxhbWJkYS5GdW5jdGlvbjtcclxuXHJcbiAgICAvLyBQb3N0XHJcbiAgICBjcmVhdGVQb3N0OiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBnZXRQb3N0OiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBkZWxldGVQb3N0OiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBnZXRUaW1lbGluZTogbGFtYmRhLkZ1bmN0aW9uO1xyXG5cclxuICAgIC8vIExpa2VcclxuICAgIGxpa2VQb3N0OiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICB1bmxpa2VQb3N0OiBsYW1iZGEuRnVuY3Rpb247XHJcblxyXG4gICAgLy8gQ29tbWVudFxyXG4gICAgY3JlYXRlQ29tbWVudDogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZGVsZXRlQ29tbWVudDogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZ2V0Q29tbWVudHM6IGxhbWJkYS5GdW5jdGlvbjtcclxuXHJcbiAgICAvLyBGb2xsb3dcclxuICAgIGZvbGxvd1VzZXI6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIHVuZm9sbG93VXNlcjogbGFtYmRhLkZ1bmN0aW9uO1xyXG5cclxuICAgIC8vIFJvb21cclxuICAgIGNyZWF0ZVJvb206IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGpvaW5Sb29tOiBsYW1iZGEuRnVuY3Rpb247XHJcblxyXG4gICAgLy8gRE0gKENvbnZlcnNhdGlvbiAmIE1lc3NhZ2UpXHJcbiAgICBjcmVhdGVDb252ZXJzYXRpb246IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldENvbnZlcnNhdGlvbnM6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIHNlbmRNZXNzYWdlOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBnZXRNZXNzYWdlczogbGFtYmRhLkZ1bmN0aW9uO1xyXG5cclxuICAgIC8vIEJsb2NrXHJcbiAgICBibG9ja1VzZXI6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIHVuYmxvY2tVc2VyOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBnZXRCbG9ja0xpc3Q6IGxhbWJkYS5GdW5jdGlvbjtcclxuXHJcbiAgICAvLyBSZXBvc3RcclxuICAgIGNyZWF0ZVJlcG9zdDogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZGVsZXRlUmVwb3N0OiBsYW1iZGEuRnVuY3Rpb247XHJcblxyXG4gICAgLy8gUmVwb3J0XHJcbiAgICBjcmVhdGVSZXBvcnQ6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldFJlcG9ydHM6IGxhbWJkYS5GdW5jdGlvbjtcclxuXHJcbiAgICAvLyBOb3RpZmljYXRpb25cclxuICAgIGdldE5vdGlmaWNhdGlvbnM6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIHJlYWROb3RpZmljYXRpb246IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIHJlYWRBbGxOb3RpZmljYXRpb25zOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBnZXROb3RpZmljYXRpb25TZXR0aW5nczogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgdXBkYXRlTm90aWZpY2F0aW9uU2V0dGluZ3M6IGxhbWJkYS5GdW5jdGlvbjtcclxuXHJcbiAgICAvLyBTZXNzaW9uXHJcbiAgICBjcmVhdGVTZXNzaW9uOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBnZXRBY2NvdW50U2Vzc2lvbnM6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGRlbGV0ZVNlc3Npb246IGxhbWJkYS5GdW5jdGlvbjtcclxuXHJcbiAgICAvLyBIYXNodGFnXHJcbiAgICBnZXRIYXNodGFnUG9zdHM6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldFRyZW5kaW5nSGFzaHRhZ3M6IGxhbWJkYS5GdW5jdGlvbjtcclxuXHJcbiAgICAvLyBNdXRlXHJcbiAgICBtdXRlQWNjb3VudDogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgdW5tdXRlQWNjb3VudDogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZ2V0TXV0ZUxpc3Q6IGxhbWJkYS5GdW5jdGlvbjtcclxuXHJcbiAgICAvLyBTdGFnZSAyQTogRXhpc3RpbmcgRmVhdHVyZSBFeHRlbnNpb25zXHJcbiAgICB1cGRhdGVQb3N0OiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBnZXRVc2VyUG9zdHM6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldERpc2NvdmVyeUZlZWQ6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldFJvb21Qb3N0czogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZ2V0Rm9sbG93aW5nOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBnZXRGb2xsb3dlcnM6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldFBvc3RMaWtlczogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZ2V0VXNlckxpa2VzOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBnZXRVc2VyUmVwb3N0czogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZ2V0UG9zdFJlcG9zdHM6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldFJvb206IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIHVwZGF0ZVJvb206IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldFJvb21NZW1iZXJzOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBsZWF2ZVJvb206IGxhbWJkYS5GdW5jdGlvbjtcclxuXHJcbiAgICAvLyBTdGFnZSAyQjogQW5hbHl0aWNzXHJcbiAgICB0cmFja0V2ZW50OiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBnZXRQb3N0QW5hbHl0aWNzOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBnZXRBY2NvdW50QW5hbHl0aWNzOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBnZXREYXNoYm9hcmQ6IGxhbWJkYS5GdW5jdGlvbjtcclxuXHJcbiAgICAvLyBTdGFnZSAyQzogUHJvZHVjdC9TaG9wXHJcbiAgICBjcmVhdGVQcm9kdWN0OiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBnZXRQcm9kdWN0OiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICB1cGRhdGVQcm9kdWN0OiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBkZWxldGVQcm9kdWN0OiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBnZXRQcm9kdWN0czogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgdGFnUHJvZHVjdE9uUG9zdDogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZ2V0UG9zdFByb2R1Y3RzOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBjbGlja1Byb2R1Y3Q6IGxhbWJkYS5GdW5jdGlvbjtcclxuXHJcbiAgICAvLyBTdGFnZSAyRTogTGl2ZSBTdHJlYW1pbmdcclxuICAgIGNyZWF0ZUxpdmVTdHJlYW06IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGRlbGV0ZUxpdmVTdHJlYW06IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldExpdmVTdHJlYW06IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldExpdmVTdHJlYW1zOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBlbmRMaXZlU3RyZWFtOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBqb2luTGl2ZVN0cmVhbTogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgbGVhdmVMaXZlU3RyZWFtOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBzZW5kTGl2ZUNoYXQ6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldExpdmVDaGF0czogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgc2VuZEdpZnQ6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGFkZE1vZGVyYXRvcjogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgYmFuVXNlckZyb21MaXZlOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBtdXhXZWJob29rOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgfTtcclxuICB1c2VyUG9vbDogY29nbml0by5Vc2VyUG9vbDtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEFwaUdhdGV3YXlTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XHJcbiAgcHVibGljIHJlYWRvbmx5IGFwaTogYXBpZ2F0ZXdheS5SZXN0QXBpO1xyXG4gIHB1YmxpYyByZWFkb25seSBhdXRob3JpemVyOiBhcGlnYXRld2F5LkNvZ25pdG9Vc2VyUG9vbHNBdXRob3JpemVyO1xyXG5cclxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQXBpR2F0ZXdheVN0YWNrUHJvcHMpIHtcclxuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgIGNvbnN0IHsgZW52aXJvbm1lbnQsIGxhbWJkYUZ1bmN0aW9ucywgdXNlclBvb2wgfSA9IHByb3BzO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyBDbG91ZFdhdGNoIExvZ3NcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBjb25zdCBhY2Nlc3NMb2dHcm91cCA9IG5ldyBsb2dzLkxvZ0dyb3VwKHRoaXMsICdBcGlHYXRld2F5QWNjZXNzTG9ncycsIHtcclxuICAgICAgbG9nR3JvdXBOYW1lOiBgL2F3cy9hcGlnYXRld2F5L3BpZWNlLWFwcC0ke2Vudmlyb25tZW50fWAsXHJcbiAgICAgIHJldGVudGlvbjogZW52aXJvbm1lbnQgPT09ICdwcm9kJ1xyXG4gICAgICAgID8gbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9NT05USFxyXG4gICAgICAgIDogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxyXG4gICAgICByZW1vdmFsUG9saWN5OiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnXHJcbiAgICAgICAgPyBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU5cclxuICAgICAgICA6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gUkVTVCBBUEnkvZzmiJBcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICB0aGlzLmFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ1BpZWNlQXBwUmVzdEFwaScsIHtcclxuICAgICAgcmVzdEFwaU5hbWU6IGBwaWVjZS1hcHAtYXBpLSR7ZW52aXJvbm1lbnR9YCxcclxuICAgICAgZGVzY3JpcHRpb246IGBQaWVjZSBBcHAgUkVTVCBBUEkgKCR7ZW52aXJvbm1lbnR9KWAsXHJcblxyXG4gICAgICAvLyDjg4fjg5fjg63jgqTjg6Hjg7Pjg4joqK3lrppcclxuICAgICAgZGVwbG95OiB0cnVlLFxyXG4gICAgICBkZXBsb3lPcHRpb25zOiB7XHJcbiAgICAgICAgc3RhZ2VOYW1lOiBlbnZpcm9ubWVudCxcclxuXHJcbiAgICAgICAgLy8g44Ki44Kv44K744K544Ot44KwXHJcbiAgICAgICAgYWNjZXNzTG9nRGVzdGluYXRpb246IG5ldyBhcGlnYXRld2F5LkxvZ0dyb3VwTG9nRGVzdGluYXRpb24oYWNjZXNzTG9nR3JvdXApLFxyXG4gICAgICAgIGFjY2Vzc0xvZ0Zvcm1hdDogYXBpZ2F0ZXdheS5BY2Nlc3NMb2dGb3JtYXQuanNvbldpdGhTdGFuZGFyZEZpZWxkcyh7XHJcbiAgICAgICAgICBjYWxsZXI6IHRydWUsXHJcbiAgICAgICAgICBodHRwTWV0aG9kOiB0cnVlLFxyXG4gICAgICAgICAgaXA6IHRydWUsXHJcbiAgICAgICAgICBwcm90b2NvbDogdHJ1ZSxcclxuICAgICAgICAgIHJlcXVlc3RUaW1lOiB0cnVlLFxyXG4gICAgICAgICAgcmVzb3VyY2VQYXRoOiB0cnVlLFxyXG4gICAgICAgICAgcmVzcG9uc2VMZW5ndGg6IHRydWUsXHJcbiAgICAgICAgICBzdGF0dXM6IHRydWUsXHJcbiAgICAgICAgICB1c2VyOiB0cnVlLFxyXG4gICAgICAgIH0pLFxyXG5cclxuICAgICAgICAvLyBDbG91ZFdhdGNoIOODoeODiOODquOCr+OCuVxyXG4gICAgICAgIG1ldHJpY3NFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIGxvZ2dpbmdMZXZlbDogYXBpZ2F0ZXdheS5NZXRob2RMb2dnaW5nTGV2ZWwuSU5GTyxcclxuICAgICAgICBkYXRhVHJhY2VFbmFibGVkOiBlbnZpcm9ubWVudCA9PT0gJ2RldicsIC8vIOmWi+eZuueSsOWig+OBruOBv+ips+e0sOODreOCsFxyXG5cclxuICAgICAgICAvLyDjgrnjg63jg4Pjg4jjg6rjg7PjgrBcclxuICAgICAgICB0aHJvdHRsaW5nQnVyc3RMaW1pdDogZW52aXJvbm1lbnQgPT09ICdwcm9kJyA/IDUwMDAgOiAxMDAsXHJcbiAgICAgICAgdGhyb3R0bGluZ1JhdGVMaW1pdDogZW52aXJvbm1lbnQgPT09ICdwcm9kJyA/IDIwMDAgOiA1MCxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIENPUlPoqK3lrprvvIhSZWFjdCBOYXRpdmXlr77lv5zvvIlcclxuICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiB7XHJcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnXHJcbiAgICAgICAgICA/IFsnaHR0cHM6Ly9waWVjZS1hcHAuY29tJywgJ2h0dHBzOi8vd3d3LnBpZWNlLWFwcC5jb20nXSAvLyDmnKznlarjg4njg6HjgqTjg7NcclxuICAgICAgICAgIDogYXBpZ2F0ZXdheS5Db3JzLkFMTF9PUklHSU5TLCAvLyDplovnmbrnkrDlooPjga/lhajoqLHlj69cclxuICAgICAgICBhbGxvd01ldGhvZHM6IGFwaWdhdGV3YXkuQ29ycy5BTExfTUVUSE9EUyxcclxuICAgICAgICBhbGxvd0hlYWRlcnM6IFtcclxuICAgICAgICAgICdDb250ZW50LVR5cGUnLFxyXG4gICAgICAgICAgJ1gtQW16LURhdGUnLFxyXG4gICAgICAgICAgJ0F1dGhvcml6YXRpb24nLFxyXG4gICAgICAgICAgJ1gtQXBpLUtleScsXHJcbiAgICAgICAgICAnWC1BbXotU2VjdXJpdHktVG9rZW4nLFxyXG4gICAgICAgICAgJ1gtQW16LVVzZXItQWdlbnQnLFxyXG4gICAgICAgICAgJ1gtQWNjb3VudC1JZCcsIC8vIOOCq+OCueOCv+ODoOODmOODg+ODgOODvO+8iOmWi+eZuueUqO+8iVxyXG4gICAgICAgICAgJ1gtQWNjb3VudC1UeXBlJywgLy8g44Kr44K544K/44Og44OY44OD44OA44O877yI6ZaL55m655So77yJXHJcbiAgICAgICAgXSxcclxuICAgICAgICBhbGxvd0NyZWRlbnRpYWxzOiB0cnVlLFxyXG4gICAgICAgIG1heEFnZTogY2RrLkR1cmF0aW9uLmhvdXJzKDEpLFxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8g44Ko44Oz44OJ44Od44Kk44Oz44OI6Kit5a6aXHJcbiAgICAgIGVuZHBvaW50Q29uZmlndXJhdGlvbjoge1xyXG4gICAgICAgIHR5cGVzOiBbYXBpZ2F0ZXdheS5FbmRwb2ludFR5cGUuUkVHSU9OQUxdLFxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gQ2xvdWRXYXRjaOioreWumlxyXG4gICAgICBjbG91ZFdhdGNoUm9sZTogdHJ1ZSxcclxuXHJcbiAgICAgIC8vIOWkseaVl+aZguOBruODrOOCueODneODs+OCuVxyXG4gICAgICBkZWZhdWx0TWV0aG9kT3B0aW9uczoge1xyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gQ29nbml0byBBdXRob3JpemVy5L2c5oiQXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgdGhpcy5hdXRob3JpemVyID0gbmV3IGFwaWdhdGV3YXkuQ29nbml0b1VzZXJQb29sc0F1dGhvcml6ZXIoXHJcbiAgICAgIHRoaXMsXHJcbiAgICAgICdDb2duaXRvQXV0aG9yaXplcicsXHJcbiAgICAgIHtcclxuICAgICAgICBjb2duaXRvVXNlclBvb2xzOiBbdXNlclBvb2xdLFxyXG4gICAgICAgIGF1dGhvcml6ZXJOYW1lOiBgcGllY2UtYXBwLWF1dGhvcml6ZXItJHtlbnZpcm9ubWVudH1gLFxyXG4gICAgICAgIGlkZW50aXR5U291cmNlOiAnbWV0aG9kLnJlcXVlc3QuaGVhZGVyLkF1dGhvcml6YXRpb24nLFxyXG4gICAgICAgIHJlc3VsdHNDYWNoZVR0bDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksIC8vIOOCreODo+ODg+OCt+ODpTXliIZcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gQVBJIEdhdGV3YXnjga7jg6Ljg4fjg6vlrprnvqnvvIjjg6rjgq/jgqjjgrnjg4jjg5Djg6rjg4fjg7zjgrfjg6fjg7PnlKjvvIlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBjb25zdCBlcnJvclJlc3BvbnNlTW9kZWwgPSB0aGlzLmFwaS5hZGRNb2RlbCgnRXJyb3JSZXNwb25zZU1vZGVsJywge1xyXG4gICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICBtb2RlbE5hbWU6ICdFcnJvclJlc3BvbnNlJyxcclxuICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5PQkpFQ1QsXHJcbiAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgc3VjY2VzczogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLkJPT0xFQU4gfSxcclxuICAgICAgICAgIGVycm9yOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuT0JKRUNULFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgY29kZTogeyB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIOODquOCr+OCqOOCueODiOODkOODquODh+ODvOOCv+ODvFxyXG4gICAgY29uc3QgcmVxdWVzdFZhbGlkYXRvciA9IG5ldyBhcGlnYXRld2F5LlJlcXVlc3RWYWxpZGF0b3IoXHJcbiAgICAgIHRoaXMsXHJcbiAgICAgICdSZXF1ZXN0VmFsaWRhdG9yJyxcclxuICAgICAge1xyXG4gICAgICAgIHJlc3RBcGk6IHRoaXMuYXBpLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3JOYW1lOiAncmVxdWVzdC1ib2R5LXZhbGlkYXRvcicsXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogdHJ1ZSxcclxuICAgICAgICB2YWxpZGF0ZVJlcXVlc3RQYXJhbWV0ZXJzOiB0cnVlLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAvYWNjb3VudHMg44Oq44K944O844K5XHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgY29uc3QgYWNjb3VudHNSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2FjY291bnRzJyk7XHJcblxyXG4gICAgLy8gUE9TVCAvYWNjb3VudHMgLSDjgqLjgqvjgqbjg7Pjg4jkvZzmiJDvvIjoqo3oqLzkuI3opoHvvIlcclxuICAgIGFjY291bnRzUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnUE9TVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5jcmVhdGVBY2NvdW50LCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuTk9ORSwgLy8g6KqN6Ki85LiN6KaBXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL2FjY291bnRzL3thY2NvdW50X2lkfSAtIOODl+ODreODleOCo+ODvOODq+WPluW+l1xyXG4gICAgY29uc3QgYWNjb3VudFJlc291cmNlID0gYWNjb3VudHNSZXNvdXJjZS5hZGRSZXNvdXJjZSgne2FjY291bnRfaWR9Jyk7XHJcbiAgICBhY2NvdW50UmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldFByb2ZpbGUsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBQVVQgL2FjY291bnRzL3thY2NvdW50X2lkfSAtIOODl+ODreODleOCo+ODvOODq+abtOaWsFxyXG4gICAgYWNjb3VudFJlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ1BVVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy51cGRhdGVQcm9maWxlLCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gL3Bvc3RzIOODquOCveODvOOCuVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIGNvbnN0IHBvc3RzUmVzb3VyY2UgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdwb3N0cycpO1xyXG5cclxuICAgIC8vIFBPU1QgL3Bvc3RzIC0g5oqV56i/5L2c5oiQXHJcbiAgICBwb3N0c1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ1BPU1QnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuY3JlYXRlUG9zdCwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gR0VUIC9wb3N0cy97cG9zdF9pZH0gLSDmipXnqL/lj5blvpdcclxuICAgIGNvbnN0IHBvc3RSZXNvdXJjZSA9IHBvc3RzUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3twb3N0X2lkfScpO1xyXG4gICAgcG9zdFJlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0dFVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXRQb3N0LCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gREVMRVRFIC9wb3N0cy97cG9zdF9pZH0gLSDmipXnqL/liYrpmaRcclxuICAgIHBvc3RSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdERUxFVEUnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZGVsZXRlUG9zdCwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIFBPU1QgL3Bvc3RzL3twb3N0X2lkfS9saWtlIC0g44GE44GE44GtXHJcbiAgICBjb25zdCBsaWtlUmVzb3VyY2UgPSBwb3N0UmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2xpa2UnKTtcclxuICAgIGxpa2VSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmxpa2VQb3N0LCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gREVMRVRFIC9wb3N0cy97cG9zdF9pZH0vbGlrZSAtIOOBhOOBhOOBreino+mZpFxyXG4gICAgbGlrZVJlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0RFTEVURScsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy51bmxpa2VQb3N0LCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gUE9TVCAvcG9zdHMve3Bvc3RfaWR9L2NvbW1lbnRzIC0g44Kz44Oh44Oz44OI5L2c5oiQXHJcbiAgICBjb25zdCBjb21tZW50c1Jlc291cmNlID0gcG9zdFJlc291cmNlLmFkZFJlc291cmNlKCdjb21tZW50cycpO1xyXG4gICAgY29tbWVudHNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmNyZWF0ZUNvbW1lbnQsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEdFVCAvcG9zdHMve3Bvc3RfaWR9L2NvbW1lbnRzIC0g44Kz44Oh44Oz44OI5LiA6Kan5Y+W5b6XXHJcbiAgICBjb21tZW50c1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0dFVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXRDb21tZW50cywge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAvY29tbWVudHMg44Oq44K944O844K5XHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgY29uc3QgY29tbWVudFJvb3RSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2NvbW1lbnRzJyk7XHJcbiAgICBjb25zdCBjb21tZW50UmVzb3VyY2UgPSBjb21tZW50Um9vdFJlc291cmNlLmFkZFJlc291cmNlKCd7Y29tbWVudF9pZH0nKTtcclxuXHJcbiAgICAvLyBERUxFVEUgL2NvbW1lbnRzL3tjb21tZW50X2lkfSAtIOOCs+ODoeODs+ODiOWJiumZpFxyXG4gICAgY29tbWVudFJlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0RFTEVURScsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5kZWxldGVDb21tZW50LCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIC90aW1lbGluZSDjg6rjgr3jg7zjgrlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBjb25zdCB0aW1lbGluZVJlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgndGltZWxpbmUnKTtcclxuICAgIHRpbWVsaW5lUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldFRpbWVsaW5lLCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIC9mb2xsb3cg44Oq44K944O844K5XHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgY29uc3QgZm9sbG93UmVzb3VyY2UgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdmb2xsb3cnKTtcclxuXHJcbiAgICAvLyBQT1NUIC9mb2xsb3cgLSDjg5Xjgqnjg63jg7xcclxuICAgIGZvbGxvd1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ1BPU1QnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZm9sbG93VXNlciwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gREVMRVRFIC9mb2xsb3cgLSDjg5Xjgqnjg63jg7zop6PpmaRcclxuICAgIGZvbGxvd1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0RFTEVURScsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy51bmZvbGxvd1VzZXIsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAvcm9vbXMg44Oq44K944O844K5XHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgY29uc3Qgcm9vbXNSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3Jvb21zJyk7XHJcblxyXG4gICAgLy8gUE9TVCAvcm9vbXMgLSBST09N5L2c5oiQXHJcbiAgICByb29tc1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ1BPU1QnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuY3JlYXRlUm9vbSwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gUE9TVCAvcm9vbXMve3Jvb21faWR9L2pvaW4gLSBST09N5Y+C5YqgICjlvozjgafkvZzmiJDjgZnjgovjgZ/jgoHjgIHjgZPjgZPjgafjga/jgrnjgq3jg4Pjg5cpXHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIC9jb252ZXJzYXRpb25zIOODquOCveODvOOCue+8iERN5qmf6IO977yJXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgY29uc3QgY29udmVyc2F0aW9uc1Jlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgnY29udmVyc2F0aW9ucycpO1xyXG5cclxuICAgIC8vIFBPU1QgL2NvbnZlcnNhdGlvbnMgLSDkvJroqbHkvZzmiJBcclxuICAgIGNvbnZlcnNhdGlvbnNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmNyZWF0ZUNvbnZlcnNhdGlvbiwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gR0VUIC9jb252ZXJzYXRpb25zIC0g5Lya6Kmx5LiA6Kan5Y+W5b6XXHJcbiAgICBjb252ZXJzYXRpb25zUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldENvbnZlcnNhdGlvbnMsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyAvY29udmVyc2F0aW9ucy97Y29udmVyc2F0aW9uX2lkfSDjg6rjgr3jg7zjgrlcclxuICAgIGNvbnN0IGNvbnZlcnNhdGlvblJlc291cmNlID0gY29udmVyc2F0aW9uc1Jlc291cmNlLmFkZFJlc291cmNlKCd7Y29udmVyc2F0aW9uX2lkfScpO1xyXG5cclxuICAgIC8vIFBPU1QgL2NvbnZlcnNhdGlvbnMve2NvbnZlcnNhdGlvbl9pZH0vbWVzc2FnZXMgLSDjg6Hjg4Pjgrvjg7zjgrjpgIHkv6FcclxuICAgIGNvbnN0IG1lc3NhZ2VzUmVzb3VyY2UgPSBjb252ZXJzYXRpb25SZXNvdXJjZS5hZGRSZXNvdXJjZSgnbWVzc2FnZXMnKTtcclxuICAgIG1lc3NhZ2VzUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnUE9TVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5zZW5kTWVzc2FnZSwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gR0VUIC9jb252ZXJzYXRpb25zL3tjb252ZXJzYXRpb25faWR9L21lc3NhZ2VzIC0g44Oh44OD44K744O844K45bGl5q205Y+W5b6XXHJcbiAgICBtZXNzYWdlc1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0dFVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXRNZXNzYWdlcywge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAvYmxvY2sg44Oq44K944O844K577yI44OW44Ot44OD44Kv5qmf6IO977yJXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgY29uc3QgYmxvY2tSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2Jsb2NrJyk7XHJcblxyXG4gICAgLy8gUE9TVCAvYmxvY2sgLSDjg6bjg7zjgrbjg7zjg5bjg63jg4Pjgq9cclxuICAgIGJsb2NrUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnUE9TVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5ibG9ja1VzZXIsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEdFVCAvYmxvY2sgLSDjg5bjg63jg4Pjgq/jg6rjgrnjg4jlj5blvpdcclxuICAgIGJsb2NrUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldEJsb2NrTGlzdCwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIERFTEVURSAvYmxvY2sve2FjY291bnRfaWR9IC0g44OW44Ot44OD44Kv6Kej6ZmkXHJcbiAgICBjb25zdCBibG9ja0FjY291bnRSZXNvdXJjZSA9IGJsb2NrUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3thY2NvdW50X2lkfScpO1xyXG4gICAgYmxvY2tBY2NvdW50UmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnREVMRVRFJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLnVuYmxvY2tVc2VyLCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIC9wb3N0cy97cG9zdF9pZH0vcmVwb3N0IOODquOCveODvOOCue+8iOODquODneOCueODiOapn+iDve+8iVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIFBPU1QgL3Bvc3RzL3twb3N0X2lkfS9yZXBvc3QgLSDjg6rjg53jgrnjg4jkvZzmiJBcclxuICAgIGNvbnN0IHBvc3RSZXBvc3RSZXNvdXJjZSA9IHBvc3RSZXNvdXJjZS5hZGRSZXNvdXJjZSgncmVwb3N0Jyk7XHJcbiAgICBwb3N0UmVwb3N0UmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnUE9TVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5jcmVhdGVSZXBvc3QsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAvcmVwb3N0cyDjg6rjgr3jg7zjgrnvvIjjg6rjg53jgrnjg4jmqZ/og73vvIlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBjb25zdCByZXBvc3RzUmVzb3VyY2UgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdyZXBvc3RzJyk7XHJcblxyXG4gICAgLy8gREVMRVRFIC9yZXBvc3RzL3tyZXBvc3RfaWR9IC0g44Oq44Od44K544OI5YmK6ZmkXHJcbiAgICBjb25zdCByZXBvc3RJZFJlc291cmNlID0gcmVwb3N0c1Jlc291cmNlLmFkZFJlc291cmNlKCd7cmVwb3N0X2lkfScpO1xyXG4gICAgcmVwb3N0SWRSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdERUxFVEUnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZGVsZXRlUmVwb3N0LCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIC9yZXBvcnRzIOODquOCveODvOOCue+8iOODrOODneODvOODiOapn+iDve+8iVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIGNvbnN0IHJlcG9ydHNSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3JlcG9ydHMnKTtcclxuXHJcbiAgICAvLyBQT1NUIC9yZXBvcnRzIC0g44Os44Od44O844OI5L2c5oiQXHJcbiAgICByZXBvcnRzUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnUE9TVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5jcmVhdGVSZXBvcnQsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEdFVCAvcmVwb3J0cyAtIOODrOODneODvOODiOS4gOimp+WPluW+l1xyXG4gICAgcmVwb3J0c1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0dFVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXRSZXBvcnRzLCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIC9ub3RpZmljYXRpb25zIOODquOCveODvOOCue+8iOmAmuefpeapn+iDve+8iVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIGNvbnN0IG5vdGlmaWNhdGlvbnNSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ25vdGlmaWNhdGlvbnMnKTtcclxuXHJcbiAgICAvLyBHRVQgL25vdGlmaWNhdGlvbnMgLSDpgJrnn6XkuIDopqflj5blvpdcclxuICAgIG5vdGlmaWNhdGlvbnNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdHRVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0Tm90aWZpY2F0aW9ucywge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIFBVVCAvbm90aWZpY2F0aW9ucy97aWR9L3JlYWQgLSDpgJrnn6XjgpLml6Loqq3jgavjgZnjgotcclxuICAgIGNvbnN0IG5vdGlmaWNhdGlvbklkUmVzb3VyY2UgPSBub3RpZmljYXRpb25zUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3tpZH0nKTtcclxuICAgIGNvbnN0IG5vdGlmaWNhdGlvblJlYWRSZXNvdXJjZSA9IG5vdGlmaWNhdGlvbklkUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3JlYWQnKTtcclxuICAgIG5vdGlmaWNhdGlvblJlYWRSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQVVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMucmVhZE5vdGlmaWNhdGlvbiwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIFBVVCAvbm90aWZpY2F0aW9ucy9yZWFkIC0g44GZ44G544Gm44Gu6YCa55+l44KS5pei6Kqt44Gr44GZ44KLXHJcbiAgICBjb25zdCByZWFkQWxsUmVzb3VyY2UgPSBub3RpZmljYXRpb25zUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3JlYWQnKTtcclxuICAgIHJlYWRBbGxSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQVVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMucmVhZEFsbE5vdGlmaWNhdGlvbnMsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL25vdGlmaWNhdGlvbnMvc2V0dGluZ3MgLSDpgJrnn6XoqK3lrprlj5blvpdcclxuICAgIGNvbnN0IG5vdGlmaWNhdGlvblNldHRpbmdzUmVzb3VyY2UgPSBub3RpZmljYXRpb25zUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3NldHRpbmdzJyk7XHJcbiAgICBub3RpZmljYXRpb25TZXR0aW5nc1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0dFVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXROb3RpZmljYXRpb25TZXR0aW5ncywge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIFBVVCAvbm90aWZpY2F0aW9ucy9zZXR0aW5ncyAtIOmAmuefpeioreWumuabtOaWsFxyXG4gICAgbm90aWZpY2F0aW9uU2V0dGluZ3NSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQVVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMudXBkYXRlTm90aWZpY2F0aW9uU2V0dGluZ3MsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAvc2Vzc2lvbnMg44Oq44K944O844K577yI44K744OD44K344On44Oz5qmf6IO977yJXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgY29uc3Qgc2Vzc2lvbnNSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3Nlc3Npb25zJyk7XHJcblxyXG4gICAgLy8gUE9TVCAvc2Vzc2lvbnMgLSDjgrvjg4Pjgrfjg6fjg7PkvZzmiJBcclxuICAgIHNlc3Npb25zUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnUE9TVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5jcmVhdGVTZXNzaW9uLCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL2FjY291bnRzL3thY2NvdW50X2lkfS9zZXNzaW9ucyAtIOOCouOCq+OCpuODs+ODiOOBruOCu+ODg+OCt+ODp+ODs+S4gOimp+WPluW+l1xyXG4gICAgY29uc3QgYWNjb3VudFNlc3Npb25zUmVzb3VyY2UgPSBhY2NvdW50UmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3Nlc3Npb25zJyk7XHJcbiAgICBhY2NvdW50U2Vzc2lvbnNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdHRVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0QWNjb3VudFNlc3Npb25zLCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gREVMRVRFIC9zZXNzaW9ucy97ZGV2aWNlX2lkfSAtIOOCu+ODg+OCt+ODp+ODs+WJiumZpFxyXG4gICAgY29uc3Qgc2Vzc2lvbkRldmljZVJlc291cmNlID0gc2Vzc2lvbnNSZXNvdXJjZS5hZGRSZXNvdXJjZSgne2RldmljZV9pZH0nKTtcclxuICAgIHNlc3Npb25EZXZpY2VSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdERUxFVEUnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZGVsZXRlU2Vzc2lvbiwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAvaGFzaHRhZ3Mg44Oq44K944O844K577yI44OP44OD44K344Ol44K/44Kw5qmf6IO977yJXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgY29uc3QgaGFzaHRhZ3NSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2hhc2h0YWdzJyk7XHJcblxyXG4gICAgLy8gR0VUIC9oYXNodGFncy90cmVuZGluZyAtIOODiOODrOODs+ODh+OCo+ODs+OCsOODj+ODg+OCt+ODpeOCv+OCsOWPluW+l1xyXG4gICAgY29uc3QgdHJlbmRpbmdSZXNvdXJjZSA9IGhhc2h0YWdzUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3RyZW5kaW5nJyk7XHJcbiAgICB0cmVuZGluZ1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0dFVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXRUcmVuZGluZ0hhc2h0YWdzLCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gR0VUIC9oYXNodGFncy97aGFzaHRhZ30vcG9zdHMgLSDjg4/jg4Pjgrfjg6Xjgr/jgrDjga7mipXnqL/lj5blvpdcclxuICAgIGNvbnN0IGhhc2h0YWdSZXNvdXJjZSA9IGhhc2h0YWdzUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3toYXNodGFnfScpO1xyXG4gICAgY29uc3QgaGFzaHRhZ1Bvc3RzUmVzb3VyY2UgPSBoYXNodGFnUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3Bvc3RzJyk7XHJcbiAgICBoYXNodGFnUG9zdHNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdHRVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0SGFzaHRhZ1Bvc3RzLCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIC9tdXRlIOODquOCveODvOOCue+8iOODn+ODpeODvOODiOapn+iDve+8iVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIGNvbnN0IG11dGVSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ211dGUnKTtcclxuXHJcbiAgICAvLyBQT1NUIC9tdXRlIC0g44Ki44Kr44Km44Oz44OI44KS44Of44Ol44O844OIXHJcbiAgICBtdXRlUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnUE9TVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5tdXRlQWNjb3VudCwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gR0VUIC9tdXRlIC0g44Of44Ol44O844OI44Oq44K544OI5Y+W5b6XXHJcbiAgICBtdXRlUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldE11dGVMaXN0LCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gREVMRVRFIC9tdXRlL3thY2NvdW50X2lkfSAtIOODn+ODpeODvOODiOino+mZpFxyXG4gICAgY29uc3QgbXV0ZUFjY291bnRSZXNvdXJjZSA9IG11dGVSZXNvdXJjZS5hZGRSZXNvdXJjZSgne2FjY291bnRfaWR9Jyk7XHJcbiAgICBtdXRlQWNjb3VudFJlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0RFTEVURScsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy51bm11dGVBY2NvdW50LCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIFN0YWdlIDJBOiBFeGlzdGluZyBGZWF0dXJlIEV4dGVuc2lvbnMgKDE0IGVuZHBvaW50cylcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG4gICAgLy8gUFVUIC9wb3N0cy97cG9zdF9pZH0gLSDmipXnqL/mm7TmlrBcclxuICAgIHBvc3RzUmVzb3VyY2VcclxuICAgICAgLmFkZFJlc291cmNlKCd7cG9zdF9pZH0nKVxyXG4gICAgICAuYWRkTWV0aG9kKFxyXG4gICAgICAgICdQVVQnLFxyXG4gICAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy51cGRhdGVQb3N0LCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICAgIH1cclxuICAgICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL2FjY291bnRzL3thY2NvdW50X2lkfS9wb3N0cyAtIOODpuODvOOCtuODvOaKleeov+S4gOimp1xyXG4gICAgY29uc3QgYWNjb3VudFBvc3RzUmVzb3VyY2UgPSBhY2NvdW50c1Jlc291cmNlXHJcbiAgICAgIC5hZGRSZXNvdXJjZSgne2FjY291bnRfaWR9JylcclxuICAgICAgLmFkZFJlc291cmNlKCdwb3N0cycpO1xyXG4gICAgYWNjb3VudFBvc3RzUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldFVzZXJQb3N0cywgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gR0VUIC9mZWVkL2Rpc2NvdmVyeSAtIOeZuuimi+ODleOCo+ODvOODiVxyXG4gICAgY29uc3QgZmVlZFJlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgnZmVlZCcpO1xyXG4gICAgZmVlZFJlc291cmNlLmFkZFJlc291cmNlKCdkaXNjb3ZlcnknKS5hZGRNZXRob2QoXHJcbiAgICAgICdHRVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0RGlzY292ZXJ5RmVlZCwgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gR0VUIC9yb29tcy97cm9vbV9pZH0vcG9zdHMgLSDjg6vjg7zjg6DmipXnqL/kuIDopqdcclxuICAgIGNvbnN0IHJvb21Qb3N0c1Jlc291cmNlID0gcm9vbXNSZXNvdXJjZVxyXG4gICAgICAuYWRkUmVzb3VyY2UoJ3tyb29tX2lkfScpXHJcbiAgICAgIC5hZGRSZXNvdXJjZSgncG9zdHMnKTtcclxuICAgIHJvb21Qb3N0c1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0dFVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXRSb29tUG9zdHMsIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEdFVCAvYWNjb3VudHMve2FjY291bnRfaWR9L2ZvbGxvd2luZyAtIOODleOCqeODreODvOS4reS4gOimp1xyXG4gICAgY29uc3QgYWNjb3VudEZvbGxvd2luZ1Jlc291cmNlID0gYWNjb3VudHNSZXNvdXJjZVxyXG4gICAgICAuYWRkUmVzb3VyY2UoJ3thY2NvdW50X2lkfScpXHJcbiAgICAgIC5hZGRSZXNvdXJjZSgnZm9sbG93aW5nJyk7XHJcbiAgICBhY2NvdW50Rm9sbG93aW5nUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldEZvbGxvd2luZywgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gR0VUIC9hY2NvdW50cy97YWNjb3VudF9pZH0vZm9sbG93ZXJzIC0g44OV44Kp44Ot44Ov44O85LiA6KanXHJcbiAgICBjb25zdCBhY2NvdW50Rm9sbG93ZXJzUmVzb3VyY2UgPSBhY2NvdW50c1Jlc291cmNlXHJcbiAgICAgIC5hZGRSZXNvdXJjZSgne2FjY291bnRfaWR9JylcclxuICAgICAgLmFkZFJlc291cmNlKCdmb2xsb3dlcnMnKTtcclxuICAgIGFjY291bnRGb2xsb3dlcnNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdHRVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0Rm9sbG93ZXJzLCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL3Bvc3RzL3twb3N0X2lkfS9saWtlcyAtIOaKleeov+OBruOBhOOBhOOBreS4gOimp1xyXG4gICAgY29uc3QgcG9zdExpa2VzUmVzb3VyY2UgPSBwb3N0c1Jlc291cmNlXHJcbiAgICAgIC5hZGRSZXNvdXJjZSgne3Bvc3RfaWR9JylcclxuICAgICAgLmFkZFJlc291cmNlKCdsaWtlcycpO1xyXG4gICAgcG9zdExpa2VzUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldFBvc3RMaWtlcywgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gR0VUIC9hY2NvdW50cy97YWNjb3VudF9pZH0vbGlrZXMgLSDjg6bjg7zjgrbjg7zjga7jgYTjgYTjga3kuIDopqdcclxuICAgIGNvbnN0IGFjY291bnRMaWtlc1Jlc291cmNlID0gYWNjb3VudHNSZXNvdXJjZVxyXG4gICAgICAuYWRkUmVzb3VyY2UoJ3thY2NvdW50X2lkfScpXHJcbiAgICAgIC5hZGRSZXNvdXJjZSgnbGlrZXMnKTtcclxuICAgIGFjY291bnRMaWtlc1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0dFVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXRVc2VyTGlrZXMsIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEdFVCAvYWNjb3VudHMve2FjY291bnRfaWR9L3JlcG9zdHMgLSDjg6bjg7zjgrbjg7zjga7jg6rjg53jgrnjg4jkuIDopqdcclxuICAgIGNvbnN0IGFjY291bnRSZXBvc3RzUmVzb3VyY2UgPSBhY2NvdW50c1Jlc291cmNlXHJcbiAgICAgIC5hZGRSZXNvdXJjZSgne2FjY291bnRfaWR9JylcclxuICAgICAgLmFkZFJlc291cmNlKCdyZXBvc3RzJyk7XHJcbiAgICBhY2NvdW50UmVwb3N0c1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0dFVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXRVc2VyUmVwb3N0cywgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gR0VUIC9wb3N0cy97cG9zdF9pZH0vcmVwb3N0cyAtIOaKleeov+OBruODquODneOCueODiOS4gOimp1xyXG4gICAgY29uc3QgcG9zdFJlcG9zdHNSZXNvdXJjZSA9IHBvc3RzUmVzb3VyY2VcclxuICAgICAgLmFkZFJlc291cmNlKCd7cG9zdF9pZH0nKVxyXG4gICAgICAuYWRkUmVzb3VyY2UoJ3JlcG9zdHMnKTtcclxuICAgIHBvc3RSZXBvc3RzUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldFBvc3RSZXBvc3RzLCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL3Jvb21zL3tyb29tX2lkfSAtIOODq+ODvOODoOips+e0sFxyXG4gICAgY29uc3Qgcm9vbVJlc291cmNlID0gcm9vbXNSZXNvdXJjZS5hZGRSZXNvdXJjZSgne3Jvb21faWR9Jyk7XHJcbiAgICByb29tUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldFJvb20sIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIFBVVCAvcm9vbXMve3Jvb21faWR9IC0g44Or44O844Og5pu05pawXHJcbiAgICByb29tUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnUFVUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLnVwZGF0ZVJvb20sIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIFBPU1QgL3Jvb21zL3tyb29tX2lkfS9qb2luIC0gUk9PTeWPguWKoFxyXG4gICAgY29uc3Qgam9pblJlc291cmNlID0gcm9vbVJlc291cmNlLmFkZFJlc291cmNlKCdqb2luJyk7XHJcbiAgICBqb2luUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnUE9TVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5qb2luUm9vbSwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEdFVCAvcm9vbXMve3Jvb21faWR9L21lbWJlcnMgLSDjg6vjg7zjg6Djg6Hjg7Pjg5Djg7zkuIDopqdcclxuICAgIGNvbnN0IHJvb21NZW1iZXJzUmVzb3VyY2UgPSByb29tUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ21lbWJlcnMnKTtcclxuICAgIHJvb21NZW1iZXJzUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldFJvb21NZW1iZXJzLCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBERUxFVEUgL3Jvb21zL3tyb29tX2lkfS9tZW1iZXJzL21lIC0g44Or44O844Og6YCA5Ye6XHJcbiAgICByb29tTWVtYmVyc1Jlc291cmNlLmFkZFJlc291cmNlKCdtZScpLmFkZE1ldGhvZChcclxuICAgICAgJ0RFTEVURScsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5sZWF2ZVJvb20sIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyBTdGFnZSAyQjogQW5hbHl0aWNzICg0IGVuZHBvaW50cylcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG4gICAgLy8gUE9TVCAvYW5hbHl0aWNzL2V2ZW50cyAtIOOCpOODmeODs+ODiOi/vei3oVxyXG4gICAgY29uc3QgYW5hbHl0aWNzUmVzb3VyY2UgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdhbmFseXRpY3MnKTtcclxuICAgIGFuYWx5dGljc1Jlc291cmNlLmFkZFJlc291cmNlKCdldmVudHMnKS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLnRyYWNrRXZlbnQsIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEdFVCAvcG9zdHMve3Bvc3RfaWR9L2FuYWx5dGljcyAtIOaKleeov+WIhuaekOODh+ODvOOCv1xyXG4gICAgcG9zdHNSZXNvdXJjZVxyXG4gICAgICAuYWRkUmVzb3VyY2UoJ3twb3N0X2lkfScpXHJcbiAgICAgIC5hZGRSZXNvdXJjZSgnYW5hbHl0aWNzJylcclxuICAgICAgLmFkZE1ldGhvZChcclxuICAgICAgICAnR0VUJyxcclxuICAgICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0UG9zdEFuYWx5dGljcywgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgICB9XHJcbiAgICAgICk7XHJcblxyXG4gICAgLy8gR0VUIC9hY2NvdW50cy97YWNjb3VudF9pZH0vYW5hbHl0aWNzIC0g44Ki44Kr44Km44Oz44OI5YiG5p6Q44OH44O844K/XHJcbiAgICBhY2NvdW50c1Jlc291cmNlXHJcbiAgICAgIC5hZGRSZXNvdXJjZSgne2FjY291bnRfaWR9JylcclxuICAgICAgLmFkZFJlc291cmNlKCdhbmFseXRpY3MnKVxyXG4gICAgICAuYWRkTWV0aG9kKFxyXG4gICAgICAgICdHRVQnLFxyXG4gICAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXRBY2NvdW50QW5hbHl0aWNzLCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICAgIH1cclxuICAgICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL2Rhc2hib2FyZCAtIOODgOODg+OCt+ODpeODnOODvOODiVxyXG4gICAgdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgnZGFzaGJvYXJkJykuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldERhc2hib2FyZCwgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIFN0YWdlIDJDOiBQcm9kdWN0L1Nob3AgKDggZW5kcG9pbnRzKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuXHJcbiAgICAvLyBQT1NUIC9wcm9kdWN0cyAtIOWVhuWTgeS9nOaIkFxyXG4gICAgY29uc3QgcHJvZHVjdHNSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3Byb2R1Y3RzJyk7XHJcbiAgICBwcm9kdWN0c1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ1BPU1QnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuY3JlYXRlUHJvZHVjdCwgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gR0VUIC9wcm9kdWN0cyAtIOWVhuWTgeS4gOimp1xyXG4gICAgcHJvZHVjdHNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdHRVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0UHJvZHVjdHMsIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEdFVCAvcHJvZHVjdHMve3Byb2R1Y3RfaWR9IC0g5ZWG5ZOB6Kmz57SwXHJcbiAgICBjb25zdCBwcm9kdWN0SWRSZXNvdXJjZSA9IHByb2R1Y3RzUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3twcm9kdWN0X2lkfScpO1xyXG4gICAgcHJvZHVjdElkUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldFByb2R1Y3QsIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIFBVVCAvcHJvZHVjdHMve3Byb2R1Y3RfaWR9IC0g5ZWG5ZOB5pu05pawXHJcbiAgICBwcm9kdWN0SWRSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQVVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMudXBkYXRlUHJvZHVjdCwgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gREVMRVRFIC9wcm9kdWN0cy97cHJvZHVjdF9pZH0gLSDllYblk4HliYrpmaRcclxuICAgIHByb2R1Y3RJZFJlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0RFTEVURScsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5kZWxldGVQcm9kdWN0LCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBQT1NUIC9wcm9kdWN0cy97cHJvZHVjdF9pZH0vY2xpY2sgLSDjgq/jg6rjg4Pjgq/ov73ot6FcclxuICAgIHByb2R1Y3RJZFJlc291cmNlLmFkZFJlc291cmNlKCdjbGljaycpLmFkZE1ldGhvZChcclxuICAgICAgJ1BPU1QnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuY2xpY2tQcm9kdWN0LCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBQT1NUIC9wb3N0cy97cG9zdF9pZH0vcHJvZHVjdHMgLSDmipXnqL/jgavllYblk4Hjgr/jgrDku5jjgZFcclxuICAgIHBvc3RzUmVzb3VyY2VcclxuICAgICAgLmFkZFJlc291cmNlKCd7cG9zdF9pZH0nKVxyXG4gICAgICAuYWRkUmVzb3VyY2UoJ3Byb2R1Y3RzJylcclxuICAgICAgLmFkZE1ldGhvZChcclxuICAgICAgICAnUE9TVCcsXHJcbiAgICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLnRhZ1Byb2R1Y3RPblBvc3QsIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgICAgfVxyXG4gICAgICApO1xyXG5cclxuICAgIC8vIEdFVCAvcG9zdHMve3Bvc3RfaWR9L3Byb2R1Y3RzIC0g5oqV56i/44Gu5ZWG5ZOB5LiA6KanXHJcbiAgICBwb3N0c1Jlc291cmNlXHJcbiAgICAgIC5hZGRSZXNvdXJjZSgne3Bvc3RfaWR9JylcclxuICAgICAgLmFkZFJlc291cmNlKCdwcm9kdWN0cycpXHJcbiAgICAgIC5hZGRNZXRob2QoXHJcbiAgICAgICAgJ0dFVCcsXHJcbiAgICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldFBvc3RQcm9kdWN0cywgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgICB9XHJcbiAgICAgICk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIFN0YWdlIDJFOiBMaXZlIFN0cmVhbWluZyAoMTQgUkVTVCBBUEkgZW5kcG9pbnRzKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuXHJcbiAgICAvLyBQT1NUIC9saXZlLXN0cmVhbXMgLSDjg6njgqTjg5bphY3kv6HkvZzmiJBcclxuICAgIGNvbnN0IGxpdmVTdHJlYW1zUmVzb3VyY2UgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdsaXZlLXN0cmVhbXMnKTtcclxuICAgIGxpdmVTdHJlYW1zUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnUE9TVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5jcmVhdGVMaXZlU3RyZWFtLCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL2xpdmUtc3RyZWFtcyAtIOODqeOCpOODlumFjeS/oeS4gOimp1xyXG4gICAgbGl2ZVN0cmVhbXNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdHRVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0TGl2ZVN0cmVhbXMsIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEdFVCAvbGl2ZS1zdHJlYW1zL3tzdHJlYW1faWR9IC0g44Op44Kk44OW6YWN5L+h6Kmz57SwXHJcbiAgICBjb25zdCBzdHJlYW1JZFJlc291cmNlID0gbGl2ZVN0cmVhbXNSZXNvdXJjZS5hZGRSZXNvdXJjZSgne3N0cmVhbV9pZH0nKTtcclxuICAgIHN0cmVhbUlkUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldExpdmVTdHJlYW0sIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIERFTEVURSAvbGl2ZS1zdHJlYW1zL3tzdHJlYW1faWR9IC0g44Op44Kk44OW6YWN5L+h5YmK6ZmkXHJcbiAgICBzdHJlYW1JZFJlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0RFTEVURScsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5kZWxldGVMaXZlU3RyZWFtLCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBQT1NUIC9saXZlLXN0cmVhbXMve3N0cmVhbV9pZH0vZW5kIC0g6YWN5L+h57WC5LqGXHJcbiAgICBzdHJlYW1JZFJlc291cmNlLmFkZFJlc291cmNlKCdlbmQnKS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmVuZExpdmVTdHJlYW0sIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIFBPU1QgL2xpdmUtc3RyZWFtcy97c3RyZWFtX2lkfS9qb2luIC0g6YWN5L+h5Y+C5YqgXHJcbiAgICBzdHJlYW1JZFJlc291cmNlLmFkZFJlc291cmNlKCdqb2luJykuYWRkTWV0aG9kKFxyXG4gICAgICAnUE9TVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5qb2luTGl2ZVN0cmVhbSwgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gUE9TVCAvbGl2ZS1zdHJlYW1zL3tzdHJlYW1faWR9L2xlYXZlIC0g6YWN5L+h6YCA5Ye6XHJcbiAgICBzdHJlYW1JZFJlc291cmNlLmFkZFJlc291cmNlKCdsZWF2ZScpLmFkZE1ldGhvZChcclxuICAgICAgJ1BPU1QnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMubGVhdmVMaXZlU3RyZWFtLCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL2xpdmUtc3RyZWFtcy97c3RyZWFtX2lkfS9jaGF0IC0g44OB44Oj44OD44OI5LiA6KanXHJcbiAgICBjb25zdCBjaGF0UmVzb3VyY2UgPSBzdHJlYW1JZFJlc291cmNlLmFkZFJlc291cmNlKCdjaGF0Jyk7XHJcbiAgICBjaGF0UmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnR0VUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmdldExpdmVDaGF0cywgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gUE9TVCAvbGl2ZS1zdHJlYW1zL3tzdHJlYW1faWR9L2NoYXQgLSDjg4Hjg6Pjg4Pjg4jpgIHkv6FcclxuICAgIGNoYXRSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLnNlbmRMaXZlQ2hhdCwgeyBwcm94eTogdHJ1ZSB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gUE9TVCAvbGl2ZS1zdHJlYW1zL3tzdHJlYW1faWR9L2dpZnRzIC0g44Ku44OV44OI6YCB5L+hXHJcbiAgICBzdHJlYW1JZFJlc291cmNlLmFkZFJlc291cmNlKCdnaWZ0cycpLmFkZE1ldGhvZChcclxuICAgICAgJ1BPU1QnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuc2VuZEdpZnQsIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIFBPU1QgL2xpdmUtc3RyZWFtcy97c3RyZWFtX2lkfS9tb2RlcmF0b3JzIC0g44Oi44OH44Os44O844K/44O86L+95YqgXHJcbiAgICBzdHJlYW1JZFJlc291cmNlLmFkZFJlc291cmNlKCdtb2RlcmF0b3JzJykuYWRkTWV0aG9kKFxyXG4gICAgICAnUE9TVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5hZGRNb2RlcmF0b3IsIHsgcHJveHk6IHRydWUgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIFBPU1QgL2xpdmUtc3RyZWFtcy97c3RyZWFtX2lkfS9iYW4gLSDjg6bjg7zjgrbjg7xCQU5cclxuICAgIHN0cmVhbUlkUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2JhbicpLmFkZE1ldGhvZChcclxuICAgICAgJ1BPU1QnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuYmFuVXNlckZyb21MaXZlLCB7IHByb3h5OiB0cnVlIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBQT1NUIC93ZWJob29rcy9tdXggLSBNdXggV2ViaG9va++8iOiqjeiovOOBquOBl++8iVxyXG4gICAgdGhpcy5hcGkucm9vdFxyXG4gICAgICAuYWRkUmVzb3VyY2UoJ3dlYmhvb2tzJylcclxuICAgICAgLmFkZFJlc291cmNlKCdtdXgnKVxyXG4gICAgICAuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLm11eFdlYmhvb2ssIHsgcHJveHk6IHRydWUgfSksIHtcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gT3V0cHV0c1xyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcGlVcmwnLCB7XHJcbiAgICAgIHZhbHVlOiB0aGlzLmFwaS51cmwsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVBJIEdhdGV3YXkgVVJMJyxcclxuICAgICAgZXhwb3J0TmFtZTogYFBpZWNlQXBwLUFwaVVybC0ke2Vudmlyb25tZW50fWAsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpSWQnLCB7XHJcbiAgICAgIHZhbHVlOiB0aGlzLmFwaS5yZXN0QXBpSWQsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVBJIEdhdGV3YXkgSUQnLFxyXG4gICAgICBleHBvcnROYW1lOiBgUGllY2VBcHAtQXBpSWQtJHtlbnZpcm9ubWVudH1gLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiJdfQ==