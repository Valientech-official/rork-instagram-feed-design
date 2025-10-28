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
      'handlers/account/createAccount.handler',
      'Create new account'
    );

    this.getProfile = createLambdaFunction(
      'GetProfileFunction',
      'get-profile',
      'handlers/account/getProfile.handler',
      'Get user profile'
    );

    this.updateProfile = createLambdaFunction(
      'UpdateProfileFunction',
      'update-profile',
      'handlers/account/updateProfile.handler',
      'Update user profile'
    );

    // Post
    this.createPost = createLambdaFunction(
      'CreatePostFunction',
      'create-post',
      'handlers/post/createPost.handler',
      'Create new post'
    );

    this.getPost = createLambdaFunction(
      'GetPostFunction',
      'get-post',
      'handlers/post/getPost.handler',
      'Get post details'
    );

    this.deletePost = createLambdaFunction(
      'DeletePostFunction',
      'delete-post',
      'handlers/post/deletePost.handler',
      'Delete post'
    );

    this.getTimeline = createLambdaFunction(
      'GetTimelineFunction',
      'get-timeline',
      'handlers/post/getTimeline.handler',
      'Get user timeline'
    );

    // Like
    this.likePost = createLambdaFunction(
      'LikePostFunction',
      'like-post',
      'handlers/like/likePost.handler',
      'Like a post'
    );

    this.unlikePost = createLambdaFunction(
      'UnlikePostFunction',
      'unlike-post',
      'handlers/like/unlikePost.handler',
      'Unlike a post'
    );

    // Comment
    this.createComment = createLambdaFunction(
      'CreateCommentFunction',
      'create-comment',
      'handlers/comment/createComment.handler',
      'Create comment on post'
    );

    this.deleteComment = createLambdaFunction(
      'DeleteCommentFunction',
      'delete-comment',
      'handlers/comment/deleteComment.handler',
      'Delete comment'
    );

    this.getComments = createLambdaFunction(
      'GetCommentsFunction',
      'get-comments',
      'handlers/comment/getComments.handler',
      'Get comments for post'
    );

    // Follow
    this.followUser = createLambdaFunction(
      'FollowUserFunction',
      'follow-user',
      'handlers/follow/followUser.handler',
      'Follow a user'
    );

    this.unfollowUser = createLambdaFunction(
      'UnfollowUserFunction',
      'unfollow-user',
      'handlers/follow/unfollowUser.handler',
      'Unfollow a user'
    );

    // Room
    this.createRoom = createLambdaFunction(
      'CreateRoomFunction',
      'create-room',
      'handlers/room/createRoom.handler',
      'Create new room'
    );

    this.joinRoom = createLambdaFunction(
      'JoinRoomFunction',
      'join-room',
      'handlers/room/joinRoom.handler',
      'Join a room'
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
