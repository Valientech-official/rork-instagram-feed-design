/**
 * いいね追加ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { LikePostRequest, LikePostResponse } from '../../types/api';
import { LikeItem, PostItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
} from '../../lib/utils/response';
import { validateRequired } from '../../lib/validators';
import { DuplicateLikeError, logError } from '../../lib/utils/error';
import { TableNames, putItemIfNotExists, getItemRequired, incrementCounter } from '../../lib/dynamodb';

/**
 * いいね追加Lambda関数
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

    // 投稿が存在するか確認
    const post = await getItemRequired<PostItem>(
      {
        TableName: TableNames.POST,
        Key: {
          postId: request.post_id,
        },
      },
      '投稿'
    );

    // 削除済み投稿にはいいねできない
    if (post.isDeleted) {
      throw new Error('削除された投稿にはいいねできません');
    }

    // いいねアイテムを作成
    const now = getCurrentTimestamp();

    const likeItem: LikeItem = {
      post_id: request.post_id,
      account_id: accountId,
      created_at: now,
    };

    // 重複チェック付きでDynamoDBに保存（複合キー: post_id + account_id）
    const created = await putItemIfNotExists(TableNames.LIKE, likeItem, 'post_id');

    if (!created) {
      // 既にいいね済みの場合はGSI1で確認
      throw new DuplicateLikeError();
    }

    // 投稿のいいね数をインクリメント
    const newLikeCount = await incrementCounter(
      TableNames.POST,
      { postId: request.post_id },
      'likeCount',
      1
    );

    // レスポンス
    const response: LikePostResponse = {
      liked: true,
      like_count: newLikeCount,
    };

    return successResponse(response, 201);
  } catch (error: any) {
    logError(error as Error, { handler: 'likePost' });

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
    return internalErrorResponse('いいね追加中にエラーが発生しました');
  }
};
