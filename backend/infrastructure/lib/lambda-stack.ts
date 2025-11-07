/**
 * Lambda Functions Stack
 * 全Lambda関数の定義と設定（シンプルバージョン）
 */

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

interface LambdaStackProps extends cdk.StackProps {
  environment: 'dev' | 'prod';
}

export class LambdaStack extends cdk.Stack {
  // Lambda関数のエクスポート
  public readonly createAccount: lambda.Function;
  public readonly getProfile: lambda.Function;
  public readonly updateProfile: lambda.Function;
  public readonly createPost: lambda.Function;
  public readonly getPost: lambda.Function;
  public readonly deletePost: lambda.Function;
  public readonly getTimeline: lambda.Function;
  public readonly likePost: lambda.Function;
  public readonly unlikePost: lambda.Function;
  public readonly createComment: lambda.Function;
  public readonly deleteComment: lambda.Function;
  public readonly getComments: lambda.Function;
  public readonly followUser: lambda.Function;
  public readonly unfollowUser: lambda.Function;
  public readonly createRoom: lambda.Function;
  public readonly joinRoom: lambda.Function;

  // DM (Conversation & Message)
  public readonly createConversation: lambda.Function;
  public readonly getConversations: lambda.Function;
  public readonly sendMessage: lambda.Function;
  public readonly getMessages: lambda.Function;

  // Block
  public readonly blockUser: lambda.Function;
  public readonly unblockUser: lambda.Function;
  public readonly getBlockList: lambda.Function;

  // Repost
  public readonly createRepost: lambda.Function;
  public readonly deleteRepost: lambda.Function;

  // Report
  public readonly createReport: lambda.Function;
  public readonly getReports: lambda.Function;

  // Notification
  public readonly getNotifications: lambda.Function;
  public readonly markAsRead: lambda.Function;
  public readonly markAllAsRead: lambda.Function;
  public readonly getNotificationSettings: lambda.Function;
  public readonly updateNotificationSettings: lambda.Function;

  // Session
  public readonly createSession: lambda.Function;
  public readonly getAllAccountSessions: lambda.Function;
  public readonly logoutSession: lambda.Function;

  // Hashtag
  public readonly searchByHashtag: lambda.Function;
  public readonly getTrendingHashtags: lambda.Function;

  // Mute
  public readonly muteUser: lambda.Function;
  public readonly unmuteUser: lambda.Function;
  public readonly getMutedUsers: lambda.Function;

  // Stage 2A: Existing Feature Extensions
  public readonly updatePost: lambda.Function;
  public readonly getUserPosts: lambda.Function;
  public readonly getDiscoveryFeed: lambda.Function;
  public readonly getRoomPosts: lambda.Function;
  public readonly getFollowing: lambda.Function;
  public readonly getFollowers: lambda.Function;
  public readonly getPostLikes: lambda.Function;
  public readonly getUserLikes: lambda.Function;
  public readonly getUserReposts: lambda.Function;
  public readonly getPostReposts: lambda.Function;
  public readonly getRoom: lambda.Function;
  public readonly updateRoom: lambda.Function;
  public readonly getRoomMembers: lambda.Function;
  public readonly leaveRoom: lambda.Function;

  // Stage 2B: Analytics
  public readonly trackEvent: lambda.Function;
  public readonly getPostAnalytics: lambda.Function;
  public readonly getAccountAnalytics: lambda.Function;
  public readonly getDashboard: lambda.Function;

  // Stage 2C: Product/Shop
  public readonly createProduct: lambda.Function;
  public readonly getProduct: lambda.Function;
  public readonly updateProduct: lambda.Function;
  public readonly deleteProduct: lambda.Function;
  public readonly getProducts: lambda.Function;
  public readonly tagProductOnPost: lambda.Function;
  public readonly getPostProducts: lambda.Function;
  public readonly clickProduct: lambda.Function;

  // Cognito Triggers
  public readonly postConfirmation: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // =====================================================
    // Lambda共通設定
    // =====================================================

    const srcDir = path.join(__dirname, '../../src');

