/**
 * ライブ配信退出ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { LiveStreamItem, LiveViewerItem } from '../../types/dynamodb';
import {
  successResponse,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, query, updateItem } from '../../lib/dynamodb';

interface LeaveLiveStreamResponse {
  stream_id: string;
  left_at: number;
  watch_duration: number;
}

/**
 * ライブ配信退出Lambda関数
 *
 * 視聴者数をデクリメント、LIVE_VIEWERを更新
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

    const now = getCurrentTimestamp();
    const viewerKey = `${streamId}#${accountId}`;

    // 視聴記録を取得
    const viewerResult = await query({
      TableName: TableNames.LIVE_VIEWER,
      KeyConditionExpression: 'viewer_key = :viewerKey',
      ExpressionAttributeValues: {
        ':viewerKey': viewerKey,
      },
      ScanIndexForward: false, // 最新を取得
      Limit: 1,
    });

    if (!viewerResult.items || viewerResult.items.length === 0) {
      // 視聴記録がない場合は何もしない
      const response: LeaveLiveStreamResponse = {
        stream_id: streamId,
        left_at: now,
        watch_duration: 0,
      };
      return successResponse(response);
    }

    const viewer = viewerResult.items[0] as LiveViewerItem;

    if (!viewer.is_active) {
      // すでに退出済み
      const response: LeaveLiveStreamResponse = {
        stream_id: streamId,
        left_at: viewer.left_at || now,
        watch_duration: viewer.watch_duration,
      };
      return successResponse(response);
    }

    // 視聴時間を計算
    const watchDuration = viewer.watch_duration + (now - viewer.joined_at);

    // LIVE_VIEWERを更新
    await updateItem({
      TableName: TableNames.LIVE_VIEWER,
      Key: {
        viewer_key: viewerKey,
        joined_at: viewer.joined_at,
      },
      UpdateExpression: 'SET is_active = :false, left_at = :now, watch_duration = :duration, updated_at = :now',
      ExpressionAttributeValues: {
        ':false': false,
        ':now': now,
        ':duration': watchDuration,
      },
    });

    // LIVE_STREAMのviewer_countをデクリメント（負数にならないように）
    await updateItem({
      TableName: TableNames.LIVE_STREAM,
      Key: {
        stream_id: streamId,
        created_at: stream.created_at,
      },
      UpdateExpression: 'SET viewer_count = if_not_exists(viewer_count, :zero) - :one, updated_at = :now',
      ConditionExpression: 'viewer_count > :zero',
      ExpressionAttributeValues: {
        ':one': 1,
        ':zero': 0,
        ':now': now,
      },
    }).catch((err) => {
      // viewer_countが0の場合はConditionExpressionで失敗するが、これは正常
      if (err.name !== 'ConditionalCheckFailedException') {
        throw err;
      }
    });

    // レスポンス
    const response: LeaveLiveStreamResponse = {
      stream_id: streamId,
      left_at: now,
      watch_duration: watchDuration,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'leaveLiveStream' });

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
    return internalErrorResponse('ライブ配信退出中にエラーが発生しました');
  }
};
