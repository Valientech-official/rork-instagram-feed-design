/**
 * DynamoDB クライアント設定
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// DynamoDBクライアント初期化
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
});

// Document Client（自動的にマーシャリング・アンマーシャリングを行う）
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    // undefined値を自動的に削除
    removeUndefinedValues: true,
    // JavaScriptのSetをDynamoDBのString Setに変換
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    // DynamoDBの数値をJavaScriptのnumberに変換（デフォルトはBigInt）
    wrapNumbers: false,
  },
});

/**
 * 環境に応じたテーブル名を取得
 * @param baseName - テーブルのベース名（UPPERCASE）
 * @returns 環境サフィックス付きのテーブル名
 */
export function getTableName(baseName: string): string {
  const environment = process.env.ENVIRONMENT || 'dev';
  const suffix = environment === 'prod' ? '' : `-${environment}`;
  return `${baseName}${suffix}`;
}

/**
 * 全テーブル名の定数
 */
export const TableNames = {
  ACCOUNT: getTableName('ACCOUNT'),
  SESSION: getTableName('SESSION'),
  POST: getTableName('POST'),
  HASHTAG_INDEX: getTableName('HASHTAG_INDEX'),
  HASHTAG_COUNT: getTableName('HASHTAG_COUNT'),
  FOLLOW: getTableName('FOLLOW'),
  LIKE: getTableName('LIKE'),
  COMMENT: getTableName('COMMENT'),
  ROOM: getTableName('ROOM'),
  ROOM_MEMBER: getTableName('ROOM_MEMBER'),
  NOTIFICATION: getTableName('NOTIFICATION'),
  NOTIFICATION_SETTINGS: getTableName('NOTIFICATION_SETTINGS'),
  MUTED_ACCOUNTS: getTableName('MUTED_ACCOUNTS'),
  REPOST: getTableName('REPOST'),
  BLOCK: getTableName('BLOCK'),
  REPORT: getTableName('REPORT'),
  LIVE_STREAM: getTableName('LIVE_STREAM'),
  LIVE_VIEWER: getTableName('LIVE_VIEWER'),
  LIVE_MODERATOR: getTableName('LIVE_MODERATOR'),
  MODERATOR_ACTION_LOG: getTableName('MODERATOR_ACTION_LOG'),
  LIVE_CHAT: getTableName('LIVE_CHAT'),
  LIVE_GIFT: getTableName('LIVE_GIFT'),
  PRODUCT: getTableName('PRODUCT'),
  PRODUCT_TAG: getTableName('PRODUCT_TAG'),
  CONVERSATION: getTableName('CONVERSATION'),
  MESSAGE: getTableName('MESSAGE'),
  ANALYTICS: getTableName('ANALYTICS'),
} as const;
