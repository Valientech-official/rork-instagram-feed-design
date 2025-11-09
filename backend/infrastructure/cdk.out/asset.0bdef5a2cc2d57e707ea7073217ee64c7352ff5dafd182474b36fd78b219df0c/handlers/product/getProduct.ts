/**
 * 商品詳細取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { ProductItem, AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, getItem, updateItem } from '../../lib/dynamodb';

interface GetProductResponse {
  product: ProductItem;
  seller: {
    account_id: string;
    username: string;
    handle: string;
    profile_image?: string;
    account_type: string;
  };
}

/**
 * 商品詳細取得Lambda関数
 *
 * 商品詳細を取得し、閲覧数をインクリメント
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // アカウントIDはオプショナル（未ログインでも閲覧可能）
    const accountId = event.headers['x-account-id'];

    // パスパラメータから商品IDを取得
    const productId = event.pathParameters?.product_id;

    if (!productId) {
      return notFoundResponse('商品ID');
    }

    // 商品を取得
    const product = await getItem<ProductItem>({
      TableName: TableNames.PRODUCT,
      Key: {
        product_id: productId,
        created_at: 0, // Note: ProductテーブルはPKのみでも取得可能（要確認）
      },
    });

    if (!product) {
      return notFoundResponse('商品');
    }

    // 削除された商品は表示しない
    if (product.is_deleted) {
      return notFoundResponse('商品');
    }

    // 非アクティブな商品は販売者のみ閲覧可能
    if (product.status === 'inactive' && product.seller_account_id !== accountId) {
      return unauthorizedResponse('この商品を閲覧する権限がありません');
    }

    // 販売者のアカウント情報を取得
    const seller = await getItem<AccountItem>({
      TableName: TableNames.ACCOUNT,
      Key: {
        PK: `ACCOUNT#${product.seller_account_id}`,
        SK: 'PROFILE',
      },
    });

    if (!seller) {
      return notFoundResponse('販売者アカウント');
    }

    // 閲覧数をインクリメント（非同期、エラーは無視）
    updateItem({
      TableName: TableNames.PRODUCT,
      Key: {
        product_id: productId,
      },
      UpdateExpression: 'SET view_count = view_count + :one',
      ExpressionAttributeValues: {
        ':one': 1,
      },
    }).catch((err) => {
      console.warn('Failed to increment view_count:', err);
    });

    // レスポンス
    const response: GetProductResponse = {
      product,
      seller: {
        account_id: seller.account_id,
        username: seller.username,
        handle: seller.handle,
        profile_image: seller.profile_image,
        account_type: seller.account_type,
      },
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getProduct' });

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
    return internalErrorResponse('商品詳細取得中にエラーが発生しました');
  }
};
