/**
 * コメント作成ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { CreateCommentRequest, CreateCommentResponse } from '../../types/api';
import { CommentItem, PostItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
} from '../../lib/utils/response';
import { validateRequired, validateCommentContent } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { generateULID } from '../../lib/utils/ulid';
import { TableNames, putItem, getItemRequired, incrementCounter } from '../../lib/dynamodb';

/**
 * コメント作成Lambda関数
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
      return unauthorizedResponse('投稿IDが指定されていません');
    }

    // リクエストボディをパース
    const request = parseRequestBody<CreateCommentRequest>(event.body);

    // バリデーション
    validateRequired(request.content, 'コメント内容');
    validateCommentContent(request.content);

    // 投稿が存在するか確認
    const post = await getItemRequired<PostItem>(
      {
        TableName: TableNames.POST,
        Key: {
          postId: postId,
        },
      },
      '投稿'
    );

    // 削除済み投稿にはコメントできない
    if (post.isDeleted) {
      throw new Error('削除された投稿にはコメントできません');
    }

    // コメントIDを生成
    const commentId = generateULID();
    const now = getCurrentTimestamp();

    // コメントアイテムを作成
    const commentItem: CommentItem = {
      comment_id: commentId,
      post_id: postId,
      account_id: accountId,
      parent_comment_id: request.parent_comment_id,
      reply_to_account_id: request.reply_to_account_id,
      content: request.content,
      created_at: now,
      like_count: 0,
      reply_count: 0,
      is_deleted: false, // 運営削除時のみtrue（ユーザー削除は物理削除）
    };

    // DynamoDBに保存
    await putItem({
      TableName: TableNames.COMMENT,
      Item: commentItem,
    });

    // 投稿のコメント数をインクリメント
    incrementCounter(
      TableNames.POST,
      { postId: postId },
      'commentCount',
      1
    ).catch((err) => {
      console.warn('Failed to increment commentCount:', err);
    });

    // 親コメントがある場合、親コメントのreply_countをインクリメント
    if (request.parent_comment_id) {
      incrementCounter(
        TableNames.COMMENT,
        { comment_id: request.parent_comment_id },
        'reply_count',
        1
      ).catch((err) => {
        console.warn('Failed to increment reply_count:', err);
      });
    }

    // レスポンス
    const response: CreateCommentResponse = {
      comment_id: commentId,
      created_at: now,
    };

    return successResponse(response, 201);
  } catch (error: any) {
    logError(error as Error, { handler: 'createComment' });

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
    return internalErrorResponse('コメント作成中にエラーが発生しました');
  }
};
