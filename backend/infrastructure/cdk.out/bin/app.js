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
    environment: 'dev',
    removalPolicy: cdk.RemovalPolicy.DESTROY, // 開発環境: スタック削除時にバケットも削除
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
  environment: 'prod',
  removalPolicy: cdk.RemovalPolicy.RETAIN, // 本番環境: スタック削除してもバケットは保持
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vYmluL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSx1Q0FBcUM7QUFDckMsaURBQW1DO0FBQ25DLDhDQUEwQztBQUMxQywwREFBc0Q7QUFFdEQsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFFMUIsVUFBVTtBQUNWLE1BQU0sTUFBTSxHQUFHLGdCQUFnQixDQUFDLENBQUMsS0FBSztBQUV0Qyx3REFBd0Q7QUFDeEQsWUFBWTtBQUNaLHdEQUF3RDtBQUN4RCxNQUFNLE1BQU0sR0FBRztJQUNiLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQjtJQUN4QyxNQUFNLEVBQUUsTUFBTTtDQUNmLENBQUM7QUFFRixlQUFlO0FBQ2YsTUFBTSxVQUFVLEdBQUcsSUFBSSxrQkFBTyxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsRUFBRTtJQUNyRCxHQUFHLEVBQUUsTUFBTTtJQUNYLFdBQVcsRUFBRSxLQUFLO0lBQ2xCLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSx3QkFBd0I7SUFDbEUsV0FBVyxFQUFFLHlDQUF5QztDQUN2RCxDQUFDLENBQUM7QUFFSCxxQkFBcUI7QUFDckIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLDhCQUFhLENBQUMsR0FBRyxFQUFFLHVCQUF1QixFQUFFO0lBQ3ZFLEdBQUcsRUFBRSxNQUFNO0lBQ1gsV0FBVyxFQUFFLEtBQUs7SUFDbEIsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLHdCQUF3QjtJQUNsRSxXQUFXLEVBQUUsK0NBQStDO0NBQzdELENBQUMsQ0FBQztBQUVILHdEQUF3RDtBQUN4RCxvQkFBb0I7QUFDcEIsd0RBQXdEO0FBQ3hEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFxQkU7QUFFRixnQkFBZ0I7QUFDaEIsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztBQUM1QyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBRXpDLFdBQVc7QUFDWCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQzFELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcclxuaW1wb3J0ICdzb3VyY2UtbWFwLXN1cHBvcnQvcmVnaXN0ZXInO1xyXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xyXG5pbXBvcnQgeyBTM1N0YWNrIH0gZnJvbSAnLi4vbGliL3MzLXN0YWNrJztcclxuaW1wb3J0IHsgRHluYW1vREJTdGFjayB9IGZyb20gJy4uL2xpYi9keW5hbW9kYi1zdGFjayc7XHJcblxyXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xyXG5cclxuLy8g44Oq44O844K444On44Oz6Kit5a6aXHJcbmNvbnN0IHJlZ2lvbiA9ICdhcC1ub3J0aGVhc3QtMSc7IC8vIOadseS6rFxyXG5cclxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuLy8g6ZaL55m655Kw5aKD77yIZGV277yJXHJcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbmNvbnN0IGRldkVudiA9IHtcclxuICBhY2NvdW50OiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5ULFxyXG4gIHJlZ2lvbjogcmVnaW9uLFxyXG59O1xyXG5cclxuLy8gUzPjgrnjgr/jg4Pjgq/vvIjplovnmbrnkrDlooPvvIlcclxuY29uc3QgZGV2UzNTdGFjayA9IG5ldyBTM1N0YWNrKGFwcCwgJ1BpZWNlQXBwLVMzLURldicsIHtcclxuICBlbnY6IGRldkVudixcclxuICBlbnZpcm9ubWVudDogJ2RldicsXHJcbiAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8g6ZaL55m655Kw5aKDOiDjgrnjgr/jg4Pjgq/liYrpmaTmmYLjgavjg5DjgrHjg4Pjg4jjgoLliYrpmaRcclxuICBkZXNjcmlwdGlvbjogJ1MzIGJ1Y2tldCBmb3IgbWVkaWEgZmlsZXMgKERldmVsb3BtZW50KScsXHJcbn0pO1xyXG5cclxuLy8gRHluYW1vRELjgrnjgr/jg4Pjgq/vvIjplovnmbrnkrDlooPvvIlcclxuY29uc3QgZGV2RHluYW1vREJTdGFjayA9IG5ldyBEeW5hbW9EQlN0YWNrKGFwcCwgJ1BpZWNlQXBwLUR5bmFtb0RCLURldicsIHtcclxuICBlbnY6IGRldkVudixcclxuICBlbnZpcm9ubWVudDogJ2RldicsXHJcbiAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8g6ZaL55m655Kw5aKDOiDjgrnjgr/jg4Pjgq/liYrpmaTmmYLjgavjg4bjg7zjg5bjg6vjgoLliYrpmaRcclxuICBkZXNjcmlwdGlvbjogJzI3IER5bmFtb0RCIHRhYmxlcyB3aXRoIDUwIEdTSXMgKERldmVsb3BtZW50KScsXHJcbn0pO1xyXG5cclxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuLy8g5pys55Wq55Kw5aKD77yIcHJvZO+8iS0g5b6M44Gn5pyJ5Yq55YyWXHJcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbi8qXHJcbmNvbnN0IHByb2RFbnYgPSB7XHJcbiAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcclxuICByZWdpb246IHJlZ2lvbixcclxufTtcclxuXHJcbi8vIFMz44K544K/44OD44Kv77yI5pys55Wq55Kw5aKD77yJXHJcbmNvbnN0IHByb2RTM1N0YWNrID0gbmV3IFMzU3RhY2soYXBwLCAnUGllY2VBcHAtUzMtUHJvZCcsIHtcclxuICBlbnY6IHByb2RFbnYsXHJcbiAgZW52aXJvbm1lbnQ6ICdwcm9kJyxcclxuICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sIC8vIOacrOeVqueSsOWigzog44K544K/44OD44Kv5YmK6Zmk44GX44Gm44KC44OQ44Kx44OD44OI44Gv5L+d5oyBXHJcbiAgZGVzY3JpcHRpb246ICdTMyBidWNrZXQgZm9yIG1lZGlhIGZpbGVzIChQcm9kdWN0aW9uKScsXHJcbn0pO1xyXG5cclxuLy8gRHluYW1vRELjgrnjgr/jg4Pjgq/vvIjmnKznlarnkrDlooPvvIlcclxuY29uc3QgcHJvZER5bmFtb0RCU3RhY2sgPSBuZXcgRHluYW1vREJTdGFjayhhcHAsICdQaWVjZUFwcC1EeW5hbW9EQi1Qcm9kJywge1xyXG4gIGVudjogcHJvZEVudixcclxuICBlbnZpcm9ubWVudDogJ3Byb2QnLFxyXG4gIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTiwgLy8g5pys55Wq55Kw5aKDOiDjgrnjgr/jg4Pjgq/liYrpmaTjgZfjgabjgoLjg4bjg7zjg5bjg6vjga/kv53mjIFcclxuICBkZXNjcmlwdGlvbjogJzI3IER5bmFtb0RCIHRhYmxlcyB3aXRoIDUwIEdTSXMgKFByb2R1Y3Rpb24pJyxcclxufSk7XHJcbiovXHJcblxyXG4vLyDjgr/jgrDov73liqDvvIjlhajjgrnjgr/jg4Pjgq/lhbHpgJrvvIlcclxuY2RrLlRhZ3Mub2YoYXBwKS5hZGQoJ1Byb2plY3QnLCAnUGllY2VBcHAnKTtcclxuY2RrLlRhZ3Mub2YoYXBwKS5hZGQoJ01hbmFnZWRCeScsICdDREsnKTtcclxuXHJcbi8vIOmWi+eZuueSsOWig+WwgueUqOOCv+OCsFxyXG5jZGsuVGFncy5vZihkZXZTM1N0YWNrKS5hZGQoJ0Vudmlyb25tZW50JywgJ0RldmVsb3BtZW50Jyk7XHJcbmNkay5UYWdzLm9mKGRldkR5bmFtb0RCU3RhY2spLmFkZCgnRW52aXJvbm1lbnQnLCAnRGV2ZWxvcG1lbnQnKTtcclxuIl19