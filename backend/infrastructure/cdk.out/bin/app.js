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
    description: '27 DynamoDB tables with 50 GSIs (Development)',
});
// 2. S3 Stack（独立）
const devS3Stack = new s3_stack_1.S3Stack(app, 'PieceApp-S3-Dev', {
    env: devEnv,
    environment: 'dev',
    removalPolicy: cdk.RemovalPolicy.DESTROY, // 開発環境: スタック削除時にバケットも削除
    description: 'S3 bucket for media files (Development)',
});
// 3. Lambda Stack（DynamoDBに依存）
const devLambdaStack = new lambda_stack_1.LambdaStack(app, 'PieceApp-Lambda-Dev', {
    env: devEnv,
    environment: 'dev',
    description: '16 Lambda functions for API handlers (Development)',
});
devLambdaStack.addDependency(devDynamoDBStack);
// 4. Cognito Stack（独立）
const devCognitoStack = new cognito_stack_1.CognitoStack(app, 'PieceApp-Cognito-Dev', {
    env: devEnv,
    environment: 'dev',
    description: 'Cognito User Pool for authentication (Development)',
});
// 5. API Gateway Stack（Lambda + Cognitoに依存）
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vYmluL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSx1Q0FBcUM7QUFDckMsaURBQW1DO0FBQ25DLDhDQUEwQztBQUMxQywwREFBc0Q7QUFDdEQsc0RBQWtEO0FBQ2xELHdEQUFvRDtBQUNwRCxnRUFBMkQ7QUFFM0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFFMUIsVUFBVTtBQUNWLE1BQU0sTUFBTSxHQUFHLGdCQUFnQixDQUFDLENBQUMsS0FBSztBQUV0Qyx3REFBd0Q7QUFDeEQsWUFBWTtBQUNaLHdEQUF3RDtBQUN4RCxNQUFNLE1BQU0sR0FBRztJQUNiLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQjtJQUN4QyxNQUFNLEVBQUUsTUFBTTtDQUNmLENBQUM7QUFFRiw2QkFBNkI7QUFDN0IsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLDhCQUFhLENBQUMsR0FBRyxFQUFFLHVCQUF1QixFQUFFO0lBQ3ZFLEdBQUcsRUFBRSxNQUFNO0lBQ1gsV0FBVyxFQUFFLEtBQUs7SUFDbEIsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLHdCQUF3QjtJQUNsRSxXQUFXLEVBQUUsK0NBQStDO0NBQzdELENBQUMsQ0FBQztBQUVILGtCQUFrQjtBQUNsQixNQUFNLFVBQVUsR0FBRyxJQUFJLGtCQUFPLENBQUMsR0FBRyxFQUFFLGlCQUFpQixFQUFFO0lBQ3JELEdBQUcsRUFBRSxNQUFNO0lBQ1gsV0FBVyxFQUFFLEtBQUs7SUFDbEIsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLHdCQUF3QjtJQUNsRSxXQUFXLEVBQUUseUNBQXlDO0NBQ3ZELENBQUMsQ0FBQztBQUVILCtCQUErQjtBQUMvQixNQUFNLGNBQWMsR0FB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QUksQ0FBQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxyXG5pbXBvcnQgJ3NvdXJjZS1tYXAtc3VwcG9ydC9yZWdpc3Rlcic7XHJcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XHJcbmltcG9ydCB7IFMzU3RhY2sgfSBmcm9tICcuLi9saWIvczMtc3RhY2snO1xyXG5pbXBvcnQgeyBEeW5hbW9EQlN0YWNrIH0gZnJvbSAnLi4vbGliL2R5bmFtb2RiLXN0YWNrJztcclxuaW1wb3J0IHsgTGFtYmRhU3RhY2sgfSBmcm9tICcuLi9saWIvbGFtYmRhLXN0YWNrJztcclxuaW1wb3J0IHsgQ29nbml0b1N0YWNrIH0gZnJvbSAnLi4vbGliL2NvZ25pdG8tc3RhY2snO1xyXG5pbXBvcnQgeyBBcGlHYXRld2F5U3RhY2sgfSBmcm9tICcuLi9saWIvYXBpLWdhdGV3YXktc3RhY2snO1xyXG5cclxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcclxuXHJcbi8vIOODquODvOOCuOODp+ODs+ioreWumlxyXG5jb25zdCByZWdpb24gPSAnYXAtbm9ydGhlYXN0LTEnOyAvLyDmnbHkuqxcclxuXHJcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbi8vIOmWi+eZuueSsOWig++8iGRldu+8iVxyXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5jb25zdCBkZXZFbnYgPSB7XHJcbiAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcclxuICByZWdpb246IHJlZ2lvbixcclxufTtcclxuXHJcbi8vIDEuIER5bmFtb0RCIFN0YWNr77yI5pyA5Yid44Gr44OH44OX44Ot44Kk77yJXHJcbmNvbnN0IGRldkR5bmFtb0RCU3RhY2sgPSBuZXcgRHluYW1vREJTdGFjayhhcHAsICdQaWVjZUFwcC1EeW5hbW9EQi1EZXYnLCB7XHJcbiAgZW52OiBkZXZFbnYsXHJcbiAgZW52aXJvbm1lbnQ6ICdkZXYnLFxyXG4gIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksIC8vIOmWi+eZuueSsOWigzog44K544K/44OD44Kv5YmK6Zmk5pmC44Gr44OG44O844OW44Or44KC5YmK6ZmkXHJcbiAgZGVzY3JpcHRpb246ICcyNyBEeW5hbW9EQiB0YWJsZXMgd2l0aCA1MCBHU0lzIChEZXZlbG9wbWVudCknLFxyXG59KTtcclxuXHJcbi8vIDIuIFMzIFN0YWNr77yI54us56uL77yJXHJcbmNvbnN0IGRldlMzU3RhY2sgPSBuZXcgUzNTdGFjayhhcHAsICdQaWVjZUFwcC1TMy1EZXYnLCB7XHJcbiAgZW52OiBkZXZFbnYsXHJcbiAgZW52aXJvbm1lbnQ6ICdkZXYnLFxyXG4gIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksIC8vIOmWi+eZuueSsOWigzog44K544K/44OD44Kv5YmK6Zmk5pmC44Gr44OQ44Kx44OD44OI44KC5YmK6ZmkXHJcbiAgZGVzY3JpcHRpb246ICdTMyBidWNrZXQgZm9yIG1lZGlhIGZpbGVzIChEZXZlbG9wbWVudCknLFxyXG59KTtcclxuXHJcbi8vIDMuIExhbWJkYSBTdGFja++8iER5bmFtb0RC44Gr5L6d5a2Y77yJXHJcbmNvbnN0IGRldkxhbWJkYVN0YWNrID0gbmV3IExhbWJkYVN0YWNrKGFwcCwgJ1BpZWNlQXBwLUxhbWJkYS1EZXYnLCB7XHJcbiAgZW52OiBkZXZFbnYsXHJcbiAgZW52aXJvbm1lbnQ6ICdkZXYnLFxyXG4gIGRlc2NyaXB0aW9uOiAnMTYgTGFtYmRhIGZ1bmN0aW9ucyBmb3IgQVBJIGhhbmRsZXJzIChEZXZlbG9wbWVudCknLFxyXG59KTtcclxuZGV2TGFtYmRhU3RhY2suYWRkRGVwZW5kZW5jeShkZXZEeW5hbW9EQlN0YWNrKTtcclxuXHJcbi8vIDQuIENvZ25pdG8gU3RhY2vvvIjni6znq4vvvIlcclxuY29uc3QgZGV2Q29nbml0b1N0YWNrID0gbmV3IENvZ25pdG9TdGFjayhhcHAsICdQaWVjZUFwcC1Db2duaXRvLURldicsIHtcclxuICBlbnY6IGRldkVudixcclxuICBlbnZpcm9ubWVudDogJ2RldicsXHJcbiAgZGVzY3JpcHRpb246ICdDb2duaXRvIFVzZXIgUG9vbCBmb3IgYXV0aGVudGljYXRpb24gKERldmVsb3BtZW50KScsXHJcbn0pO1xyXG5cclxuLy8gNS4gQVBJIEdhdGV3YXkgU3RhY2vvvIhMYW1iZGEgKyBDb2duaXRv44Gr5L6d5a2Y77yJXHJcbmNvbnN0IGRldkFwaUdhdGV3YXlTdGFjayA9IG5ldyBBcGlHYXRld2F5U3RhY2soYXBwLCAnUGllY2VBcHAtQXBpR2F0ZXdheS1EZXYnLCB7XHJcbiAgZW52OiBkZXZFbnYsXHJcbiAgZW52aXJvbm1lbnQ6ICdkZXYnLFxyXG4gIGxhbWJkYUZ1bmN0aW9uczoge1xyXG4gICAgY3JlYXRlQWNjb3VudDogZGV2TGFtYmRhU3RhY2suY3JlYXRlQWNjb3VudCxcclxuICAgIGdldFByb2ZpbGU6IGRldkxhbWJkYVN0YWNrLmdldFByb2ZpbGUsXHJcbiAgICB1cGRhdGVQcm9maWxlOiBkZXZMYW1iZGFTdGFjay51cGRhdGVQcm9maWxlLFxyXG4gICAgY3JlYXRlUG9zdDogZGV2TGFtYmRhU3RhY2suY3JlYXRlUG9zdCxcclxuICAgIGdldFBvc3Q6IGRldkxhbWJkYVN0YWNrLmdldFBvc3QsXHJcbiAgICBkZWxldGVQb3N0OiBkZXZMYW1iZGFTdGFjay5kZWxldGVQb3N0LFxyXG4gICAgZ2V0VGltZWxpbmU6IGRldkxhbWJkYVN0YWNrLmdldFRpbWVsaW5lLFxyXG4gICAgbGlrZVBvc3Q6IGRldkxhbWJkYVN0YWNrLmxpa2VQb3N0LFxyXG4gICAgdW5saWtlUG9zdDogZGV2TGFtYmRhU3RhY2sudW5saWtlUG9zdCxcclxuICAgIGNyZWF0ZUNvbW1lbnQ6IGRldkxhbWJkYVN0YWNrLmNyZWF0ZUNvbW1lbnQsXHJcbiAgICBkZWxldGVDb21tZW50OiBkZXZMYW1iZGFTdGFjay5kZWxldGVDb21tZW50LFxyXG4gICAgZ2V0Q29tbWVudHM6IGRldkxhbWJkYVN0YWNrLmdldENvbW1lbnRzLFxyXG4gICAgZm9sbG93VXNlcjogZGV2TGFtYmRhU3RhY2suZm9sbG93VXNlcixcclxuICAgIHVuZm9sbG93VXNlcjogZGV2TGFtYmRhU3RhY2sudW5mb2xsb3dVc2VyLFxyXG4gICAgY3JlYXRlUm9vbTogZGV2TGFtYmRhU3RhY2suY3JlYXRlUm9vbSxcclxuICAgIGpvaW5Sb29tOiBkZXZMYW1iZGFTdGFjay5qb2luUm9vbSxcclxuICB9LFxyXG4gIHVzZXJQb29sOiBkZXZDb2duaXRvU3RhY2sudXNlclBvb2wsXHJcbiAgZGVzY3JpcHRpb246ICdSRVNUIEFQSSBHYXRld2F5IHdpdGggQ29nbml0byBhdXRob3JpemVyIChEZXZlbG9wbWVudCknLFxyXG59KTtcclxuZGV2QXBpR2F0ZXdheVN0YWNrLmFkZERlcGVuZGVuY3koZGV2TGFtYmRhU3RhY2spO1xyXG5kZXZBcGlHYXRld2F5U3RhY2suYWRkRGVwZW5kZW5jeShkZXZDb2duaXRvU3RhY2spO1xyXG5cclxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuLy8g5pys55Wq55Kw5aKD77yIcHJvZO+8iS0g5b6M44Gn5pyJ5Yq55YyWXHJcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbi8qXHJcbmNvbnN0IHByb2RFbnYgPSB7XHJcbiAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcclxuICByZWdpb246IHJlZ2lvbixcclxufTtcclxuXHJcbi8vIDEuIER5bmFtb0RCIFN0YWNrXHJcbmNvbnN0IHByb2REeW5hbW9EQlN0YWNrID0gbmV3IER5bmFtb0RCU3RhY2soYXBwLCAnUGllY2VBcHAtRHluYW1vREItUHJvZCcsIHtcclxuICBlbnY6IHByb2RFbnYsXHJcbiAgZW52aXJvbm1lbnQ6ICdwcm9kJyxcclxuICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sIC8vIOacrOeVqueSsOWigzog44K544K/44OD44Kv5YmK6Zmk44GX44Gm44KC44OG44O844OW44Or44Gv5L+d5oyBXHJcbiAgZGVzY3JpcHRpb246ICcyNyBEeW5hbW9EQiB0YWJsZXMgd2l0aCA1MCBHU0lzIChQcm9kdWN0aW9uKScsXHJcbn0pO1xyXG5cclxuLy8gMi4gUzMgU3RhY2tcclxuY29uc3QgcHJvZFMzU3RhY2sgPSBuZXcgUzNTdGFjayhhcHAsICdQaWVjZUFwcC1TMy1Qcm9kJywge1xyXG4gIGVudjogcHJvZEVudixcclxuICBlbnZpcm9ubWVudDogJ3Byb2QnLFxyXG4gIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTiwgLy8g5pys55Wq55Kw5aKDOiDjgrnjgr/jg4Pjgq/liYrpmaTjgZfjgabjgoLjg5DjgrHjg4Pjg4jjga/kv53mjIFcclxuICBkZXNjcmlwdGlvbjogJ1MzIGJ1Y2tldCBmb3IgbWVkaWEgZmlsZXMgKFByb2R1Y3Rpb24pJyxcclxufSk7XHJcblxyXG4vLyAzLiBMYW1iZGEgU3RhY2tcclxuY29uc3QgcHJvZExhbWJkYVN0YWNrID0gbmV3IExhbWJkYVN0YWNrKGFwcCwgJ1BpZWNlQXBwLUxhbWJkYS1Qcm9kJywge1xyXG4gIGVudjogcHJvZEVudixcclxuICBlbnZpcm9ubWVudDogJ3Byb2QnLFxyXG4gIGRlc2NyaXB0aW9uOiAnMTYgTGFtYmRhIGZ1bmN0aW9ucyBmb3IgQVBJIGhhbmRsZXJzIChQcm9kdWN0aW9uKScsXHJcbn0pO1xyXG5wcm9kTGFtYmRhU3RhY2suYWRkRGVwZW5kZW5jeShwcm9kRHluYW1vREJTdGFjayk7XHJcblxyXG4vLyA0LiBDb2duaXRvIFN0YWNrXHJcbi8vIOKaoO+4jyDmnKznlarnkrDlooPjgafjga/ku6XkuIvjga7oqK3lrprlpInmm7TjgYzlv4XopoE6XHJcbi8vIC0gQWR2YW5jZWQgU2VjdXJpdHkgTW9kZTogRU5GT1JDRUQg44Gr5aSJ5pu0XHJcbi8vIC0gRW1haWw6IFNFUyDjgavliIfjgormm7/jgYjvvIjopoE6IOODieODoeOCpOODs+ioreWumuOAgVNFU+iqjeiovO+8iVxyXG5jb25zdCBwcm9kQ29nbml0b1N0YWNrID0gbmV3IENvZ25pdG9TdGFjayhhcHAsICdQaWVjZUFwcC1Db2duaXRvLVByb2QnLCB7XHJcbiAgZW52OiBwcm9kRW52LFxyXG4gIGVudmlyb25tZW50OiAncHJvZCcsXHJcbiAgZGVzY3JpcHRpb246ICdDb2duaXRvIFVzZXIgUG9vbCBmb3IgYXV0aGVudGljYXRpb24gKFByb2R1Y3Rpb24pJyxcclxufSk7XHJcblxyXG4vLyA1LiBBUEkgR2F0ZXdheSBTdGFja1xyXG5jb25zdCBwcm9kQXBpR2F0ZXdheVN0YWNrID0gbmV3IEFwaUdhdGV3YXlTdGFjayhhcHAsICdQaWVjZUFwcC1BcGlHYXRld2F5LVByb2QnLCB7XHJcbiAgZW52OiBwcm9kRW52LFxyXG4gIGVudmlyb25tZW50OiAncHJvZCcsXHJcbiAgbGFtYmRhRnVuY3Rpb25zOiB7XHJcbiAgICBjcmVhdGVBY2NvdW50OiBwcm9kTGFtYmRhU3RhY2suY3JlYXRlQWNjb3VudCxcclxuICAgIGdldFByb2ZpbGU6IHByb2RMYW1iZGFTdGFjay5nZXRQcm9maWxlLFxyXG4gICAgdXBkYXRlUHJvZmlsZTogcHJvZExhbWJkYVN0YWNrLnVwZGF0ZVByb2ZpbGUsXHJcbiAgICBjcmVhdGVQb3N0OiBwcm9kTGFtYmRhU3RhY2suY3JlYXRlUG9zdCxcclxuICAgIGdldFBvc3Q6IHByb2RMYW1iZGFTdGFjay5nZXRQb3N0LFxyXG4gICAgZGVsZXRlUG9zdDogcHJvZExhbWJkYVN0YWNrLmRlbGV0ZVBvc3QsXHJcbiAgICBnZXRUaW1lbGluZTogcHJvZExhbWJkYVN0YWNrLmdldFRpbWVsaW5lLFxyXG4gICAgbGlrZVBvc3Q6IHByb2RMYW1iZGFTdGFjay5saWtlUG9zdCxcclxuICAgIHVubGlrZVBvc3Q6IHByb2RMYW1iZGFTdGFjay51bmxpa2VQb3N0LFxyXG4gICAgY3JlYXRlQ29tbWVudDogcHJvZExhbWJkYVN0YWNrLmNyZWF0ZUNvbW1lbnQsXHJcbiAgICBkZWxldGVDb21tZW50OiBwcm9kTGFtYmRhU3RhY2suZGVsZXRlQ29tbWVudCxcclxuICAgIGdldENvbW1lbnRzOiBwcm9kTGFtYmRhU3RhY2suZ2V0Q29tbWVudHMsXHJcbiAgICBmb2xsb3dVc2VyOiBwcm9kTGFtYmRhU3RhY2suZm9sbG93VXNlcixcclxuICAgIHVuZm9sbG93VXNlcjogcHJvZExhbWJkYVN0YWNrLnVuZm9sbG93VXNlcixcclxuICAgIGNyZWF0ZVJvb206IHByb2RMYW1iZGFTdGFjay5jcmVhdGVSb29tLFxyXG4gICAgam9pblJvb206IHByb2RMYW1iZGFTdGFjay5qb2luUm9vbSxcclxuICB9LFxyXG4gIHVzZXJQb29sOiBwcm9kQ29nbml0b1N0YWNrLnVzZXJQb29sLFxyXG4gIGRlc2NyaXB0aW9uOiAnUkVTVCBBUEkgR2F0ZXdheSB3aXRoIENvZ25pdG8gYXV0aG9yaXplciAoUHJvZHVjdGlvbiknLFxyXG59KTtcclxucHJvZEFwaUdhdGV3YXlTdGFjay5hZGREZXBlbmRlbmN5KHByb2RMYW1iZGFTdGFjayk7XHJcbnByb2RBcGlHYXRld2F5U3RhY2suYWRkRGVwZW5kZW5jeShwcm9kQ29nbml0b1N0YWNrKTtcclxuKi9cclxuXHJcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbi8vIOOCv+OCsOioreWumu+8iOWFqOOCueOCv+ODg+OCr+WFsemAmu+8iVxyXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5jZGsuVGFncy5vZihhcHApLmFkZCgnUHJvamVjdCcsICdQaWVjZUFwcCcpO1xyXG5jZGsuVGFncy5vZihhcHApLmFkZCgnTWFuYWdlZEJ5JywgJ0NESycpO1xyXG5cclxuLy8g6ZaL55m655Kw5aKD44K/44KwXHJcbmNkay5UYWdzLm9mKGRldkR5bmFtb0RCU3RhY2spLmFkZCgnRW52aXJvbm1lbnQnLCAnRGV2ZWxvcG1lbnQnKTtcclxuY2RrLlRhZ3Mub2YoZGV2UzNTdGFjaykuYWRkKCdFbnZpcm9ubWVudCcsICdEZXZlbG9wbWVudCcpO1xyXG5jZGsuVGFncy5vZihkZXZMYW1iZGFTdGFjaykuYWRkKCdFbnZpcm9ubWVudCcsICdEZXZlbG9wbWVudCcpO1xyXG5jZGsuVGFncy5vZihkZXZDb2duaXRvU3RhY2spLmFkZCgnRW52aXJvbm1lbnQnLCAnRGV2ZWxvcG1lbnQnKTtcclxuY2RrLlRhZ3Mub2YoZGV2QXBpR2F0ZXdheVN0YWNrKS5hZGQoJ0Vudmlyb25tZW50JywgJ0RldmVsb3BtZW50Jyk7XHJcbiJdfQ==