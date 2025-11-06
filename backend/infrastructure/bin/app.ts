#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { S3Stack } from '../lib/s3-stack';
import { DynamoDBStack } from '../lib/dynamodb-stack';
import { LambdaStack } from '../lib/lambda-stack';
import { CognitoStack } from '../lib/cognito-stack';
import { ApiGatewayStack } from '../lib/api-gateway-stack';

const app = new cdk.App();

// リージョン設定
const region = 'ap-northeast-1'; // 東京

// =====================================================
// 開発環境（dev）
// =====================================================
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: region,
};

// 1. DynamoDB Stack（最初にデプロイ）
const devDynamoDBStack = new DynamoDBStack(app, 'PieceApp-DynamoDB-Dev', {
  env: devEnv,
  environment: 'dev',
  removalPolicy: cdk.RemovalPolicy.DESTROY, // 開発環境: スタック削除時にテーブルも削除
  description: '27 DynamoDB tables with 50 GSIs (Development)',
});

// 2. S3 Stack（独立）
const devS3Stack = new S3Stack(app, 'PieceApp-S3-Dev', {
  env: devEnv,
  environment: 'dev',
  removalPolicy: cdk.RemovalPolicy.DESTROY, // 開発環境: スタック削除時にバケットも削除
  description: 'S3 bucket for media files (Development)',
});

// 3. Lambda Stack（DynamoDBに依存）
const devLambdaStack = new LambdaStack(app, 'PieceApp-Lambda-Dev', {
  env: devEnv,
  environment: 'dev',
  description: '24 Lambda functions (23 API handlers + 1 Cognito Trigger) (Development)',
});
devLambdaStack.addDependency(devDynamoDBStack);

// 4. Cognito Stack（Lambdaに依存）
const devCognitoStack = new CognitoStack(app, 'PieceApp-Cognito-Dev', {
  env: devEnv,
  environment: 'dev',
  postConfirmationLambda: devLambdaStack.postConfirmation,
  description: 'Cognito User Pool with Post Confirmation Trigger (Development)',
});
devCognitoStack.addDependency(devLambdaStack);

// 5. API Gateway Stack（Lambda + Cognitoに依存）
const devApiGatewayStack = new ApiGatewayStack(app, 'PieceApp-ApiGateway-Dev', {
  env: devEnv,
  environment: 'dev',
  lambdaFunctions: {
    createAccount: devLambdaStack.createAccount,
    getProfile: devLambdaStack.getProfile,
    updateProfile: devLambdaStack.updateProfile,
    createPost: devLambdaStack.createPost,
    getPost: devLambdaStack.getPost,
    deletePost: devLambdaStack.deletePost,
    getTimeline: devLambdaStack.getTimeline,
    likePost: devLambdaStack.likePost,
    unlikePost: devLambdaStack.unlikePost,
    createComment: devLambdaStack.createComment,
    deleteComment: devLambdaStack.deleteComment,
    getComments: devLambdaStack.getComments,
    followUser: devLambdaStack.followUser,
    unfollowUser: devLambdaStack.unfollowUser,
    createRoom: devLambdaStack.createRoom,
    joinRoom: devLambdaStack.joinRoom,
    createConversation: devLambdaStack.createConversation,
    getConversations: devLambdaStack.getConversations,
    sendMessage: devLambdaStack.sendMessage,
    getMessages: devLambdaStack.getMessages,
    blockUser: devLambdaStack.blockUser,
    unblockUser: devLambdaStack.unblockUser,
    getBlockList: devLambdaStack.getBlockList,
  },
  userPool: devCognitoStack.userPool,
  description: 'REST API Gateway with Cognito authorizer (Development)',
});
devApiGatewayStack.addDependency(devLambdaStack);
devApiGatewayStack.addDependency(devCognitoStack);

// =====================================================
// 本番環境（prod）- 後で有効化
// =====================================================
/*
const prodEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: region,
};

// 1. DynamoDB Stack
const prodDynamoDBStack = new DynamoDBStack(app, 'PieceApp-DynamoDB-Prod', {
  env: prodEnv,
  environment: 'prod',
  removalPolicy: cdk.RemovalPolicy.RETAIN, // 本番環境: スタック削除してもテーブルは保持
  description: '27 DynamoDB tables with 50 GSIs (Production)',
});

// 2. S3 Stack
const prodS3Stack = new S3Stack(app, 'PieceApp-S3-Prod', {
  env: prodEnv,
  environment: 'prod',
  removalPolicy: cdk.RemovalPolicy.RETAIN, // 本番環境: スタック削除してもバケットは保持
  description: 'S3 bucket for media files (Production)',
});

// 3. Lambda Stack
const prodLambdaStack = new LambdaStack(app, 'PieceApp-Lambda-Prod', {
  env: prodEnv,
  environment: 'prod',
  description: '16 Lambda functions for API handlers (Production)',
});
prodLambdaStack.addDependency(prodDynamoDBStack);

// 4. Cognito Stack
// ⚠️ 本番環境では以下の設定変更が必要:
// - Advanced Security Mode: ENFORCED に変更
// - Email: SES に切り替え（要: ドメイン設定、SES認証）
const prodCognitoStack = new CognitoStack(app, 'PieceApp-Cognito-Prod', {
  env: prodEnv,
  environment: 'prod',
  description: 'Cognito User Pool for authentication (Production)',
});

// 5. API Gateway Stack
const prodApiGatewayStack = new ApiGatewayStack(app, 'PieceApp-ApiGateway-Prod', {
  env: prodEnv,
  environment: 'prod',
  lambdaFunctions: {
    createAccount: prodLambdaStack.createAccount,
    getProfile: prodLambdaStack.getProfile,
    updateProfile: prodLambdaStack.updateProfile,
    createPost: prodLambdaStack.createPost,
    getPost: prodLambdaStack.getPost,
    deletePost: prodLambdaStack.deletePost,
    getTimeline: prodLambdaStack.getTimeline,
    likePost: prodLambdaStack.likePost,
    unlikePost: prodLambdaStack.unlikePost,
    createComment: prodLambdaStack.createComment,
    deleteComment: prodLambdaStack.deleteComment,
    getComments: prodLambdaStack.getComments,
    followUser: prodLambdaStack.followUser,
    unfollowUser: prodLambdaStack.unfollowUser,
    createRoom: prodLambdaStack.createRoom,
    joinRoom: prodLambdaStack.joinRoom,
  },
  userPool: prodCognitoStack.userPool,
  description: 'REST API Gateway with Cognito authorizer (Production)',
});
prodApiGatewayStack.addDependency(prodLambdaStack);
prodApiGatewayStack.addDependency(prodCognitoStack);
*/

// =====================================================
// タグ設定（全スタック共通）
// =====================================================
cdk.Tags.of(app).add('Project', 'PieceApp');
cdk.Tags.of(app).add('ManagedBy', 'CDK');

// 開発環境タグ
cdk.Tags.of(devDynamoDBStack).add('Environment', 'Development');
cdk.Tags.of(devS3Stack).add('Environment', 'Development');
cdk.Tags.of(devLambdaStack).add('Environment', 'Development');
cdk.Tags.of(devCognitoStack).add('Environment', 'Development');
cdk.Tags.of(devApiGatewayStack).add('Environment', 'Development');
