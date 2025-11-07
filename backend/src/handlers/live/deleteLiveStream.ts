/**
 * ライブ配信削除ハンドラー
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
import { TableNames, getItem, updateItem } from '../../lib/dynamodb';
import { getMuxClient, handleMuxError } from '../../lib/utils/mux';

interface DeleteLiveStreamResponse {
  stream_id: string;
  deleted_at: number;
}

/**
 * ライブ配信削除Lambda関数
 *
 * 配信作成者のみが削除可能
 * Mux Live Streamも削除
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

    // ライブ配信が存在するか確認
    const existingStream = await getItem<LiveStreamItem>({
      TableName: TableNames.LIVE_STREAM,
      Key: {
        stream_id: streamId,
        created_at: 0, // GSIを使わない場合、created_atが必要
      },
    });

    if (!existingStream) {
      return notFoundResponse('ライブ配信');
    }

    // すでに削除されている
    if (existingStream.is_deleted) {
      return validationErrorResponse('このライブ配信はすでに削除されています');
    }

    // 配信の作成者のみ削除可能
    if (existingStream.account_id !== accountId) {
      return unauthorizedResponse('このライブ配信を削除する権限がありません');
    }

    // アクティブな配信は削除できない
    if (existingStream.status === 'active') {
      return validationErrorResponse('配信中のライブ配信は削除できません。先に配信を終了してください。');
    }

    const now = getCurrentTimestamp();
    const ttl = now + 30 * 24 * 60 * 60; // 30日後に物理削除

    // Mux Live Streamを削除
    try {
      const muxClient = await getMuxClient();
      await muxClient.video.liveStreams.delete(existingStream.mux_live_stream_id);
    } catch (error) {
      const muxError = handleMuxError(error);
      logError(muxError, {
        handler: 'deleteLiveStream',
        phase: 'mux_delete',
        mux_live_stream_id: existingStream.mux_live_stream_id,
      });
      // Mux削除失敗は致命的ではない（すでに削除されている可能性もある）
      console.warn(`Mux Live Stream deletion failed for ${existingStream.mux_live_stream_id}`);
    }

    // DynamoDBで論理削除
    await updateItem({
      TableName: TableNames.LIVE_STREAM,
      Key: {
        stream_id: streamId,
        created_at: existingStream.created_at,
      },
      UpdateExpression: 'SET is_deleted = :isDeleted, deleted_at = :deletedAt, #status = :status, ttl = :ttl, updated_at = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':isDeleted': true,
        ':deletedAt': now,
        ':status': 'disabled',
        ':ttl': ttl,
        ':updatedAt': now,
      },
    });

    // レスポンス
    const response: DeleteLiveStreamResponse = {
      stream_id: streamId,
      deleted_at: now,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'deleteLiveStream' });

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
    return internalErrorResponse('ライブ配信削除中にエラーが発生しました');
  }
};
