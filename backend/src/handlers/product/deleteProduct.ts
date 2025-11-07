/**
 * 商品削除ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { ProductItem } from '../../types/dynamodb';
import {
  successResponse,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, getItem, updateItem, query, batchWrite } from '../../lib/dynamodb';

interface DeleteProductResponse {
  product_id: string;
  deleted_at: number;
}

/**
 * 商品削除Lambda関数
 *
 * 商品を論理削除し、90日後に物理削除
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

    // パスパラメータから商品IDを取得
    const productId = event.pathParameters?.product_id;

    if (!productId) {
      return notFoundResponse('商品ID');
    }

    // 商品が存在するか確認
    const existingProduct = await getItem<ProductItem>({
      TableName: TableNames.PRODUCT,
      Key: {
        product_id: productId,
      },
    });

    if (!existingProduct) {
      return notFoundResponse('商品');
    }

    // すでに削除されている
    if (existingProduct.is_deleted) {
      return validationErrorResponse('この商品はすでに削除されています');
    }

    // 商品の所有者のみ削除可能
    if (existingProduct.seller_account_id !== accountId) {
      return unauthorizedResponse('この商品を削除する権限がありません');
    }

    const now = getCurrentTimestamp();
    const ttl = now + 90 * 24 * 60 * 60; // 90日後に物理削除

    // 商品を論理削除
    await updateItem({
      TableName: TableNames.PRODUCT,
      Key: {
        product_id: productId,
      },
      UpdateExpression: 'SET is_deleted = :isDeleted, #status = :status, deleted_at = :deletedAt, ttl = :ttl, updated_at = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':isDeleted': true,
        ':status': 'deleted',
        ':deletedAt': now,
        ':ttl': ttl,
        ':updatedAt': now,
      },
    });

    // PRODUCT_TAGテーブルから関連するタグを削除（GSI1を使用）
    try {
      const tagResult = await query({
        TableName: TableNames.PRODUCT_TAG,
        IndexName: 'GSI1',
        KeyConditionExpression: 'product_id = :productId',
        ExpressionAttributeValues: {
          ':productId': productId,
        },
      });

      if (tagResult.items.length > 0) {
        // 最大25件ずつ削除
        const deleteRequests = tagResult.items.map((item: any) => ({
          DeleteRequest: {
            Key: {
              post_id: item.post_id,
              product_id: item.product_id,
            },
          },
        }));

        const chunks: any[][] = [];
        for (let i = 0; i < deleteRequests.length; i += 25) {
          chunks.push(deleteRequests.slice(i, i + 25));
        }

        for (const chunk of chunks) {
          await batchWrite({
            RequestItems: {
              [TableNames.PRODUCT_TAG]: chunk,
            },
          });
        }
      }
    } catch (error) {
      console.warn('Failed to delete product tags:', error);
      // タグ削除失敗は致命的ではない
    }

    // レスポンス
    const response: DeleteProductResponse = {
      product_id: productId,
      deleted_at: now,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'deleteProduct' });

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
    return internalErrorResponse('商品削除中にエラーが発生しました');
  }
};
