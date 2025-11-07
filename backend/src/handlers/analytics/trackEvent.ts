/**
 * イベント追跡ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  successResponse,
  parseRequestBody,
  getCurrentTimestamp,
  internalErrorResponse,
} from '../../lib/utils/response';
import { validateRequired } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { generateULID } from '../../lib/utils/ulid';
import { TableNames, putItem } from '../../lib/dynamodb';

interface TrackEventRequest {
  event_type: string;
  target_type?: 'post' | 'account' | 'comment' | 'room' | 'product';
  target_id?: string;
  metadata?: Record<string, any>;
}

interface TrackEventResponse {
  event_id: string;
  timestamp: number;
}

/**
 * イベント追跡Lambda関数
 *
 * ユーザーアクションやシステムイベントを記録
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // アカウントIDはオプショナル（匿名イベントもサポート）
    const accountId = event.headers['x-account-id'];

    // リクエストボディをパース
    const request = parseRequestBody<TrackEventRequest>(event.body);

    // バリデーション
    validateRequired(request.event_type, 'イベントタイプ');

    // イベントIDを生成
    const eventId = generateULID();
    const now = getCurrentTimestamp();
    const date = new Date(now).toISOString().split('T')[0]; // YYYY-MM-DD

    // イベントアイテムを作成
    const analyticsItem = {
      date,
      event_id: eventId,
      event_type: request.event_type,
      account_id: accountId,
      target_type: request.target_type,
      target_id: request.target_id,
      metadata: request.metadata,
      timestamp: now,
      ttl: now + 90 * 24 * 60 * 60, // 90日後に削除
    };

    // DynamoDBに保存
    await putItem({
      TableName: TableNames.ANALYTICS,
      Item: analyticsItem,
    });

    // レスポンス
    const response: TrackEventResponse = {
      event_id: eventId,
      timestamp: now,
    };

    return successResponse(response, 201);
  } catch (error: any) {
    logError(error as Error, { handler: 'trackEvent' });

    // AppErrorの場合はそのエラー情報を使用
    if (error.code && error.statusCode) {
      return {
        statusCode: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
        },
        body: JSON.stringify({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        }),
      };
    }

    // 予期しないエラーの場合
    return internalErrorResponse('イベント追跡中にエラーが発生しました');
  }
};
