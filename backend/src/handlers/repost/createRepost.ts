/**
 * リポスト作成ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { CreateRepostRequest, CreateRepostResponse } from '../../types/api';
import { RepostItem, PostItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
  validationErrorResponse,
  forbiddenResponse,
} from '../../lib/utils/response';
import { validateRequired } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { generateULID } from '../../lib/utils/ulid';
import { TableNames, putItem, getItemRequired, updateItem, query } from '../../lib/dynamodb';

/**
 * リポスト作成Lambda関数
 *
 * 投稿をリポストする
 * - 自分の投稿もリポスト可能
 * - allow_repost が false の場合はリポスト不可
 * - 既にリポスト済みの場合は重複作成しない（冪等性）
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
    const request = parseRequestBody<CreateRepostRequest>(event.body);

    // バリデーション
    validateRequired(request.post_id, '投稿ID');

    // コメントの長さチェック（引用リポストの場合）
    if (request.comment && request.comment.length > 500) {
      return validationErrorResponse('コメントは500文字以内で入力してください');
    }

    // 元投稿が存在するか確認
    const originalPost = await getItemRequired<PostItem>(
      {
        TableName: TableNames.POST,
        Key: {
          postId: request.post_id,
        },
      },
      '投稿'
    );

    // 削除済み投稿はリポスト不可
    if (originalPost.isDeleted) {
      return forbiddenResponse('削除された投稿はリポストできません');
    }

    // リポスト許可チェック
    if (!originalPost.allow_repost) {
      return forbiddenResponse('この投稿はリポストが許可されていません');
    }

    // 既に同じ投稿をリポスト済みかチェック
    const existingReposts = await query<RepostItem>({
      TableName: TableNames.REPOST,
      IndexName: 'GSI1',
      KeyConditionExpression: 'account_id = :accountId',
      FilterExpression: 'original_post_id = :postId AND is_deleted = :isDeleted',
      ExpressionAttributeValues: {
        ':accountId': accountId,
        ':postId': request.post_id,
        ':isDeleted': false,
      },
      Limit: 1,
    });

    // 既にリポスト済みの場合は既存のリポスト情報を返す（冪等性）
    if (existingReposts.items.length > 0) {
      const existingRepost = existingReposts.items[0];
      const response: CreateRepostResponse = {
        repost_id: existingRepost.repost_id,
        account_id: existingRepost.account_id,
        original_post_id: existingRepost.original_post_id,
        original_author_id: existingRepost.original_author_id,
        comment: existingRepost.comment,
        created_at: existingRepost.created_at,
      };
      return successResponse(response, 200);
    }

    // リポストを作成
    const now = getCurrentTimestamp();
    const repostId = generateULID();

    const repostItem: RepostItem = {
      repost_id: repostId,
      account_id: accountId,
      original_post_id: request.post_id,
      original_author_id: originalPost.accountId,
      comment: request.comment,
      created_at: now,
      is_deleted: false,
    };

    // DynamoDBに保存
    await putItem({
      TableName: TableNames.REPOST,
      Item: repostItem,
    });

    // 元投稿のリポスト数をインクリメント
    await updateItem({
      TableName: TableNames.POST,
      Key: {
        postId: request.post_id,
      },
      UpdateExpression: 'SET repostCount = repostCount + :inc',
      ExpressionAttributeValues: {
        ':inc': 1,
      },
    });

    // レスポンス
    const response: CreateRepostResponse = {
      repost_id: repostId,
      account_id: accountId,
      original_post_id: request.post_id,
      original_author_id: originalPost.accountId,
      comment: request.comment,
      created_at: now,
    };

    return successResponse(response, 201);
  } catch (error: any) {
    logError(error as Error, { handler: 'createRepost' });

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
    return internalErrorResponse('リポスト作成中にエラーが発生しました');
  }
};
