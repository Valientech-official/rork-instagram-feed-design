/**
 * 商品一覧取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { ProductItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  validationErrorResponse,
} from '../../lib/utils/response';
import { validatePaginationLimit } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, query, scan } from '../../lib/dynamodb';

interface GetProductsResponse {
  items: ProductItem[];
  nextToken?: string;
  count: number;
}

/**
 * 商品一覧取得Lambda関数
 *
 * フィルタ（カテゴリ、販売者、ステータス）で商品一覧を取得
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // クエリパラメータを取得
    const sellerAccountId = event.queryStringParameters?.seller_account_id;
    const category = event.queryStringParameters?.category;
    const status = event.queryStringParameters?.status;
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 20;
    const nextToken = event.queryStringParameters?.nextToken;

    // バリデーション
    const validatedLimit = validatePaginationLimit(limit, 100);

    // 複数のフィルタは指定不可
    const filterCount = [sellerAccountId, category, status].filter(Boolean).length;
    if (filterCount > 1) {
      return validationErrorResponse('フィルタは seller_account_id、category、status のいずれか1つのみ指定できます');
    }

    // カテゴリのバリデーション
    if (category) {
      const validCategories = ['fashion', 'beauty', 'food', 'other'];
      if (!validCategories.includes(category)) {
        return validationErrorResponse('カテゴリはfashion/beauty/food/otherのいずれかを指定してください');
      }
    }

    // ステータスのバリデーション
    if (status) {
      const validStatuses = ['active', 'inactive', 'deleted'];
      if (!validStatuses.includes(status)) {
        return validationErrorResponse('ステータスはactive/inactive/deletedのいずれかを指定してください');
      }
    }

    let result: any;

    // フィルタに応じてクエリ
    if (sellerAccountId) {
      // GSI1: 販売者別
      result = await query({
        TableName: TableNames.PRODUCT,
        IndexName: 'GSI1',
        KeyConditionExpression: 'seller_account_id = :sellerAccountId',
        ExpressionAttributeValues: {
          ':sellerAccountId': sellerAccountId,
          ':isDeleted': false,
        },
        FilterExpression: 'is_deleted = :isDeleted',
        ScanIndexForward: false, // 新しい順
        Limit: validatedLimit,
        ExclusiveStartKey: nextToken
          ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
          : undefined,
      });
    } else if (category) {
      // GSI2: カテゴリ別
      result = await query({
        TableName: TableNames.PRODUCT,
        IndexName: 'GSI2',
        KeyConditionExpression: 'category = :category',
        ExpressionAttributeValues: {
          ':category': category,
          ':isDeleted': false,
        },
        FilterExpression: 'is_deleted = :isDeleted',
        ScanIndexForward: false, // 新しい順
        Limit: validatedLimit,
        ExclusiveStartKey: nextToken
          ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
          : undefined,
      });
    } else if (status) {
      // GSI3: ステータス別
      result = await query({
        TableName: TableNames.PRODUCT,
        IndexName: 'GSI3',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': status,
          ':isDeleted': status !== 'deleted', // deletedステータスの場合はis_deletedフィルタ不要
        },
        FilterExpression: status !== 'deleted' ? 'is_deleted = :isDeleted' : undefined,
        ScanIndexForward: false, // 新しい順
        Limit: validatedLimit,
        ExclusiveStartKey: nextToken
          ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
          : undefined,
      });
    } else {
      // フィルタなし: デフォルトでactiveステータスのみ表示（Scan回避）
      result = await query({
        TableName: TableNames.PRODUCT,
        IndexName: 'GSI3',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': 'active',
          ':isDeleted': false,
        },
        FilterExpression: 'is_deleted = :isDeleted',
        ScanIndexForward: false, // 新しい順
        Limit: validatedLimit,
        ExclusiveStartKey: nextToken
          ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
          : undefined,
      });
    }

    // 次のページのトークンを生成
    const nextTokenValue = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;

    // レスポンス
    const response: GetProductsResponse = {
      items: result.items as ProductItem[],
      nextToken: nextTokenValue,
      count: result.items.length,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getProducts' });

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
    return internalErrorResponse('商品一覧取得中にエラーが発生しました');
  }
};
