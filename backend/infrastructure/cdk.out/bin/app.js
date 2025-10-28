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
// S3スタック（開発環境）
const devS3Stack = new s3_stack_1.S3Stack(app, 'PieceApp-S3-Dev', {
    env: devEnv,
    description: 'S3 bucket for media files (Development)',
});
// DynamoDBスタック（開発環境）
const devDynamoDBStack = new dynamodb_stack_1.DynamoDBStack(app, 'PieceApp-DynamoDB-Dev', {
    env: devEnv,
    environment: 'dev',
    removalPolicy: cdk.RemovalPolicy.DESTROY, // 開発環境: スタック削除時にテーブルも削除
    description: '27 DynamoDB tables with 50 GSIs (Development)',
});
// =====================================================
// 本番環境（prod）- 後で有効化
// =====================================================
/*
const prodEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: region,
};

// S3スタック（本番環境）
const prodS3Stack = new S3Stack(app, 'PieceApp-S3-Prod', {
  env: prodEnv,
  description: 'S3 bucket for media files (Production)',
});

// DynamoDBスタック（本番環境）
const prodDynamoDBStack = new DynamoDBStack(app, 'PieceApp-DynamoDB-Prod', {
  env: prodEnv,
  environment: 'prod',
  removalPolicy: cdk.RemovalPolicy.RETAIN, // 本番環境: スタック削除してもテーブルは保持
  description: '27 DynamoDB tables with 50 GSIs (Production)',
});
*/
// タグ追加（全スタック共通）
cdk.Tags.of(app).add('Project', 'PieceApp');
cdk.Tags.of(app).add('ManagedBy', 'CDK');
// 開発環境専用タグ
cdk.Tags.of(devS3Stack).add('Environment', 'Development');
cdk.Tags.of(devDynamoDBStack).add('Environment', 'Development');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vYmluL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSx1Q0FBcUM7QUFDckMsaURBQW1DO0FBQ25DLDhDQUEwQztBQUMxQywwREFBc0Q7QUFFdEQsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFFMUIsVUFBVTtBQUNWLE1BQU0sTUFBTSxHQUFHLGdCQUFnQixDQUFDLENBQUMsS0FBSztBQUV0Qyx3REFBd0Q7QUFDeEQsWUFBWTtBQUNaLHdEQUF3RDtBQUN4RCxNQUFNLE1BQU0sR0FBRztJQUNiLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQjtJQUN4QyxNQUFNLEVBQUUsTUFBTTtDQUNmLENBQUM7QUFFRixlQUFlO0FBQ2YsTUFBTSxVQUFVLEdBQUcsSUFBSSxrQkFBTyxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsRUFBRTtJQUNyRCxHQUFHLEVBQUUsTUFBTTtJQUNYLFdBQVcsRUFBRSx5Q0FBeUM7Q0FDdkQsQ0FBQyxDQUFDO0FBRUgscUJBQXFCO0FBQ3JCLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSw4QkFBYSxDQUFDLEdBQUcsRUFBRSx1QkFBdUIsRUFBRTtJQUN2RSxHQUFHLEVBQUUsTUFBTTtJQUNYLFdBQVcsRUFBRSxLQUFLO0lBQ2xCLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSx3QkFBd0I7SUFDbEUsV0FBVyxFQUFFLCtDQUErQztDQUM3RCxDQUFDLENBQUM7QUFFSCx3REFBd0Q7QUFDeEQsb0JBQW9CO0FBQ3BCLHdEQUF3RDtBQUN4RDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQW1CRTtBQUVGLGdCQUFnQjtBQUNoQixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQzVDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFFekMsV0FBVztBQUNYLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDMUQsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxyXG5pbXBvcnQgJ3NvdXJjZS1tYXAtc3VwcG9ydC9yZWdpc3Rlcic7XHJcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XHJcbmltcG9ydCB7IFMzU3RhY2sgfSBmcm9tICcuLi9saWIvczMtc3RhY2snO1xyXG5pbXBvcnQgeyBEeW5hbW9EQlN0YWNrIH0gZnJvbSAnLi4vbGliL2R5bmFtb2RiLXN0YWNrJztcclxuXHJcbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XHJcblxyXG4vLyDjg6rjg7zjgrjjg6fjg7PoqK3lrppcclxuY29uc3QgcmVnaW9uID0gJ2FwLW5vcnRoZWFzdC0xJzsgLy8g5p2x5LqsXHJcblxyXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4vLyDplovnmbrnkrDlooPvvIhkZXbvvIlcclxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuY29uc3QgZGV2RW52ID0ge1xyXG4gIGFjY291bnQ6IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX0FDQ09VTlQsXHJcbiAgcmVnaW9uOiByZWdpb24sXHJcbn07XHJcblxyXG4vLyBTM+OCueOCv+ODg+OCr++8iOmWi+eZuueSsOWig++8iVxyXG5jb25zdCBkZXZTM1N0YWNrID0gbmV3IFMzU3RhY2soYXBwLCAnUGllY2VBcHAtUzMtRGV2Jywge1xyXG4gIGVudjogZGV2RW52LFxyXG4gIGRlc2NyaXB0aW9uOiAnUzMgYnVja2V0IGZvciBtZWRpYSBmaWxlcyAoRGV2ZWxvcG1lbnQpJyxcclxufSk7XHJcblxyXG4vLyBEeW5hbW9EQuOCueOCv+ODg+OCr++8iOmWi+eZuueSsOWig++8iVxyXG5jb25zdCBkZXZEeW5hbW9EQlN0YWNrID0gbmV3IER5bmFtb0RCU3RhY2soYXBwLCAnUGllY2VBcHAtRHluYW1vREItRGV2Jywge1xyXG4gIGVudjogZGV2RW52LFxyXG4gIGVudmlyb25tZW50OiAnZGV2JyxcclxuICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLCAvLyDplovnmbrnkrDlooM6IOOCueOCv+ODg+OCr+WJiumZpOaZguOBq+ODhuODvOODluODq+OCguWJiumZpFxyXG4gIGRlc2NyaXB0aW9uOiAnMjcgRHluYW1vREIgdGFibGVzIHdpdGggNTAgR1NJcyAoRGV2ZWxvcG1lbnQpJyxcclxufSk7XHJcblxyXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4vLyDmnKznlarnkrDlooPvvIhwcm9k77yJLSDlvozjgafmnInlirnljJZcclxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuLypcclxuY29uc3QgcHJvZEVudiA9IHtcclxuICBhY2NvdW50OiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5ULFxyXG4gIHJlZ2lvbjogcmVnaW9uLFxyXG59O1xyXG5cclxuLy8gUzPjgrnjgr/jg4Pjgq/vvIjmnKznlarnkrDlooPvvIlcclxuY29uc3QgcHJvZFMzU3RhY2sgPSBuZXcgUzNTdGFjayhhcHAsICdQaWVjZUFwcC1TMy1Qcm9kJywge1xyXG4gIGVudjogcHJvZEVudixcclxuICBkZXNjcmlwdGlvbjogJ1MzIGJ1Y2tldCBmb3IgbWVkaWEgZmlsZXMgKFByb2R1Y3Rpb24pJyxcclxufSk7XHJcblxyXG4vLyBEeW5hbW9EQuOCueOCv+ODg+OCr++8iOacrOeVqueSsOWig++8iVxyXG5jb25zdCBwcm9kRHluYW1vREJTdGFjayA9IG5ldyBEeW5hbW9EQlN0YWNrKGFwcCwgJ1BpZWNlQXBwLUR5bmFtb0RCLVByb2QnLCB7XHJcbiAgZW52OiBwcm9kRW52LFxyXG4gIGVudmlyb25tZW50OiAncHJvZCcsXHJcbiAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLCAvLyDmnKznlarnkrDlooM6IOOCueOCv+ODg+OCr+WJiumZpOOBl+OBpuOCguODhuODvOODluODq+OBr+S/neaMgVxyXG4gIGRlc2NyaXB0aW9uOiAnMjcgRHluYW1vREIgdGFibGVzIHdpdGggNTAgR1NJcyAoUHJvZHVjdGlvbiknLFxyXG59KTtcclxuKi9cclxuXHJcbi8vIOOCv+OCsOi/veWKoO+8iOWFqOOCueOCv+ODg+OCr+WFsemAmu+8iVxyXG5jZGsuVGFncy5vZihhcHApLmFkZCgnUHJvamVjdCcsICdQaWVjZUFwcCcpO1xyXG5jZGsuVGFncy5vZihhcHApLmFkZCgnTWFuYWdlZEJ5JywgJ0NESycpO1xyXG5cclxuLy8g6ZaL55m655Kw5aKD5bCC55So44K/44KwXHJcbmNkay5UYWdzLm9mKGRldlMzU3RhY2spLmFkZCgnRW52aXJvbm1lbnQnLCAnRGV2ZWxvcG1lbnQnKTtcclxuY2RrLlRhZ3Mub2YoZGV2RHluYW1vREJTdGFjaykuYWRkKCdFbnZpcm9ubWVudCcsICdEZXZlbG9wbWVudCcpO1xyXG4iXX0=