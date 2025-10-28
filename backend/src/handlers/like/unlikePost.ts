/**
 * いいね削除ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { LikePostRequest, LikePostResponse } from '../../types/api';
import { LikeItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { validateRequired } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, getItem, deleteItem, decrementCounter } from '../../lib/dynamodb';

/**
 * いいね削除Lambda関数
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

    // リクエストボディをパース
    const request = parseRequestBody<LikePostRequest>(event.body);

    // バリデーション
    validateRequired(request.post_id, '投稿ID');

    // ベーステーブルから直接取得（プライマリキーが分かっているため）
    const like = await getItem<LikeItem>({
      TableName: TableNames.LIKE,
      Key: {
        post_id: request.post_id,
        account_id: accountId,
      },
    });

    if (!like) {
      return notFoundResponse('いいね');
    }

    // いいねを削除（複合キー: post_id + account_id）
    await deleteItem({
      TableName: TableNames.LIKE,
      Key: {
        post_id: request.post_id,
        account_id: accountId,
      },
    });

    // 投稿のいいね数をデクリメント
    let newLikeCount = 0;

    try {
      newLikeCount = await decrementCounter(
        TableNames.POST,
        { postId: request.post_id },
        'likeCount',
        1
      );
    } catch (error) {
      // 投稿が削除されている場合などは無視
      console.warn('Failed to decrement like count:', error);
    }

    // レスポンス
    const response: LikePostResponse = {
      liked: false,
      like_count: newLikeCount,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'unlikePost' });

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
    return internalErrorResponse('いいね削除中にエラーが発生しました');
  }
};
