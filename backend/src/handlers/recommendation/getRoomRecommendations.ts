/**
 * Room推薦ハンドラー
 * ユーザーの参加履歴に基づいておすすめRoomを返す（簡略版）
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  successResponse,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
} from '../../lib/utils/response';
import { validatePaginationLimit } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, query } from '../../lib/dynamodb';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const accountId = event.headers['x-account-id'];

    if (!accountId) {
      return unauthorizedResponse('アカウントIDが取得できません');
    }

    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 20;

    const validatedLimit = validatePaginationLimit(limit);

    // 簡略版: アクティブなRoomを取得（member_countが多い順）
    const roomsResult = await query({
      TableName: TableNames.ROOM,
      IndexName: 'GSI1',
      KeyConditionExpression: 'category = :category',
      ExpressionAttributeValues: {
        ':category': 'fashion', // デフォルトカテゴリ
      },
      ScanIndexForward: false,
      Limit: validatedLimit,
    });

    return successResponse({
      items: roomsResult.items,
      nextToken: undefined,
    });
  } catch (error: any) {
    logError(error as Error, { handler: 'getRoomRecommendations' });
    return internalErrorResponse('Room推薦取得中にエラーが発生しました');
  }
};
