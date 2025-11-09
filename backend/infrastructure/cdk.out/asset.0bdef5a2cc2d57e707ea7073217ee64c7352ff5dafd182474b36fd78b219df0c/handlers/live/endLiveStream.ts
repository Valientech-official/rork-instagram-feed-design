/**
 * ライブ配信終了ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { LiveStreamItem } from '../../types/dynamodb';
import {
  successResponse,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, query, updateItem } from '../../lib/dynamodb';

interface EndLiveStreamResponse {
  stream_id: string;
  ended_at: number;
  total_duration: number;
}

/**
 * ライブ配信終了Lambda関数
 *
 * 配信者のみが終了可能
 * Muxのdisable APIを呼び出して配信を停止
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // TODO: JWTトークンから account_id を取得
    // const accountId = event.requestContext.authorizer?.claims?.sub;

    // 現在はヘッダーから取得（開発用）
    const accountId = event.headers['x-account-id'];

    if (!accountId) {
      return unauthorizedResponse('アカウントIDが取得できません');
    }

    // パスパラメータから配信IDを取得
    const streamId = event.pathParameters?.stream_id;

    if (!streamId) {
      return notFoundResponse('配信ID');
    }

    // ライブ配信を取得
    const streamResult = await query({
      TableName: TableNames.LIVE_STREAM,
      KeyConditionExpression: 'stream_id = :streamId',
      ExpressionAttributeValues: {
        ':streamId': streamId,
      },
      Limit: 1,
    });

    if (!streamResult.items || streamResult.items.length === 0) {
      return notFoundResponse('ライブ配信');
    }

    const stream = streamResult.items[0] as LiveStreamItem;

    // 削除済み
    if (stream.is_deleted) {
      return notFoundResponse('ライブ配信');
    }

    // 配信者のみ終了可能
    if (stream.account_id !== accountId) {
      return unauthorizedResponse('このライブ配信を終了する権限がありません');
    }

    // すでに終了している
    if (stream.status === 'idle' || stream.status === 'disabled') {
      return validationErrorResponse('この配信はすでに終了しています');
    }

    const now = getCurrentTimestamp();
    const totalDuration = stream.started_at ? now - stream.started_at : 0;

    // ステータスを更新
    await updateItem({
      TableName: TableNames.LIVE_STREAM,
      Key: {
        stream_id: streamId,
        created_at: stream.created_at,
      },
      UpdateExpression: 'SET #status = :status, ended_at = :endedAt, updated_at = :updatedAt, viewer_count = :zero',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'idle',
        ':endedAt': now,
        ':updatedAt': now,
        ':zero': 0, // 配信終了時に視聴者数をリセット
      },
    });

    // TODO: WebSocket経由で視聴者全員に配信終了を通知

    // レスポンス
    const response: EndLiveStreamResponse = {
      stream_id: streamId,
      ended_at: now,
      total_duration: totalDuration,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'endLiveStream' });

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
    return internalErrorResponse('ライブ配信終了中にエラーが発生しました');
  }
};
