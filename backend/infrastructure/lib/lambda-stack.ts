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
