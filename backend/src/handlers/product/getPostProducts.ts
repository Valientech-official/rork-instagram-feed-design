/**
 * 投稿の商品一覧取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { ProductItem, AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, query, getItem } from '../../lib/dynamodb';

interface GetPostProductsResponse {
  post_id: string;
  products: Array<{
    product: ProductItem;
    seller: {
      account_id: string;
      username: string;
      handle: string;
      profile_image?: string;
    };
    tagged_at: number;
    tagged_by_account_id: string;
  }>;
  count: number;
}

/**
 * 投稿の商品一覧取得Lambda関数
 *
 * 投稿にタグ付けされた商品一覧を取得
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // パスパラメータから投稿IDを取得
    const postId = event.pathParameters?.post_id;

    if (!postId) {
      return notFoundResponse('投稿ID');
    }

    // PRODUCT_TAGテーブルから商品タグを取得
    const tagResult = await query({
      TableName: TableNames.PRODUCT_TAG,
      KeyConditionExpression: 'post_id = :postId',
      ExpressionAttributeValues: {
        ':postId': postId,
      },
    });

    if (tagResult.items.length === 0) {
      // タグがない場合は空配列を返す
      const response: GetPostProductsResponse = {
        post_id: postId,
        products: [],
        count: 0,
      };
      return successResponse(response);
    }

    // 商品IDと販売者IDを抽出
    const productIds = tagResult.items.map((item: any) => item.product_id);
    const sellerIds = Array.from(new Set(tagResult.items.map((item: any) => item.seller_account_id)));

    // 商品情報を取得
    const productPromises = productIds.map((id: string) =>
      getItem<ProductItem>({
        TableName: TableNames.PRODUCT,
        Key: {
          product_id: id,
        },
      })
    );

    // 販売者情報を取得
    const sellerPromises = sellerIds.map((id: string) =>
      getItem<AccountItem>({
        TableName: TableNames.ACCOUNT,
        Key: {
          PK: `ACCOUNT#${id}`,
          SK: 'PROFILE',
        },
      })
    );

    const [products, sellers] = await Promise.all([
      Promise.all(productPromises),
      Promise.all(sellerPromises),
    ]);

    // 販売者マップを作成
    const sellerMap = new Map<string, AccountItem>();
    sellers.forEach((seller) => {
      if (seller) {
        sellerMap.set(seller.account_id, seller);
      }
    });

    // タグ情報と商品/販売者情報をマージ
    const productsWithDetails = tagResult.items
      .map((tagItem: any, index: number) => {
        const product = products[index];
        const seller = product ? sellerMap.get(product.seller_account_id) : null;

        // 削除された商品はスキップ
        if (!product || product.is_deleted) {
          return null;
        }

        if (!seller) {
          return null;
        }

        return {
          product,
          seller: {
            account_id: seller.account_id,
            username: seller.username,
            handle: seller.handle,
            profile_image: seller.profile_image,
          },
          tagged_at: tagItem.tagged_at,
          tagged_by_account_id: tagItem.tagged_by_account_id,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // レスポンス
    const response: GetPostProductsResponse = {
      post_id: postId,
      products: productsWithDetails,
      count: productsWithDetails.length,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getPostProducts' });

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
    return internalErrorResponse('投稿の商品一覧取得中にエラーが発生しました');
  }
};
