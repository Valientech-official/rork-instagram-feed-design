/**
 * モデレーター追加ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { LiveStreamItem, LiveModeratorItem } from '../../types/dynamodb';
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
import { TableNames, query, putItem } from '../../lib/dynamodb';

interface AddModeratorRequest {
  moderator_account_id: string;
}

interface AddModeratorResponse {
  stream_id: string;
  moderator_account_id: string;
  added_at: number;
}

/**
 * モデレーター追加Lambda関数
 *
 * 配信者のみがモデレーターを追加可能
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

    const request = parseRequestBody<AddModeratorRequest>(event.body);
    validateRequired(request.moderator_account_id, 'モデレーターアカウントID');

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

    // 配信者のみモデレーターを追加可能
    if (stream.account_id !== accountId) {
      return unauthorizedResponse('モデレーターを追加する権限がありません');
    }

    const now = getCurrentTimestamp();

    const moderatorItem: LiveModeratorItem = {
      stream_id: streamId,
      account_id: request.moderator_account_id,
      added_by_account_id: accountId,
      added_at: now,
    };

    await putItem({
      TableName: TableNames.LIVE_MODERATOR,
      Item: moderatorItem,
      ConditionExpression: 'attribute_not_exists(stream_id)',
    });

    const response: AddModeratorResponse = {
      stream_id: streamId,
      moderator_account_id: request.moderator_account_id,
      added_at: now,
    };

    return successResponse(response, 201);
  } catch (error: any) {
    logError(error as Error, { handler: 'addModerator' });

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

    return internalErrorResponse('モデレーター追加中にエラーが発生しました');
  }
};
