/**
 * 商品推薦ハンドラー
 * ユーザーの閲覧・いいね履歴に基づいておすすめ商品を返す（簡略版）
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
    const category = event.queryStringParameters?.category;

    const validatedLimit = validatePaginationLimit(limit);

    // 簡略版: カテゴリ別商品を取得（新しい順）
    const productsResult = await query({
      TableName: TableNames.PRODUCT,
      IndexName: category ? 'GSI_category_products' : 'GSI_status_products',
      KeyConditionExpression: category ? 'category = :category' : '#status = :status',
      ExpressionAttributeNames: category ? undefined : { '#status': 'status' },
      ExpressionAttributeValues: category
        ? { ':category': category }
        : { ':status': 'active' },
      ScanIndexForward: false,
      Limit: validatedLimit,
    });

    return successResponse({
      items: productsResult.items,
      nextToken: undefined,
    });
  } catch (error: any) {
    logError(error as Error, { handler: 'getProductRecommendations' });
    return internalErrorResponse('商品推薦取得中にエラーが発生しました');
  }
};
