/**
 * 投稿への商品タグ付けハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { PostItem, ProductItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
} from '../../lib/utils/response';
import { validateRequired } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, getItem, putItem, updateItem, query } from '../../lib/dynamodb';

interface TagProductOnPostRequest {
  product_ids: string[];
}

interface TagProductOnPostResponse {
  post_id: string;
  tagged_products: number;
  tags: Array<{
    product_id: string;
    tagged_at: number;
  }>;
}

/**
 * 投稿への商品タグ付けLambda関数
 *
 * 投稿所有者のみが商品をタグ付け可能（最大5個）
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

    // パスパラメータから投稿IDを取得
    const postId = event.pathParameters?.post_id;

    if (!postId) {
      return notFoundResponse('投稿ID');
    }

    // リクエストボディをパース
    const request = parseRequestBody<TagProductOnPostRequest>(event.body);

    // バリデーション
    validateRequired(request.product_ids, '商品ID一覧');

    if (!Array.isArray(request.product_ids) || request.product_ids.length === 0) {
      return validationErrorResponse('商品IDを1つ以上指定してください');
    }

    if (request.product_ids.length > 5) {
      return validationErrorResponse('1つの投稿に最大5個の商品までタグ付けできます');
    }

    // 投稿が存在するか確認
    const post = await getItem<PostItem>({
      TableName: TableNames.POST,
      Key: {
        postId: postId,
      },
    });

    if (!post) {
      return notFoundResponse('投稿');
    }

    // 削除された投稿にはタグ付けできない
    if (post.isDeleted) {
      return validationErrorResponse('削除された投稿には商品をタグ付けできません');
    }

    // 投稿の所有者のみタグ付け可能
    if (post.accountId !== accountId) {
      return unauthorizedResponse('この投稿に商品をタグ付けする権限がありません');
    }

    // 既存のタグを確認
    const existingTags = await query({
      TableName: TableNames.PRODUCT_TAG,
      KeyConditionExpression: 'post_id = :postId',
      ExpressionAttributeValues: {
        ':postId': postId,
      },
    });

    const existingProductIds = new Set(existingTags.items.map((item: any) => item.product_id));
    const totalAfterTag = existingProductIds.size + request.product_ids.filter((id) => !existingProductIds.has(id)).length;

    if (totalAfterTag > 5) {
      return validationErrorResponse(`この投稿にはすでに${existingProductIds.size}個の商品がタグ付けされています。最大5個までです。`);
    }

    const now = getCurrentTimestamp();
    const tags: Array<{ product_id: string; tagged_at: number }> = [];

    // 各商品をタグ付け
    for (const productId of request.product_ids) {
      // 重複チェック
      if (existingProductIds.has(productId)) {
        console.log(`Product ${productId} is already tagged on post ${postId}`);
        continue;
      }

      // 商品が存在するか確認
      const product = await getItem<ProductItem>({
        TableName: TableNames.PRODUCT,
        Key: {
          product_id: productId,
        },
      });

      if (!product) {
        return validationErrorResponse(`商品ID ${productId} が見つかりません`);
      }

      // 削除された商品はタグ付けできない
      if (product.is_deleted) {
        return validationErrorResponse(`商品ID ${productId} は削除されています`);
      }

      // アクティブな商品のみタグ付け可能
      if (product.status !== 'active') {
        return validationErrorResponse(`商品ID ${productId} はアクティブではありません`);
      }

      // PRODUCT_TAGテーブルに保存（重複防止のConditionExpression使用）
      try {
        await putItem({
          TableName: TableNames.PRODUCT_TAG,
          Item: {
            post_id: postId,
            product_id: productId,
            tagged_by_account_id: accountId,
            seller_account_id: product.seller_account_id,
            tagged_at: now,
          },
          ConditionExpression: 'attribute_not_exists(post_id)',
        });

        // 商品のtag_countをインクリメント（非同期）
        updateItem({
          TableName: TableNames.PRODUCT,
          Key: {
            product_id: productId,
          },
          UpdateExpression: 'SET tag_count = tag_count + :one',
          ExpressionAttributeValues: {
            ':one': 1,
          },
        }).catch((err) => {
          console.warn(`Failed to increment tag_count for product ${productId}:`, err);
        });

        tags.push({
          product_id: productId,
          tagged_at: now,
        });
      } catch (error: any) {
        if (error.code === 'ConditionalCheckFailedException') {
          console.log(`Product ${productId} is already tagged on post ${postId} (race condition)`);
          continue;
        }
        throw error;
      }
    }

    // レスポンス
    const response: TagProductOnPostResponse = {
      post_id: postId,
      tagged_products: tags.length,
      tags,
    };

    return successResponse(response, tags.length > 0 ? 201 : 200);
  } catch (error: any) {
    logError(error as Error, { handler: 'tagProductOnPost' });

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
    return internalErrorResponse('商品タグ付け中にエラーが発生しました');
  }
};
