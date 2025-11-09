/**
 * 商品クリック追跡ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { ProductItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, getItem, updateItem } from '../../lib/dynamodb';

interface ClickProductResponse {
  product_id: string;
  external_url: string;
  click_count: number;
}

/**
 * 商品クリック追跡Lambda関数
 *
 * 外部リンククリックを追跡し、カウントをインクリメント
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
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
      },
    });

    if (!product) {
      return notFoundResponse('商品');
    }

    // 削除された商品はクリック不可
    if (product.is_deleted) {
      return notFoundResponse('商品');
    }

    // アクティブな商品のみクリック可能
    if (product.status !== 'active') {
      return notFoundResponse('商品');
    }

    // クリック数をインクリメント
    const result = await updateItem({
      TableName: TableNames.PRODUCT,
      Key: {
        product_id: productId,
      },
      UpdateExpression: 'SET click_count = click_count + :one',
      ExpressionAttributeValues: {
        ':one': 1,
      },
      ReturnValues: 'ALL_NEW',
    });

    const updatedClickCount = result.Attributes?.click_count || product.click_count + 1;

    // レスポンス（フロントエンドがこのURLにリダイレクト）
    const response: ClickProductResponse = {
      product_id: productId,
      external_url: product.external_url,
      click_count: updatedClickCount,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'clickProduct' });

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
    return internalErrorResponse('商品クリック追跡中にエラーが発生しました');
  }
};
