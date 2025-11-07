#!/usr/bin/env node
"use strict";
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
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const s3_stack_1 = require("../lib/s3-stack");
const dynamodb_stack_1 = require("../lib/dynamodb-stack");
const secrets_manager_stack_1 = require("../lib/secrets-manager-stack");
const websocket_stack_1 = require("../lib/websocket-stack");
const lambda_stack_1 = require("../lib/lambda-stack");
const cognito_stack_1 = require("../lib/cognito-stack");
const api_gateway_stack_1 = require("../lib/api-gateway-stack");
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
const devDynamoDBStack = new dynamodb_stack_1.DynamoDBStack(app, 'PieceApp-DynamoDB-Dev', {
    env: devEnv,
    environment: 'dev',
    removalPolicy: cdk.RemovalPolicy.DESTROY, // 開発環境: スタック削除時にテーブルも削除
    description: '28 DynamoDB tables with 53 GSIs (Development)',
});
// 2. S3 Stack（独立）
const devS3Stack = new s3_stack_1.S3Stack(app, 'PieceApp-S3-Dev', {
    env: devEnv,
    environment: 'dev',
    removalPolicy: cdk.RemovalPolicy.DESTROY, // 開発環境: スタック削除時にバケットも削除
    description: 'S3 bucket for media files (Development)',
});
// 3. Secrets Manager Stack（独立）
const devSecretsManagerStack = new secrets_manager_stack_1.SecretsManagerStack(app, 'PieceApp-SecretsManager-Dev', {
    env: devEnv,
    description: 'AWS Secrets Manager for Mux credentials (Development)',
});
// 4. Lambda Stack（DynamoDB + SecretsManagerに依存）
const devLambdaStack = new lambda_stack_1.LambdaStack(app, 'PieceApp-Lambda-Dev', {
    env: devEnv,
    environment: 'dev',
    description: '84 Lambda functions (83 API handlers + 1 Cognito Trigger) (Development)',
});
devLambdaStack.addDependency(devDynamoDBStack);
devLambdaStack.addDependency(devSecretsManagerStack);
// 5. WebSocket Stack（DynamoDBに依存）
const devWebSocketStack = new websocket_stack_1.WebSocketStack(app, 'PieceApp-WebSocket-Dev', {
    env: devEnv,
    environment: 'dev',
    connectionsTable: devDynamoDBStack.tables.connections,
    description: 'WebSocket API for live streaming chat (Development)',
});
devWebSocketStack.addDependency(devDynamoDBStack);
// 6. Cognito Stack（Lambdaに依存）
const devCognitoStack = new cognito_stack_1.CognitoStack(app, 'PieceApp-Cognito-Dev', {
    env: devEnv,
    environment: 'dev',
    postConfirmationLambda: devLambdaStack.postConfirmation,
    description: 'Cognito User Pool with Post Confirmation Trigger (Development)',
});
devCognitoStack.addDependency(devLambdaStack);
// 7. API Gateway Stack（Lambda + Cognitoに依存）
const devApiGatewayStack = new api_gateway_stack_1.ApiGatewayStack(app, 'PieceApp-ApiGateway-Dev', {
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
        createRepost: devLambdaStack.createRepost,
        deleteRepost: devLambdaStack.deleteRepost,
        createReport: devLambdaStack.createReport,
        getReports: devLambdaStack.getReports,
        getNotifications: devLambdaStack.getNotifications,
        readNotification: devLambdaStack.markAsRead,
        readAllNotifications: devLambdaStack.markAllAsRead,
        getNotificationSettings: devLambdaStack.getNotificationSettings,
        updateNotificationSettings: devLambdaStack.updateNotificationSettings,
        createSession: devLambdaStack.createSession,
        getAccountSessions: devLambdaStack.getAllAccountSessions,
        deleteSession: devLambdaStack.logoutSession,
        getHashtagPosts: devLambdaStack.searchByHashtag,
        getTrendingHashtags: devLambdaStack.getTrendingHashtags,
        muteAccount: devLambdaStack.muteUser,
        unmuteAccount: devLambdaStack.unmuteUser,
        getMuteList: devLambdaStack.getMutedUsers,
        // Stage 2A: Existing Feature Extensions (14 functions)
        updatePost: devLambdaStack.updatePost,
        getUserPosts: devLambdaStack.getUserPosts,
        getDiscoveryFeed: devLambdaStack.getDiscoveryFeed,
        getRoomPosts: devLambdaStack.getRoomPosts,
        getFollowing: devLambdaStack.getFollowing,
        getFollowers: devLambdaStack.getFollowers,
        getPostLikes: devLambdaStack.getPostLikes,
        getUserLikes: devLambdaStack.getUserLikes,
        getUserReposts: devLambdaStack.getUserReposts,
        getPostReposts: devLambdaStack.getPostReposts,
        getRoom: devLambdaStack.getRoom,
        updateRoom: devLambdaStack.updateRoom,
        getRoomMembers: devLambdaStack.getRoomMembers,
        leaveRoom: devLambdaStack.leaveRoom,
        // Stage 2B: Analytics (4 functions)
        trackEvent: devLambdaStack.trackEvent,
        getPostAnalytics: devLambdaStack.getPostAnalytics,
        getAccountAnalytics: devLambdaStack.getAccountAnalytics,
        getDashboard: devLambdaStack.getDashboard,
        // Stage 2C: Product/Shop (8 functions)
        createProduct: devLambdaStack.createProduct,
        getProduct: devLambdaStack.getProduct,
        updateProduct: devLambdaStack.updateProduct,
        deleteProduct: devLambdaStack.deleteProduct,
        getProducts: devLambdaStack.getProducts,
        tagProductOnPost: devLambdaStack.tagProductOnPost,
        getPostProducts: devLambdaStack.getPostProducts,
        clickProduct: devLambdaStack.clickProduct,
        // Stage 2E: Live Streaming (14 functions)
        createLiveStream: devLambdaStack.createLiveStream,
        deleteLiveStream: devLambdaStack.deleteLiveStream,
        getLiveStream: devLambdaStack.getLiveStream,
        getLiveStreams: devLambdaStack.getLiveStreams,
        endLiveStream: devLambdaStack.endLiveStream,
        joinLiveStream: devLambdaStack.joinLiveStream,
        leaveLiveStream: devLambdaStack.leaveLiveStream,
        sendLiveChat: devLambdaStack.sendLiveChat,
        getLiveChats: devLambdaStack.getLiveChats,
        sendGift: devLambdaStack.sendGift,
        addModerator: devLambdaStack.addModerator,
        banUserFromLive: devLambdaStack.banUserFromLive,
        muxWebhook: devLambdaStack.muxWebhook,
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
cdk.Tags.of(devSecretsManagerStack).add('Environment', 'Development');
cdk.Tags.of(devWebSocketStack).add('Environment', 'Development');
cdk.Tags.of(devLambdaStack).add('Environment', 'Development');
cdk.Tags.of(devCognitoStack).add('Environment', 'Development');
cdk.Tags.of(devApiGatewayStack).add('Environment', 'Development');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vYmluL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSx1Q0FBcUM7QUFDckMsaURBQW1DO0FBQ25DLDhDQUEwQztBQUMxQywwREFBc0Q7QUFDdEQsd0VBQW1FO0FBQ25FLDREQUF3RDtBQUN4RCxzREFBa0Q7QUFDbEQsd0RBQW9EO0FBQ3BELGdFQUEyRDtBQUUzRCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUUxQixVQUFVO0FBQ1YsTUFBTSxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLO0FBRXRDLHdEQUF3RDtBQUN4RCxZQUFZO0FBQ1osd0RBQXdEO0FBQ3hELE1BQU0sTUFBTSxHQUFHO0lBQ2IsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CO0lBQ3hDLE1BQU0sRUFBRSxNQUFNO0NBQ2YsQ0FBQztBQUVGLDZCQUE2QjtBQUM3QixNQUFNLGdCQUFnQixHQUFHLElBQUksOEJBQWEsQ0FBQyxHQUFHLEVBQUUsdUJBQXVCLEVBQUU7SUFDdkUsR0FBRyxFQUFFLE1BQU07SUFDWCxXQUFXLEVBQUUsS0FBSztJQUNsQixhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsd0JBQXdCO0lBQ2xFLFdBQVcsRUFBRSwrQ0FBK0M7Q0FDN0QsQ0FBQyxDQUFDO0FBRUgsa0JBQWtCO0FBQ2xCLE1BQU0sVUFBVSxHQUFHLElBQUksa0JBQU8sQ0FBQyxHQUFHLEVBQUUsaUJBQWlCLEVBQUU7SUFDckQsR0FBRyxFQUFFLE1BQU07SUFDWCxXQUFXLEVBQUUsS0FBSztJQUNsQixhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsd0JBQXdCO0lBQ2xFLFdBQVcsRUFBRSx5Q0FBeUM7Q0FDdkQsQ0FBQyxDQUFDO0FBRUgs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Q0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQy9ELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGtCQUFrQixDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcclxuaW1wb3J0ICdzb3VyY2UtbWFwLXN1cHBvcnQvcmVnaXN0ZXInO1xyXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xyXG5pbXBvcnQgeyBTM1N0YWNrIH0gZnJvbSAnLi4vbGliL3MzLXN0YWNrJztcclxuaW1wb3J0IHsgRHluYW1vREJTdGFjayB9IGZyb20gJy4uL2xpYi9keW5hbW9kYi1zdGFjayc7XHJcbmltcG9ydCB7IFNlY3JldHNNYW5hZ2VyU3RhY2sgfSBmcm9tICcuLi9saWIvc2VjcmV0cy1tYW5hZ2VyLXN0YWNrJztcclxuaW1wb3J0IHsgV2ViU29ja2V0U3RhY2sgfSBmcm9tICcuLi9saWIvd2Vic29ja2V0LXN0YWNrJztcclxuaW1wb3J0IHsgTGFtYmRhU3RhY2sgfSBmcm9tICcuLi9saWIvbGFtYmRhLXN0YWNrJztcclxuaW1wb3J0IHsgQ29nbml0b1N0YWNrIH0gZnJvbSAnLi4vbGliL2NvZ25pdG8tc3RhY2snO1xyXG5pbXBvcnQgeyBBcGlHYXRld2F5U3RhY2sgfSBmcm9tICcuLi9saWIvYXBpLWdhdGV3YXktc3RhY2snO1xyXG5cclxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcclxuXHJcbi8vIOODquODvOOCuOODp+ODs+ioreWumlxyXG5jb25zdCByZWdpb24gPSAnYXAtbm9ydGhlYXN0LTEnOyAvLyDmnbHkuqxcclxuXHJcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbi8vIOmWi+eZuueSsOWig++8iGRldu+8iVxyXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5jb25zdCBkZXZFbnYgPSB7XHJcbiAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcclxuICByZWdpb246IHJlZ2lvbixcclxufTtcclxuXHJcbi8vIDEuIER5bmFtb0RCIFN0YWNr77yI5pyA5Yid44Gr44OH44OX44Ot44Kk77yJXHJcbmNvbnN0IGRldkR5bmFtb0RCU3RhY2sgPSBuZXcgRHluYW1vREJTdGFjayhhcHAsICdQaWVjZUFwcC1EeW5hbW9EQi1EZXYnLCB7XHJcbiAgZW52OiBkZXZFbnYsXHJcbiAgZW52aXJvbm1lbnQ6ICdkZXYnLFxyXG4gIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksIC8vIOmWi+eZuueSsOWigzog44K544K/44OD44Kv5YmK6Zmk5pmC44Gr44OG44O844OW44Or44KC5YmK6ZmkXHJcbiAgZGVzY3JpcHRpb246ICcyOCBEeW5hbW9EQiB0YWJsZXMgd2l0aCA1MyBHU0lzIChEZXZlbG9wbWVudCknLFxyXG59KTtcclxuXHJcbi8vIDIuIFMzIFN0YWNr77yI54us56uL77yJXHJcbmNvbnN0IGRldlMzU3RhY2sgPSBuZXcgUzNTdGFjayhhcHAsICdQaWVjZUFwcC1TMy1EZXYnLCB7XHJcbiAgZW52OiBkZXZFbnYsXHJcbiAgZW52aXJvbm1lbnQ6ICdkZXYnLFxyXG4gIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksIC8vIOmWi+eZuueSsOWigzog44K544K/44OD44Kv5YmK6Zmk5pmC44Gr44OQ44Kx44OD44OI44KC5YmK6ZmkXHJcbiAgZGVzY3JpcHRpb246ICdTMyBidWNrZXQgZm9yIG1lZGlhIGZpbGVzIChEZXZlbG9wbWVudCknLFxyXG59KTtcclxuXHJcbi8vIDMuIFNlY3JldHMgTWFuYWdlciBTdGFja++8iOeLrOeri++8iVxyXG5jb25zdCBkZXZTZWNyZXRzTWFuYWdlclN0YWNrID0gbmV3IFNlY3JldHNNYW5hZ2VyU3RhY2soYXBwLCAnUGllY2VBcHAtU2VjcmV0c01hbmFnZXItRGV2Jywge1xyXG4gIGVudjogZGV2RW52LFxyXG4gIGRlc2NyaXB0aW9uOiAnQVdTIFNlY3JldHMgTWFuYWdlciBmb3IgTXV4IGNyZWRlbnRpYWxzIChEZXZlbG9wbWVudCknLFxyXG59KTtcclxuXHJcbi8vIDQuIExhbWJkYSBTdGFja++8iER5bmFtb0RCICsgU2VjcmV0c01hbmFnZXLjgavkvp3lrZjvvIlcclxuY29uc3QgZGV2TGFtYmRhU3RhY2sgPSBuZXcgTGFtYmRhU3RhY2soYXBwLCAnUGllY2VBcHAtTGFtYmRhLURldicsIHtcclxuICBlbnY6IGRldkVudixcclxuICBlbnZpcm9ubWVudDogJ2RldicsXHJcbiAgZGVzY3JpcHRpb246ICc4NCBMYW1iZGEgZnVuY3Rpb25zICg4MyBBUEkgaGFuZGxlcnMgKyAxIENvZ25pdG8gVHJpZ2dlcikgKERldmVsb3BtZW50KScsXHJcbn0pO1xyXG5kZXZMYW1iZGFTdGFjay5hZGREZXBlbmRlbmN5KGRldkR5bmFtb0RCU3RhY2spO1xyXG5kZXZMYW1iZGFTdGFjay5hZGREZXBlbmRlbmN5KGRldlNlY3JldHNNYW5hZ2VyU3RhY2spO1xyXG5cclxuLy8gNS4gV2ViU29ja2V0IFN0YWNr77yIRHluYW1vRELjgavkvp3lrZjvvIlcclxuY29uc3QgZGV2V2ViU29ja2V0U3RhY2sgPSBuZXcgV2ViU29ja2V0U3RhY2soYXBwLCAnUGllY2VBcHAtV2ViU29ja2V0LURldicsIHtcclxuICBlbnY6IGRldkVudixcclxuICBlbnZpcm9ubWVudDogJ2RldicsXHJcbiAgY29ubmVjdGlvbnNUYWJsZTogZGV2RHluYW1vREJTdGFjay50YWJsZXMuY29ubmVjdGlvbnMsXHJcbiAgZGVzY3JpcHRpb246ICdXZWJTb2NrZXQgQVBJIGZvciBsaXZlIHN0cmVhbWluZyBjaGF0IChEZXZlbG9wbWVudCknLFxyXG59KTtcclxuZGV2V2ViU29ja2V0U3RhY2suYWRkRGVwZW5kZW5jeShkZXZEeW5hbW9EQlN0YWNrKTtcclxuXHJcbi8vIDYuIENvZ25pdG8gU3RhY2vvvIhMYW1iZGHjgavkvp3lrZjvvIlcclxuY29uc3QgZGV2Q29nbml0b1N0YWNrID0gbmV3IENvZ25pdG9TdGFjayhhcHAsICdQaWVjZUFwcC1Db2duaXRvLURldicsIHtcclxuICBlbnY6IGRldkVudixcclxuICBlbnZpcm9ubWVudDogJ2RldicsXHJcbiAgcG9zdENvbmZpcm1hdGlvbkxhbWJkYTogZGV2TGFtYmRhU3RhY2sucG9zdENvbmZpcm1hdGlvbixcclxuICBkZXNjcmlwdGlvbjogJ0NvZ25pdG8gVXNlciBQb29sIHdpdGggUG9zdCBDb25maXJtYXRpb24gVHJpZ2dlciAoRGV2ZWxvcG1lbnQpJyxcclxufSk7XHJcbmRldkNvZ25pdG9TdGFjay5hZGREZXBlbmRlbmN5KGRldkxhbWJkYVN0YWNrKTtcclxuXHJcbi8vIDcuIEFQSSBHYXRld2F5IFN0YWNr77yITGFtYmRhICsgQ29nbml0b+OBq+S+neWtmO+8iVxyXG5jb25zdCBkZXZBcGlHYXRld2F5U3RhY2sgPSBuZXcgQXBpR2F0ZXdheVN0YWNrKGFwcCwgJ1BpZWNlQXBwLUFwaUdhdGV3YXktRGV2Jywge1xyXG4gIGVudjogZGV2RW52LFxyXG4gIGVudmlyb25tZW50OiAnZGV2JyxcclxuICBsYW1iZGFGdW5jdGlvbnM6IHtcclxuICAgIGNyZWF0ZUFjY291bnQ6IGRldkxhbWJkYVN0YWNrLmNyZWF0ZUFjY291bnQsXHJcbiAgICBnZXRQcm9maWxlOiBkZXZMYW1iZGFTdGFjay5nZXRQcm9maWxlLFxyXG4gICAgdXBkYXRlUHJvZmlsZTogZGV2TGFtYmRhU3RhY2sudXBkYXRlUHJvZmlsZSxcclxuICAgIGNyZWF0ZVBvc3Q6IGRldkxhbWJkYVN0YWNrLmNyZWF0ZVBvc3QsXHJcbiAgICBnZXRQb3N0OiBkZXZMYW1iZGFTdGFjay5nZXRQb3N0LFxyXG4gICAgZGVsZXRlUG9zdDogZGV2TGFtYmRhU3RhY2suZGVsZXRlUG9zdCxcclxuICAgIGdldFRpbWVsaW5lOiBkZXZMYW1iZGFTdGFjay5nZXRUaW1lbGluZSxcclxuICAgIGxpa2VQb3N0OiBkZXZMYW1iZGFTdGFjay5saWtlUG9zdCxcclxuICAgIHVubGlrZVBvc3Q6IGRldkxhbWJkYVN0YWNrLnVubGlrZVBvc3QsXHJcbiAgICBjcmVhdGVDb21tZW50OiBkZXZMYW1iZGFTdGFjay5jcmVhdGVDb21tZW50LFxyXG4gICAgZGVsZXRlQ29tbWVudDogZGV2TGFtYmRhU3RhY2suZGVsZXRlQ29tbWVudCxcclxuICAgIGdldENvbW1lbnRzOiBkZXZMYW1iZGFTdGFjay5nZXRDb21tZW50cyxcclxuICAgIGZvbGxvd1VzZXI6IGRldkxhbWJkYVN0YWNrLmZvbGxvd1VzZXIsXHJcbiAgICB1bmZvbGxvd1VzZXI6IGRldkxhbWJkYVN0YWNrLnVuZm9sbG93VXNlcixcclxuICAgIGNyZWF0ZVJvb206IGRldkxhbWJkYVN0YWNrLmNyZWF0ZVJvb20sXHJcbiAgICBqb2luUm9vbTogZGV2TGFtYmRhU3RhY2suam9pblJvb20sXHJcbiAgICBjcmVhdGVDb252ZXJzYXRpb246IGRldkxhbWJkYVN0YWNrLmNyZWF0ZUNvbnZlcnNhdGlvbixcclxuICAgIGdldENvbnZlcnNhdGlvbnM6IGRldkxhbWJkYVN0YWNrLmdldENvbnZlcnNhdGlvbnMsXHJcbiAgICBzZW5kTWVzc2FnZTogZGV2TGFtYmRhU3RhY2suc2VuZE1lc3NhZ2UsXHJcbiAgICBnZXRNZXNzYWdlczogZGV2TGFtYmRhU3RhY2suZ2V0TWVzc2FnZXMsXHJcbiAgICBibG9ja1VzZXI6IGRldkxhbWJkYVN0YWNrLmJsb2NrVXNlcixcclxuICAgIHVuYmxvY2tVc2VyOiBkZXZMYW1iZGFTdGFjay51bmJsb2NrVXNlcixcclxuICAgIGdldEJsb2NrTGlzdDogZGV2TGFtYmRhU3RhY2suZ2V0QmxvY2tMaXN0LFxyXG4gICAgY3JlYXRlUmVwb3N0OiBkZXZMYW1iZGFTdGFjay5jcmVhdGVSZXBvc3QsXHJcbiAgICBkZWxldGVSZXBvc3Q6IGRldkxhbWJkYVN0YWNrLmRlbGV0ZVJlcG9zdCxcclxuICAgIGNyZWF0ZVJlcG9ydDogZGV2TGFtYmRhU3RhY2suY3JlYXRlUmVwb3J0LFxyXG4gICAgZ2V0UmVwb3J0czogZGV2TGFtYmRhU3RhY2suZ2V0UmVwb3J0cyxcclxuICAgIGdldE5vdGlmaWNhdGlvbnM6IGRldkxhbWJkYVN0YWNrLmdldE5vdGlmaWNhdGlvbnMsXHJcbiAgICByZWFkTm90aWZpY2F0aW9uOiBkZXZMYW1iZGFTdGFjay5tYXJrQXNSZWFkLFxyXG4gICAgcmVhZEFsbE5vdGlmaWNhdGlvbnM6IGRldkxhbWJkYVN0YWNrLm1hcmtBbGxBc1JlYWQsXHJcbiAgICBnZXROb3RpZmljYXRpb25TZXR0aW5nczogZGV2TGFtYmRhU3RhY2suZ2V0Tm90aWZpY2F0aW9uU2V0dGluZ3MsXHJcbiAgICB1cGRhdGVOb3RpZmljYXRpb25TZXR0aW5nczogZGV2TGFtYmRhU3RhY2sudXBkYXRlTm90aWZpY2F0aW9uU2V0dGluZ3MsXHJcbiAgICBjcmVhdGVTZXNzaW9uOiBkZXZMYW1iZGFTdGFjay5jcmVhdGVTZXNzaW9uLFxyXG4gICAgZ2V0QWNjb3VudFNlc3Npb25zOiBkZXZMYW1iZGFTdGFjay5nZXRBbGxBY2NvdW50U2Vzc2lvbnMsXHJcbiAgICBkZWxldGVTZXNzaW9uOiBkZXZMYW1iZGFTdGFjay5sb2dvdXRTZXNzaW9uLFxyXG4gICAgZ2V0SGFzaHRhZ1Bvc3RzOiBkZXZMYW1iZGFTdGFjay5zZWFyY2hCeUhhc2h0YWcsXHJcbiAgICBnZXRUcmVuZGluZ0hhc2h0YWdzOiBkZXZMYW1iZGFTdGFjay5nZXRUcmVuZGluZ0hhc2h0YWdzLFxyXG4gICAgbXV0ZUFjY291bnQ6IGRldkxhbWJkYVN0YWNrLm11dGVVc2VyLFxyXG4gICAgdW5tdXRlQWNjb3VudDogZGV2TGFtYmRhU3RhY2sudW5tdXRlVXNlcixcclxuICAgIGdldE11dGVMaXN0OiBkZXZMYW1iZGFTdGFjay5nZXRNdXRlZFVzZXJzLFxyXG4gICAgLy8gU3RhZ2UgMkE6IEV4aXN0aW5nIEZlYXR1cmUgRXh0ZW5zaW9ucyAoMTQgZnVuY3Rpb25zKVxyXG4gICAgdXBkYXRlUG9zdDogZGV2TGFtYmRhU3RhY2sudXBkYXRlUG9zdCxcclxuICAgIGdldFVzZXJQb3N0czogZGV2TGFtYmRhU3RhY2suZ2V0VXNlclBvc3RzLFxyXG4gICAgZ2V0RGlzY292ZXJ5RmVlZDogZGV2TGFtYmRhU3RhY2suZ2V0RGlzY292ZXJ5RmVlZCxcclxuICAgIGdldFJvb21Qb3N0czogZGV2TGFtYmRhU3RhY2suZ2V0Um9vbVBvc3RzLFxyXG4gICAgZ2V0Rm9sbG93aW5nOiBkZXZMYW1iZGFTdGFjay5nZXRGb2xsb3dpbmcsXHJcbiAgICBnZXRGb2xsb3dlcnM6IGRldkxhbWJkYVN0YWNrLmdldEZvbGxvd2VycyxcclxuICAgIGdldFBvc3RMaWtlczogZGV2TGFtYmRhU3RhY2suZ2V0UG9zdExpa2VzLFxyXG4gICAgZ2V0VXNlckxpa2VzOiBkZXZMYW1iZGFTdGFjay5nZXRVc2VyTGlrZXMsXHJcbiAgICBnZXRVc2VyUmVwb3N0czogZGV2TGFtYmRhU3RhY2suZ2V0VXNlclJlcG9zdHMsXHJcbiAgICBnZXRQb3N0UmVwb3N0czogZGV2TGFtYmRhU3RhY2suZ2V0UG9zdFJlcG9zdHMsXHJcbiAgICBnZXRSb29tOiBkZXZMYW1iZGFTdGFjay5nZXRSb29tLFxyXG4gICAgdXBkYXRlUm9vbTogZGV2TGFtYmRhU3RhY2sudXBkYXRlUm9vbSxcclxuICAgIGdldFJvb21NZW1iZXJzOiBkZXZMYW1iZGFTdGFjay5nZXRSb29tTWVtYmVycyxcclxuICAgIGxlYXZlUm9vbTogZGV2TGFtYmRhU3RhY2subGVhdmVSb29tLFxyXG4gICAgLy8gU3RhZ2UgMkI6IEFuYWx5dGljcyAoNCBmdW5jdGlvbnMpXHJcbiAgICB0cmFja0V2ZW50OiBkZXZMYW1iZGFTdGFjay50cmFja0V2ZW50LFxyXG4gICAgZ2V0UG9zdEFuYWx5dGljczogZGV2TGFtYmRhU3RhY2suZ2V0UG9zdEFuYWx5dGljcyxcclxuICAgIGdldEFjY291bnRBbmFseXRpY3M6IGRldkxhbWJkYVN0YWNrLmdldEFjY291bnRBbmFseXRpY3MsXHJcbiAgICBnZXREYXNoYm9hcmQ6IGRldkxhbWJkYVN0YWNrLmdldERhc2hib2FyZCxcclxuICAgIC8vIFN0YWdlIDJDOiBQcm9kdWN0L1Nob3AgKDggZnVuY3Rpb25zKVxyXG4gICAgY3JlYXRlUHJvZHVjdDogZGV2TGFtYmRhU3RhY2suY3JlYXRlUHJvZHVjdCxcclxuICAgIGdldFByb2R1Y3Q6IGRldkxhbWJkYVN0YWNrLmdldFByb2R1Y3QsXHJcbiAgICB1cGRhdGVQcm9kdWN0OiBkZXZMYW1iZGFTdGFjay51cGRhdGVQcm9kdWN0LFxyXG4gICAgZGVsZXRlUHJvZHVjdDogZGV2TGFtYmRhU3RhY2suZGVsZXRlUHJvZHVjdCxcclxuICAgIGdldFByb2R1Y3RzOiBkZXZMYW1iZGFTdGFjay5nZXRQcm9kdWN0cyxcclxuICAgIHRhZ1Byb2R1Y3RPblBvc3Q6IGRldkxhbWJkYVN0YWNrLnRhZ1Byb2R1Y3RPblBvc3QsXHJcbiAgICBnZXRQb3N0UHJvZHVjdHM6IGRldkxhbWJkYVN0YWNrLmdldFBvc3RQcm9kdWN0cyxcclxuICAgIGNsaWNrUHJvZHVjdDogZGV2TGFtYmRhU3RhY2suY2xpY2tQcm9kdWN0LFxyXG4gICAgLy8gU3RhZ2UgMkU6IExpdmUgU3RyZWFtaW5nICgxNCBmdW5jdGlvbnMpXHJcbiAgICBjcmVhdGVMaXZlU3RyZWFtOiBkZXZMYW1iZGFTdGFjay5jcmVhdGVMaXZlU3RyZWFtLFxyXG4gICAgZGVsZXRlTGl2ZVN0cmVhbTogZGV2TGFtYmRhU3RhY2suZGVsZXRlTGl2ZVN0cmVhbSxcclxuICAgIGdldExpdmVTdHJlYW06IGRldkxhbWJkYVN0YWNrLmdldExpdmVTdHJlYW0sXHJcbiAgICBnZXRMaXZlU3RyZWFtczogZGV2TGFtYmRhU3RhY2suZ2V0TGl2ZVN0cmVhbXMsXHJcbiAgICBlbmRMaXZlU3RyZWFtOiBkZXZMYW1iZGFTdGFjay5lbmRMaXZlU3RyZWFtLFxyXG4gICAgam9pbkxpdmVTdHJlYW06IGRldkxhbWJkYVN0YWNrLmpvaW5MaXZlU3RyZWFtLFxyXG4gICAgbGVhdmVMaXZlU3RyZWFtOiBkZXZMYW1iZGFTdGFjay5sZWF2ZUxpdmVTdHJlYW0sXHJcbiAgICBzZW5kTGl2ZUNoYXQ6IGRldkxhbWJkYVN0YWNrLnNlbmRMaXZlQ2hhdCxcclxuICAgIGdldExpdmVDaGF0czogZGV2TGFtYmRhU3RhY2suZ2V0TGl2ZUNoYXRzLFxyXG4gICAgc2VuZEdpZnQ6IGRldkxhbWJkYVN0YWNrLnNlbmRHaWZ0LFxyXG4gICAgYWRkTW9kZXJhdG9yOiBkZXZMYW1iZGFTdGFjay5hZGRNb2RlcmF0b3IsXHJcbiAgICBiYW5Vc2VyRnJvbUxpdmU6IGRldkxhbWJkYVN0YWNrLmJhblVzZXJGcm9tTGl2ZSxcclxuICAgIG11eFdlYmhvb2s6IGRldkxhbWJkYVN0YWNrLm11eFdlYmhvb2ssXHJcbiAgfSxcclxuICB1c2VyUG9vbDogZGV2Q29nbml0b1N0YWNrLnVzZXJQb29sLFxyXG4gIGRlc2NyaXB0aW9uOiAnUkVTVCBBUEkgR2F0ZXdheSB3aXRoIENvZ25pdG8gYXV0aG9yaXplciAoRGV2ZWxvcG1lbnQpJyxcclxufSk7XHJcbmRldkFwaUdhdGV3YXlTdGFjay5hZGREZXBlbmRlbmN5KGRldkxhbWJkYVN0YWNrKTtcclxuZGV2QXBpR2F0ZXdheVN0YWNrLmFkZERlcGVuZGVuY3koZGV2Q29nbml0b1N0YWNrKTtcclxuXHJcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbi8vIOacrOeVqueSsOWig++8iHByb2TvvIktIOW+jOOBp+acieWKueWMllxyXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4vKlxyXG5jb25zdCBwcm9kRW52ID0ge1xyXG4gIGFjY291bnQ6IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX0FDQ09VTlQsXHJcbiAgcmVnaW9uOiByZWdpb24sXHJcbn07XHJcblxyXG4vLyAxLiBEeW5hbW9EQiBTdGFja1xyXG5jb25zdCBwcm9kRHluYW1vREJTdGFjayA9IG5ldyBEeW5hbW9EQlN0YWNrKGFwcCwgJ1BpZWNlQXBwLUR5bmFtb0RCLVByb2QnLCB7XHJcbiAgZW52OiBwcm9kRW52LFxyXG4gIGVudmlyb25tZW50OiAncHJvZCcsXHJcbiAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLCAvLyDmnKznlarnkrDlooM6IOOCueOCv+ODg+OCr+WJiumZpOOBl+OBpuOCguODhuODvOODluODq+OBr+S/neaMgVxyXG4gIGRlc2NyaXB0aW9uOiAnMjcgRHluYW1vREIgdGFibGVzIHdpdGggNTAgR1NJcyAoUHJvZHVjdGlvbiknLFxyXG59KTtcclxuXHJcbi8vIDIuIFMzIFN0YWNrXHJcbmNvbnN0IHByb2RTM1N0YWNrID0gbmV3IFMzU3RhY2soYXBwLCAnUGllY2VBcHAtUzMtUHJvZCcsIHtcclxuICBlbnY6IHByb2RFbnYsXHJcbiAgZW52aXJvbm1lbnQ6ICdwcm9kJyxcclxuICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sIC8vIOacrOeVqueSsOWigzog44K544K/44OD44Kv5YmK6Zmk44GX44Gm44KC44OQ44Kx44OD44OI44Gv5L+d5oyBXHJcbiAgZGVzY3JpcHRpb246ICdTMyBidWNrZXQgZm9yIG1lZGlhIGZpbGVzIChQcm9kdWN0aW9uKScsXHJcbn0pO1xyXG5cclxuLy8gMy4gTGFtYmRhIFN0YWNrXHJcbmNvbnN0IHByb2RMYW1iZGFTdGFjayA9IG5ldyBMYW1iZGFTdGFjayhhcHAsICdQaWVjZUFwcC1MYW1iZGEtUHJvZCcsIHtcclxuICBlbnY6IHByb2RFbnYsXHJcbiAgZW52aXJvbm1lbnQ6ICdwcm9kJyxcclxuICBkZXNjcmlwdGlvbjogJzE2IExhbWJkYSBmdW5jdGlvbnMgZm9yIEFQSSBoYW5kbGVycyAoUHJvZHVjdGlvbiknLFxyXG59KTtcclxucHJvZExhbWJkYVN0YWNrLmFkZERlcGVuZGVuY3kocHJvZER5bmFtb0RCU3RhY2spO1xyXG5cclxuLy8gNC4gQ29nbml0byBTdGFja1xyXG4vLyDimqDvuI8g5pys55Wq55Kw5aKD44Gn44Gv5Lul5LiL44Gu6Kit5a6a5aSJ5pu044GM5b+F6KaBOlxyXG4vLyAtIEFkdmFuY2VkIFNlY3VyaXR5IE1vZGU6IEVORk9SQ0VEIOOBq+WkieabtFxyXG4vLyAtIEVtYWlsOiBTRVMg44Gr5YiH44KK5pu/44GI77yI6KaBOiDjg4njg6HjgqTjg7PoqK3lrprjgIFTRVPoqo3oqLzvvIlcclxuY29uc3QgcHJvZENvZ25pdG9TdGFjayA9IG5ldyBDb2duaXRvU3RhY2soYXBwLCAnUGllY2VBcHAtQ29nbml0by1Qcm9kJywge1xyXG4gIGVudjogcHJvZEVudixcclxuICBlbnZpcm9ubWVudDogJ3Byb2QnLFxyXG4gIGRlc2NyaXB0aW9uOiAnQ29nbml0byBVc2VyIFBvb2wgZm9yIGF1dGhlbnRpY2F0aW9uIChQcm9kdWN0aW9uKScsXHJcbn0pO1xyXG5cclxuLy8gNS4gQVBJIEdhdGV3YXkgU3RhY2tcclxuY29uc3QgcHJvZEFwaUdhdGV3YXlTdGFjayA9IG5ldyBBcGlHYXRld2F5U3RhY2soYXBwLCAnUGllY2VBcHAtQXBpR2F0ZXdheS1Qcm9kJywge1xyXG4gIGVudjogcHJvZEVudixcclxuICBlbnZpcm9ubWVudDogJ3Byb2QnLFxyXG4gIGxhbWJkYUZ1bmN0aW9uczoge1xyXG4gICAgY3JlYXRlQWNjb3VudDogcHJvZExhbWJkYVN0YWNrLmNyZWF0ZUFjY291bnQsXHJcbiAgICBnZXRQcm9maWxlOiBwcm9kTGFtYmRhU3RhY2suZ2V0UHJvZmlsZSxcclxuICAgIHVwZGF0ZVByb2ZpbGU6IHByb2RMYW1iZGFTdGFjay51cGRhdGVQcm9maWxlLFxyXG4gICAgY3JlYXRlUG9zdDogcHJvZExhbWJkYVN0YWNrLmNyZWF0ZVBvc3QsXHJcbiAgICBnZXRQb3N0OiBwcm9kTGFtYmRhU3RhY2suZ2V0UG9zdCxcclxuICAgIGRlbGV0ZVBvc3Q6IHByb2RMYW1iZGFTdGFjay5kZWxldGVQb3N0LFxyXG4gICAgZ2V0VGltZWxpbmU6IHByb2RMYW1iZGFTdGFjay5nZXRUaW1lbGluZSxcclxuICAgIGxpa2VQb3N0OiBwcm9kTGFtYmRhU3RhY2subGlrZVBvc3QsXHJcbiAgICB1bmxpa2VQb3N0OiBwcm9kTGFtYmRhU3RhY2sudW5saWtlUG9zdCxcclxuICAgIGNyZWF0ZUNvbW1lbnQ6IHByb2RMYW1iZGFTdGFjay5jcmVhdGVDb21tZW50LFxyXG4gICAgZGVsZXRlQ29tbWVudDogcHJvZExhbWJkYVN0YWNrLmRlbGV0ZUNvbW1lbnQsXHJcbiAgICBnZXRDb21tZW50czogcHJvZExhbWJkYVN0YWNrLmdldENvbW1lbnRzLFxyXG4gICAgZm9sbG93VXNlcjogcHJvZExhbWJkYVN0YWNrLmZvbGxvd1VzZXIsXHJcbiAgICB1bmZvbGxvd1VzZXI6IHByb2RMYW1iZGFTdGFjay51bmZvbGxvd1VzZXIsXHJcbiAgICBjcmVhdGVSb29tOiBwcm9kTGFtYmRhU3RhY2suY3JlYXRlUm9vbSxcclxuICAgIGpvaW5Sb29tOiBwcm9kTGFtYmRhU3RhY2suam9pblJvb20sXHJcbiAgfSxcclxuICB1c2VyUG9vbDogcHJvZENvZ25pdG9TdGFjay51c2VyUG9vbCxcclxuICBkZXNjcmlwdGlvbjogJ1JFU1QgQVBJIEdhdGV3YXkgd2l0aCBDb2duaXRvIGF1dGhvcml6ZXIgKFByb2R1Y3Rpb24pJyxcclxufSk7XHJcbnByb2RBcGlHYXRld2F5U3RhY2suYWRkRGVwZW5kZW5jeShwcm9kTGFtYmRhU3RhY2spO1xyXG5wcm9kQXBpR2F0ZXdheVN0YWNrLmFkZERlcGVuZGVuY3kocHJvZENvZ25pdG9TdGFjayk7XHJcbiovXHJcblxyXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4vLyDjgr/jgrDoqK3lrprvvIjlhajjgrnjgr/jg4Pjgq/lhbHpgJrvvIlcclxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuY2RrLlRhZ3Mub2YoYXBwKS5hZGQoJ1Byb2plY3QnLCAnUGllY2VBcHAnKTtcclxuY2RrLlRhZ3Mub2YoYXBwKS5hZGQoJ01hbmFnZWRCeScsICdDREsnKTtcclxuXHJcbi8vIOmWi+eZuueSsOWig+OCv+OCsFxyXG5jZGsuVGFncy5vZihkZXZEeW5hbW9EQlN0YWNrKS5hZGQoJ0Vudmlyb25tZW50JywgJ0RldmVsb3BtZW50Jyk7XHJcbmNkay5UYWdzLm9mKGRldlMzU3RhY2spLmFkZCgnRW52aXJvbm1lbnQnLCAnRGV2ZWxvcG1lbnQnKTtcclxuY2RrLlRhZ3Mub2YoZGV2U2VjcmV0c01hbmFnZXJTdGFjaykuYWRkKCdFbnZpcm9ubWVudCcsICdEZXZlbG9wbWVudCcpO1xyXG5jZGsuVGFncy5vZihkZXZXZWJTb2NrZXRTdGFjaykuYWRkKCdFbnZpcm9ubWVudCcsICdEZXZlbG9wbWVudCcpO1xyXG5jZGsuVGFncy5vZihkZXZMYW1iZGFTdGFjaykuYWRkKCdFbnZpcm9ubWVudCcsICdEZXZlbG9wbWVudCcpO1xyXG5jZGsuVGFncy5vZihkZXZDb2duaXRvU3RhY2spLmFkZCgnRW52aXJvbm1lbnQnLCAnRGV2ZWxvcG1lbnQnKTtcclxuY2RrLlRhZ3Mub2YoZGV2QXBpR2F0ZXdheVN0YWNrKS5hZGQoJ0Vudmlyb25tZW50JywgJ0RldmVsb3BtZW50Jyk7XHJcbiJdfQ==