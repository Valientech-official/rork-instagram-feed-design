#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { S3Stack } from '../lib/s3-stack';
import { DynamoDBStack } from '../lib/dynamodb-stack';

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
const devS3Stack = new S3Stack(app, 'PieceApp-S3-Dev', {
  env: devEnv,
  description: 'S3 bucket for media files (Development)',
});

// DynamoDBスタック（開発環境）
const devDynamoDBStack = new DynamoDBStack(app, 'PieceApp-DynamoDB-Dev', {
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
