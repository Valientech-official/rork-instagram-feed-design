/**
 * API Gateway (REST API) Stack
 * React Nativeアプリ向けのREST API設定
 */

import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface ApiGatewayStackProps extends cdk.StackProps {
  environment: 'dev' | 'prod';
  lambdaFunctions: {
    // Account
    createAccount: lambda.Function;
    getProfile: lambda.Function;
    updateProfile: lambda.Function;

    // Post
    createPost: lambda.Function;
    getPost: lambda.Function;
    deletePost: lambda.Function;
    getTimeline: lambda.Function;

    // Like
    likePost: lambda.Function;
    unlikePost: lambda.Function;

    // Comment
    createComment: lambda.Function;
    deleteComment: lambda.Function;
    getComments: lambda.Function;

    // Follow
    followUser: lambda.Function;
    unfollowUser: lambda.Function;

    // Room
    createRoom: lambda.Function;
    joinRoom: lambda.Function;

    // DM (Conversation & Message)
    createConversation: lambda.Function;
    getConversations: lambda.Function;
    sendMessage: lambda.Function;
    getMessages: lambda.Function;

    // Block
    blockUser: lambda.Function;
    unblockUser: lambda.Function;
    getBlockList: lambda.Function;

    // Repost
    createRepost: lambda.Function;
    deleteRepost: lambda.Function;

    // Report
    createReport: lambda.Function;
    getReports: lambda.Function;

    // Notification
    getNotifications: lambda.Function;
    readNotification: lambda.Function;
    readAllNotifications: lambda.Function;
    getNotificationSettings: lambda.Function;
    updateNotificationSettings: lambda.Function;

    // Session
    createSession: lambda.Function;
    getAccountSessions: lambda.Function;
    deleteSession: lambda.Function;

    // Hashtag
    getHashtagPosts: lambda.Function;
    getTrendingHashtags: lambda.Function;

    // Mute
    muteAccount: lambda.Function;
    unmuteAccount: lambda.Function;
    getMuteList: lambda.Function;

    // Stage 2A: Existing Feature Extensions
    updatePost: lambda.Function;
    getUserPosts: lambda.Function;
    getDiscoveryFeed: lambda.Function;
    getRoomPosts: lambda.Function;
    getFollowing: lambda.Function;
    getFollowers: lambda.Function;
    getPostLikes: lambda.Function;
    getUserLikes: lambda.Function;
    getUserReposts: lambda.Function;
    getPostReposts: lambda.Function;
    getRoom: lambda.Function;
    updateRoom: lambda.Function;
    getRoomMembers: lambda.Function;
    leaveRoom: lambda.Function;
  };
  userPool: cognito.UserPool;
}