    // 共通環境変数
    // ⚠️ AWS_REGIONは Lambdaランタイムで自動設定されるため除外
    const commonEnvironment = {
      ENVIRONMENT: environment,
      NODE_ENV: environment === 'prod' ? 'production' : 'development',
    };

    // DynamoDB権限ポリシー
    const dynamoDbPolicy = new iam.PolicyStatement({
      actions: [
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:Query',
        'dynamodb:Scan',
        'dynamodb:BatchGetItem',
        'dynamodb:BatchWriteItem',
      ],
      resources: [
        `arn:aws:dynamodb:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:table/*`,
      ],
    });

    // Lambda関数作成ヘルパー
    const createLambdaFunction = (
      id: string,
      functionName: string,
      handler: string,
      description: string
    ): lambda.Function => {
      // ログ グループを作成
      const logGroup = new logs.LogGroup(this, `${id}LogGroup`, {
        logGroupName: `/aws/lambda/piece-app-${functionName}-${environment}`,
        retention: environment === 'prod'
          ? logs.RetentionDays.ONE_MONTH
          : logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      return new lambda.Function(this, id, {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler,
        code: lambda.Code.fromAsset(srcDir),
        functionName: `piece-app-${functionName}-${environment}`,
        description,
        timeout: cdk.Duration.seconds(30),
        memorySize: environment === 'prod' ? 1024 : 512,
        environment: commonEnvironment,
        tracing: lambda.Tracing.ACTIVE,
        logGroup: logGroup,
        initialPolicy: [dynamoDbPolicy],
      });
    };

    // =====================================================
    // Lambda関数作成
    // =====================================================

    // Account
    this.createAccount = createLambdaFunction(
      'CreateAccountFunction',
      'create-account',
      'dist/handlers/account/createAccount.handler',
      'Create new account'
    );

    this.getProfile = createLambdaFunction(
      'GetProfileFunction',
      'get-profile',
      'dist/handlers/account/getProfile.handler',
      'Get user profile'
    );

    this.updateProfile = createLambdaFunction(
      'UpdateProfileFunction',
      'update-profile',
      'dist/handlers/account/updateProfile.handler',
      'Update user profile'
    );

    // Post
    this.createPost = createLambdaFunction(
      'CreatePostFunction',
      'create-post',
      'dist/handlers/post/createPost.handler',
      'Create new post'
    );

    this.getPost = createLambdaFunction(
      'GetPostFunction',
      'get-post',
      'dist/handlers/post/getPost.handler',
      'Get post details'
    );

    this.deletePost = createLambdaFunction(
      'DeletePostFunction',
      'delete-post',
      'dist/handlers/post/deletePost.handler',
      'Delete post'
    );

    this.getTimeline = createLambdaFunction(
      'GetTimelineFunction',
      'get-timeline',
      'dist/handlers/post/getTimeline.handler',
      'Get user timeline'
    );

    // Like
    this.likePost = createLambdaFunction(
      'LikePostFunction',
      'like-post',
      'dist/handlers/like/likePost.handler',
      'Like a post'
    );

    this.unlikePost = createLambdaFunction(
      'UnlikePostFunction',
      'unlike-post',
      'dist/handlers/like/unlikePost.handler',
      'Unlike a post'
    );

    // Comment
    this.createComment = createLambdaFunction(
      'CreateCommentFunction',
      'create-comment',
      'dist/handlers/comment/createComment.handler',
      'Create comment on post'
    );

    this.deleteComment = createLambdaFunction(
      'DeleteCommentFunction',
      'delete-comment',
      'dist/handlers/comment/deleteComment.handler',
      'Delete comment'
    );

    this.getComments = createLambdaFunction(
      'GetCommentsFunction',
      'get-comments',
      'dist/handlers/comment/getComments.handler',
      'Get comments for post'
    );

    // Follow
    this.followUser = createLambdaFunction(
      'FollowUserFunction',
      'follow-user',
      'dist/handlers/follow/followUser.handler',
      'Follow a user'
    );

    this.unfollowUser = createLambdaFunction(
      'UnfollowUserFunction',
      'unfollow-user',
      'dist/handlers/follow/unfollowUser.handler',
      'Unfollow a user'
    );

    // Room
    this.createRoom = createLambdaFunction(
      'CreateRoomFunction',
      'create-room',
      'dist/handlers/room/createRoom.handler',
      'Create new room'
    );

    this.joinRoom = createLambdaFunction(
      'JoinRoomFunction',
      'join-room',
      'dist/handlers/room/joinRoom.handler',
      'Join a room'
    );

    // DM (Conversation & Message)
    this.createConversation = createLambdaFunction(
      'CreateConversationFunction',
      'create-conversation',
      'dist/handlers/conversation/createConversation.handler',
      'Create or get existing conversation'
    );

    this.getConversations = createLambdaFunction(
      'GetConversationsFunction',
      'get-conversations',
      'dist/handlers/conversation/getConversations.handler',
      'Get user conversations list'
    );

    this.sendMessage = createLambdaFunction(
      'SendMessageFunction',
      'send-message',
      'dist/handlers/message/sendMessage.handler',
      'Send message in conversation'
    );

    this.getMessages = createLambdaFunction(
      'GetMessagesFunction',
      'get-messages',
      'dist/handlers/message/getMessages.handler',
      'Get messages for conversation'
    );

    // Block
    this.blockUser = createLambdaFunction(
      'BlockUserFunction',
      'block-user',
      'dist/handlers/block/blockUser.handler',
      'Block a user'
    );

    this.unblockUser = createLambdaFunction(
      'UnblockUserFunction',
      'unblock-user',
      'dist/handlers/block/unblockUser.handler',
      'Unblock a user'
    );

    this.getBlockList = createLambdaFunction(
      'GetBlockListFunction',
      'get-block-list',
      'dist/handlers/block/getBlockList.handler',
      'Get blocked users list'
    );

    // Repost
    this.createRepost = createLambdaFunction(
      'CreateRepostFunction',
      'create-repost',
      'dist/handlers/repost/createRepost.handler',
      'Create a repost (share post)'
    );

    this.deleteRepost = createLambdaFunction(
      'DeleteRepostFunction',
      'delete-repost',
      'dist/handlers/repost/deleteRepost.handler',
      'Delete a repost'
    );

    // Report
    this.createReport = createLambdaFunction(
      'CreateReportFunction',
      'create-report',
      'dist/handlers/report/createReport.handler',
      'Create a report'
    );

    this.getReports = createLambdaFunction(
      'GetReportsFunction',
      'get-reports',
      'dist/handlers/report/getReports.handler',
      'Get reports'
    );

    // Notification
    this.getNotifications = createLambdaFunction(
      'GetNotificationsFunction',
      'get-notifications',
      'dist/handlers/notification/getNotifications.handler',
      'Get user notifications'
    );

    this.markAsRead = createLambdaFunction(
      'MarkAsReadFunction',
      'mark-as-read',
      'dist/handlers/notification/markAsRead.handler',
      'Mark notification as read'
    );

    this.markAllAsRead = createLambdaFunction(
      'MarkAllAsReadFunction',
      'mark-all-as-read',
      'dist/handlers/notification/markAllAsRead.handler',
      'Mark all notifications as read'
    );

    this.getNotificationSettings = createLambdaFunction(
      'GetNotificationSettingsFunction',
      'get-notification-settings',
      'dist/handlers/notification/getNotificationSettings.handler',
      'Get notification settings'
    );

    this.updateNotificationSettings = createLambdaFunction(
      'UpdateNotificationSettingsFunction',
      'update-notification-settings',
      'dist/handlers/notification/updateNotificationSettings.handler',
      'Update notification settings'
    );

    // Session
    this.createSession = createLambdaFunction(
      'CreateSessionFunction',
      'create-session',
      'dist/handlers/session/createSession.handler',
      'Create a session'
    );

    this.getAllAccountSessions = createLambdaFunction(
      'GetAllAccountSessionsFunction',
      'get-all-account-sessions',
      'dist/handlers/session/getAllAccountSessions.handler',
      'Get all account sessions'
    );

    this.logoutSession = createLambdaFunction(
      'LogoutSessionFunction',
      'logout-session',
      'dist/handlers/session/logoutSession.handler',
      'Logout a session'
    );

    // Hashtag
    this.searchByHashtag = createLambdaFunction(
      'SearchByHashtagFunction',
      'search-by-hashtag',
      'dist/handlers/hashtag/searchByHashtag.handler',
      'Search posts by hashtag'
    );

    this.getTrendingHashtags = createLambdaFunction(
      'GetTrendingHashtagsFunction',
      'get-trending-hashtags',
      'dist/handlers/hashtag/getTrendingHashtags.handler',
      'Get trending hashtags'
    );

    // Mute
    this.muteUser = createLambdaFunction(
      'MuteUserFunction',
      'mute-user',
      'dist/handlers/mute/muteUser.handler',
      'Mute a user'
    );

    this.unmuteUser = createLambdaFunction(
      'UnmuteUserFunction',
      'unmute-user',
      'dist/handlers/mute/unmuteUser.handler',
      'Unmute a user'
    );

    this.getMutedUsers = createLambdaFunction(
      'GetMutedUsersFunction',
      'get-muted-users',
      'dist/handlers/mute/getMutedUsers.handler',
      'Get muted users list'
    );

    // =====================================================
    // Stage 2A: Existing Feature Extensions (14 functions)
    // =====================================================

    // Post拡張
    this.updatePost = createLambdaFunction(
      'UpdatePostFunction',
      'update-post',
      'dist/handlers/post/updatePost.handler',
      'Update an existing post'
    );

    this.getUserPosts = createLambdaFunction(
      'GetUserPostsFunction',
      'get-user-posts',
      'dist/handlers/post/getUserPosts.handler',
      'Get posts by a specific user'
    );

    this.getDiscoveryFeed = createLambdaFunction(
      'GetDiscoveryFeedFunction',
      'get-discovery-feed',
      'dist/handlers/post/getDiscoveryFeed.handler',
      'Get discovery feed with public posts'
    );

    this.getRoomPosts = createLambdaFunction(
      'GetRoomPostsFunction',
      'get-room-posts',
      'dist/handlers/post/getRoomPosts.handler',
      'Get posts in a specific room'
    );

    // Follow拡張
    this.getFollowing = createLambdaFunction(
      'GetFollowingFunction',
      'get-following',
      'dist/handlers/follow/getFollowing.handler',
      'Get list of accounts a user is following'
    );

    this.getFollowers = createLambdaFunction(
      'GetFollowersFunction',
      'get-followers',
      'dist/handlers/follow/getFollowers.handler',
      'Get list of accounts following a user'
    );

    // Like拡張
    this.getPostLikes = createLambdaFunction(
      'GetPostLikesFunction',
      'get-post-likes',
      'dist/handlers/like/getPostLikes.handler',
      'Get list of accounts that liked a post'
    );

    this.getUserLikes = createLambdaFunction(
      'GetUserLikesFunction',
      'get-user-likes',
      'dist/handlers/like/getUserLikes.handler',
      'Get list of posts a user has liked'
    );

    // Repost拡張
    this.getUserReposts = createLambdaFunction(
      'GetUserRepostsFunction',
      'get-user-reposts',
      'dist/handlers/repost/getUserReposts.handler',
      'Get list of posts a user has reposted'
    );

    this.getPostReposts = createLambdaFunction(
      'GetPostRepostsFunction',
      'get-post-reposts',
      'dist/handlers/repost/getPostReposts.handler',
      'Get list of accounts that reposted a post'
    );

    // Room拡張
    this.getRoom = createLambdaFunction(
      'GetRoomFunction',
      'get-room',
      'dist/handlers/room/getRoom.handler',
      'Get room details'
    );

    this.updateRoom = createLambdaFunction(
      'UpdateRoomFunction',
      'update-room',
      'dist/handlers/room/updateRoom.handler',
      'Update room details'
    );

    this.getRoomMembers = createLambdaFunction(
      'GetRoomMembersFunction',
      'get-room-members',
      'dist/handlers/room/getRoomMembers.handler',
      'Get list of room members'
    );

    this.leaveRoom = createLambdaFunction(
      'LeaveRoomFunction',
      'leave-room',
      'dist/handlers/room/leaveRoom.handler',
      'Leave a room'
    );

    // =====================================================
    // Stage 2B: Analytics (4 functions)
    // =====================================================

    this.trackEvent = createLambdaFunction(
      'TrackEventFunction',
      'track-event',
      'dist/handlers/analytics/trackEvent.handler',
      'Track user events and analytics'
    );

    this.getPostAnalytics = createLambdaFunction(
      'GetPostAnalyticsFunction',
      'get-post-analytics',
      'dist/handlers/analytics/getPostAnalytics.handler',
      'Get analytics for a specific post'
    );

    this.getAccountAnalytics = createLambdaFunction(
      'GetAccountAnalyticsFunction',
      'get-account-analytics',
      'dist/handlers/analytics/getAccountAnalytics.handler',
      'Get analytics for an account'
    );

    this.getDashboard = createLambdaFunction(
      'GetDashboardFunction',
      'get-dashboard',
      'dist/handlers/analytics/getDashboard.handler',
      'Get dashboard summary data'
    );

    // =====================================================
    // Stage 2C: Product/Shop (8 functions)
    // =====================================================

    this.createProduct = createLambdaFunction(
      'CreateProductFunction',
      'create-product',
      'dist/handlers/product/createProduct.handler',
      'Create a product listing'
    );

    this.getProduct = createLambdaFunction(
      'GetProductFunction',
      'get-product',
      'dist/handlers/product/getProduct.handler',
      'Get product details'
    );

    this.updateProduct = createLambdaFunction(
      'UpdateProductFunction',
      'update-product',
      'dist/handlers/product/updateProduct.handler',
      'Update product information'
    );

    this.deleteProduct = createLambdaFunction(
      'DeleteProductFunction',
      'delete-product',
      'dist/handlers/product/deleteProduct.handler',
      'Delete a product'
    );

    this.getProducts = createLambdaFunction(
      'GetProductsFunction',
      'get-products',
      'dist/handlers/product/getProducts.handler',
      'Get product list with filters'
    );

    this.tagProductOnPost = createLambdaFunction(
      'TagProductOnPostFunction',
      'tag-product-on-post',
      'dist/handlers/product/tagProductOnPost.handler',
      'Tag products on a post'
    );

    this.getPostProducts = createLambdaFunction(
      'GetPostProductsFunction',
      'get-post-products',
      'dist/handlers/product/getPostProducts.handler',
      'Get products tagged on a post'
    );

    this.clickProduct = createLambdaFunction(
      'ClickProductFunction',
      'click-product',
      'dist/handlers/product/clickProduct.handler',
      'Track product link clicks'
    );

    // =====================================================
    // Cognito Triggers
    // =====================================================

    // Post Confirmation Trigger
    // メール確認後、DynamoDBにアカウントを作成
    this.postConfirmation = createLambdaFunction(
      'PostConfirmationFunction',
      'post-confirmation',
      'dist/handlers/cognito/postConfirmation.handler',
      'Cognito Post Confirmation Trigger - Create account in DynamoDB'
    );

    // Cognito Admin権限を追加（AdminDeleteUserのため）
    this.postConfirmation.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'cognito-idp:AdminDeleteUser',
          'cognito-idp:AdminGetUser',
        ],
        resources: [
          `arn:aws:cognito-idp:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:userpool/*`,
        ],
      })
    );

    // =====================================================
    // Outputs
    // =====================================================

    new cdk.CfnOutput(this, 'CreateAccountFunctionArn', {
      value: this.createAccount.functionArn,
      exportName: `PieceApp-CreateAccountArn-${environment}`,
    });

    new cdk.CfnOutput(this, 'CreatePostFunctionArn', {
      value: this.createPost.functionArn,
      exportName: `PieceApp-CreatePostArn-${environment}`,
    });
  }
}
