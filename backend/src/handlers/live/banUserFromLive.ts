/**
 * ユーザーBAN（ライブ配信）ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { LiveStreamItem, ModeratorActionLogItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { validateRequired } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { generateULID } from '../../lib/utils/ulid';
import { TableNames, query, getItem, putItem } from '../../lib/dynamodb';

interface BanUserRequest {
  target_account_id: string;
  reason?: string;
}

interface BanUserResponse {
  log_id: string;
  banned_at: number;
}

/**
 * ユーザーBAN Lambda関数
 *
 * 配信者またはモデレーターのみが実行可能
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const accountId = event.headers['x-account-id'];

    if (!accountId) {
      return unauthorizedResponse('アカウントIDが取得できません');
    }

    const streamId = event.pathParameters?.stream_id;

    if (!streamId) {
      return notFoundResponse('配信ID');
    }

    const request = parseRequestBody<BanUserRequest>(event.body);
    validateRequired(request.target_account_id, 'BANするアカウントID');

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

    // 配信者またはモデレーターか確認
    const isBroadcaster = stream.account_id === accountId;
    let isModerator = false;

    if (!isBroadcaster) {
      const moderator = await getItem({
        TableName: TableNames.LIVE_MODERATOR,
        Key: {
          stream_id: streamId,
          account_id: accountId,
        },
      });
      isModerator = !!moderator;
    }

    if (!isBroadcaster && !isModerator) {
      return unauthorizedResponse('この操作を実行する権限がありません');
    }

    const now = getCurrentTimestamp();
    const logId = generateULID();

    // アクションログを記録
    const actionLog: ModeratorActionLogItem = {
      log_id: logId,
      created_at: now,
      stream_id: streamId,
      moderator_account_id: accountId,
      action_type: 'ban',
      target_account_id: request.target_account_id,
      reason: request.reason,
      ttl: now + 30 * 24 * 60 * 60, // 30日後削除
    };

    await putItem({
      TableName: TableNames.MODERATOR_ACTION_LOG,
      Item: actionLog,
    });

    // TODO: WebSocket経由でBANユーザーの接続を切断
    // TODO: BANリストに追加（将来の機能）

    const response: BanUserResponse = {
      log_id: logId,
      banned_at: now,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'banUserFromLive' });

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

    return internalErrorResponse('ユーザーBAN中にエラーが発生しました');
  }
};