export class ApiGatewayStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly authorizer: apigateway.CognitoUserPoolsAuthorizer;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
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
    this.authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      'CognitoAuthorizer',
      {
        cognitoUserPools: [userPool],
        authorizerName: `piece-app-authorizer-${environment}`,
        identitySource: 'method.request.header.Authorization',
        resultsCacheTtl: cdk.Duration.minutes(5), // キャッシュ5分
      }
    );

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
    const requestValidator = new apigateway.RequestValidator(
      this,
      'RequestValidator',
      {
        restApi: this.api,
        requestValidatorName: 'request-body-validator',
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    // =====================================================
    // /accounts リソース
    // =====================================================
    const accountsResource = this.api.root.addResource('accounts');

    // POST /accounts - アカウント作成（認証不要）
    accountsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(lambdaFunctions.createAccount, {
        proxy: true,
      }),
      {
        authorizationType: apigateway.AuthorizationType.NONE, // 認証不要
        requestValidator,
      }
    );

    // GET /accounts/{account_id} - プロフィール取得
    const accountResource = accountsResource.addResource('{account_id}');
    accountResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getProfile, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // PUT /accounts/{account_id} - プロフィール更新
    accountResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(lambdaFunctions.updateProfile, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // =====================================================
    // /posts リソース
    // =====================================================
    const postsResource = this.api.root.addResource('posts');

    // POST /posts - 投稿作成
    postsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(lambdaFunctions.createPost, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // GET /posts/{post_id} - 投稿取得
    const postResource = postsResource.addResource('{post_id}');
    postResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getPost, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // DELETE /posts/{post_id} - 投稿削除
    postResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(lambdaFunctions.deletePost, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // POST /posts/{post_id}/like - いいね
    const likeResource = postResource.addResource('like');
    likeResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(lambdaFunctions.likePost, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // DELETE /posts/{post_id}/like - いいね解除
    likeResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(lambdaFunctions.unlikePost, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // POST /posts/{post_id}/comments - コメント作成
    const commentsResource = postResource.addResource('comments');
    commentsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(lambdaFunctions.createComment, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // GET /posts/{post_id}/comments - コメント一覧取得
    commentsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getComments, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // =====================================================
    // /comments リソース
    // =====================================================
    const commentRootResource = this.api.root.addResource('comments');
    const commentResource = commentRootResource.addResource('{comment_id}');

    // DELETE /comments/{comment_id} - コメント削除
    commentResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(lambdaFunctions.deleteComment, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // =====================================================
    // /timeline リソース
    // =====================================================
    const timelineResource = this.api.root.addResource('timeline');
    timelineResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getTimeline, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // =====================================================
    // /follow リソース
    // =====================================================
    const followResource = this.api.root.addResource('follow');

    // POST /follow - フォロー
    followResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(lambdaFunctions.followUser, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // DELETE /follow - フォロー解除
    followResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(lambdaFunctions.unfollowUser, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // =====================================================
    // /rooms リソース
    // =====================================================
    const roomsResource = this.api.root.addResource('rooms');

    // POST /rooms - ROOM作成
    roomsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(lambdaFunctions.createRoom, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // POST /rooms/{room_id}/join - ROOM参加
    const roomResource = roomsResource.addResource('{room_id}');
    const joinResource = roomResource.addResource('join');
    joinResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(lambdaFunctions.joinRoom, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // =====================================================
    // /conversations リソース（DM機能）
    // =====================================================
    const conversationsResource = this.api.root.addResource('conversations');

    // POST /conversations - 会話作成
    conversationsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(lambdaFunctions.createConversation, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // GET /conversations - 会話一覧取得
    conversationsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getConversations, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // /conversations/{conversation_id} リソース
    const conversationResource = conversationsResource.addResource('{conversation_id}');

    // POST /conversations/{conversation_id}/messages - メッセージ送信
    const messagesResource = conversationResource.addResource('messages');
    messagesResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(lambdaFunctions.sendMessage, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // GET /conversations/{conversation_id}/messages - メッセージ履歴取得
    messagesResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getMessages, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // =====================================================
    // /block リソース（ブロック機能）
    // =====================================================
    const blockResource = this.api.root.addResource('block');

    // POST /block - ユーザーブロック
    blockResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(lambdaFunctions.blockUser, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // GET /block - ブロックリスト取得
    blockResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getBlockList, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // DELETE /block/{account_id} - ブロック解除
    const blockAccountResource = blockResource.addResource('{account_id}');
    blockAccountResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(lambdaFunctions.unblockUser, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // =====================================================
    // /posts/{post_id}/repost リソース（リポスト機能）
    // =====================================================
    // POST /posts/{post_id}/repost - リポスト作成
    const postRepostResource = postResource.addResource('repost');
    postRepostResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(lambdaFunctions.createRepost, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // =====================================================
    // /reposts リソース（リポスト機能）
    // =====================================================
    const repostsResource = this.api.root.addResource('reposts');

    // DELETE /reposts/{repost_id} - リポスト削除
    const repostIdResource = repostsResource.addResource('{repost_id}');
    repostIdResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(lambdaFunctions.deleteRepost, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // =====================================================
    // /reports リソース（レポート機能）
    // =====================================================
    const reportsResource = this.api.root.addResource('reports');

    // POST /reports - レポート作成
    reportsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(lambdaFunctions.createReport, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // GET /reports - レポート一覧取得
    reportsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getReports, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // =====================================================
    // /notifications リソース（通知機能）
    // =====================================================
    const notificationsResource = this.api.root.addResource('notifications');

    // GET /notifications - 通知一覧取得
    notificationsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getNotifications, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // PUT /notifications/{id}/read - 通知を既読にする
    const notificationIdResource = notificationsResource.addResource('{id}');
    const notificationReadResource = notificationIdResource.addResource('read');
    notificationReadResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(lambdaFunctions.readNotification, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // PUT /notifications/read - すべての通知を既読にする
    const readAllResource = notificationsResource.addResource('read');
    readAllResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(lambdaFunctions.readAllNotifications, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // GET /notifications/settings - 通知設定取得
    const notificationSettingsResource = notificationsResource.addResource('settings');
    notificationSettingsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getNotificationSettings, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // PUT /notifications/settings - 通知設定更新
    notificationSettingsResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(lambdaFunctions.updateNotificationSettings, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // =====================================================
    // /sessions リソース（セッション機能）
    // =====================================================
    const sessionsResource = this.api.root.addResource('sessions');

    // POST /sessions - セッション作成
    sessionsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(lambdaFunctions.createSession, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // GET /accounts/{account_id}/sessions - アカウントのセッション一覧取得
    const accountSessionsResource = accountResource.addResource('sessions');
    accountSessionsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getAccountSessions, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // DELETE /sessions/{device_id} - セッション削除
    const sessionDeviceResource = sessionsResource.addResource('{device_id}');
    sessionDeviceResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(lambdaFunctions.deleteSession, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // =====================================================
    // /hashtags リソース（ハッシュタグ機能）
    // =====================================================
    const hashtagsResource = this.api.root.addResource('hashtags');

    // GET /hashtags/trending - トレンディングハッシュタグ取得
    const trendingResource = hashtagsResource.addResource('trending');
    trendingResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getTrendingHashtags, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // GET /hashtags/{hashtag}/posts - ハッシュタグの投稿取得
    const hashtagResource = hashtagsResource.addResource('{hashtag}');
    const hashtagPostsResource = hashtagResource.addResource('posts');
    hashtagPostsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getHashtagPosts, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // =====================================================
    // /mute リソース（ミュート機能）
    // =====================================================
    const muteResource = this.api.root.addResource('mute');

    // POST /mute - アカウントをミュート
    muteResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(lambdaFunctions.muteAccount, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // GET /mute - ミュートリスト取得
    muteResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getMuteList, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // DELETE /mute/{account_id} - ミュート解除
    const muteAccountResource = muteResource.addResource('{account_id}');
    muteAccountResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(lambdaFunctions.unmuteAccount, {
        proxy: true,
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    // =====================================================
    // Stage 2A: Existing Feature Extensions (14 endpoints)
    // =====================================================

    // PUT /posts/{post_id} - 投稿更新
    postsResource
      .addResource('{post_id}')
      .addMethod(
        'PUT',
        new apigateway.LambdaIntegration(lambdaFunctions.updatePost, { proxy: true }),
        {
          authorizer: this.authorizer,
          authorizationType: apigateway.AuthorizationType.COGNITO,
          requestValidator,
        }
      );

    // GET /accounts/{account_id}/posts - ユーザー投稿一覧
    const accountPostsResource = accountsResource
      .addResource('{account_id}')
      .addResource('posts');
    accountPostsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getUserPosts, { proxy: true }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // GET /feed/discovery - 発見フィード
    const feedResource = this.api.root.addResource('feed');
    feedResource.addResource('discovery').addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getDiscoveryFeed, { proxy: true }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // GET /rooms/{room_id}/posts - ルーム投稿一覧
    const roomPostsResource = roomsResource
      .addResource('{room_id}')
      .addResource('posts');
    roomPostsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getRoomPosts, { proxy: true }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // GET /accounts/{account_id}/following - フォロー中一覧
    const accountFollowingResource = accountsResource
      .addResource('{account_id}')
      .addResource('following');
    accountFollowingResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getFollowing, { proxy: true }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // GET /accounts/{account_id}/followers - フォロワー一覧
    const accountFollowersResource = accountsResource
      .addResource('{account_id}')
      .addResource('followers');
    accountFollowersResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getFollowers, { proxy: true }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // GET /posts/{post_id}/likes - 投稿のいいね一覧
    const postLikesResource = postsResource
      .addResource('{post_id}')
      .addResource('likes');
    postLikesResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getPostLikes, { proxy: true }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // GET /accounts/{account_id}/likes - ユーザーのいいね一覧
    const accountLikesResource = accountsResource
      .addResource('{account_id}')
      .addResource('likes');
    accountLikesResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getUserLikes, { proxy: true }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // GET /accounts/{account_id}/reposts - ユーザーのリポスト一覧
    const accountRepostsResource = accountsResource
      .addResource('{account_id}')
      .addResource('reposts');
    accountRepostsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getUserReposts, { proxy: true }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // GET /posts/{post_id}/reposts - 投稿のリポスト一覧
    const postRepostsResource = postsResource
      .addResource('{post_id}')
      .addResource('reposts');
    postRepostsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getPostReposts, { proxy: true }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // GET /rooms/{room_id} - ルーム詳細
    const roomResource = roomsResource.addResource('{room_id}');
    roomResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getRoom, { proxy: true }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // PUT /rooms/{room_id} - ルーム更新
    roomResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(lambdaFunctions.updateRoom, { proxy: true }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // GET /rooms/{room_id}/members - ルームメンバー一覧
    const roomMembersResource = roomResource.addResource('members');
    roomMembersResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(lambdaFunctions.getRoomMembers, { proxy: true }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

    // DELETE /rooms/{room_id}/members/me - ルーム退出
    roomMembersResource.addResource('me').addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(lambdaFunctions.leaveRoom, { proxy: true }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestValidator,
      }
    );

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
