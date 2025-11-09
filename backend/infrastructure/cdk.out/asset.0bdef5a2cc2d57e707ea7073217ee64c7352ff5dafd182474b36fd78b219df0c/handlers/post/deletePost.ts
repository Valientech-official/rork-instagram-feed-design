/**
 * 投稿削除ハンドラー（論理削除）
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { PostItem } from '../../types/dynamodb';
import {
  successResponse,
  getTTLTimestamp,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { ForbiddenError, logError } from '../../lib/utils/error';
import { TableNames, getItem, updateFields, decrementCounter } from '../../lib/dynamodb';

/**
 * 投稿削除Lambda関数
 * 論理削除（TTL 90日後に自動削除）
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

    // パスパラメータから post_id を取得
    const postId = event.pathParameters?.post_id;

    if (!postId) {
      return notFoundResponse('投稿ID');
    }

    // DynamoDBから投稿を取得
    const post = await getItem<PostItem>({
      TableName: TableNames.POST,
      Key: {
        postId,
      },
    });

    if (!post) {
      return notFoundResponse('投稿');
    }

    // すでに削除済みの場合
    if (post.isDeleted) {
      return notFoundResponse('投稿');
    }

    // 投稿者本人かチェック（管理者も許可する場合は条件を追加）
    if (post.accountId !== accountId) {
      throw new ForbiddenError('この投稿を削除する権限がありません');
    }

    // 論理削除（90日後に自動削除）
    const ttl = getTTLTimestamp(90);
    const now = getCurrentTimestamp();

    await updateFields(
      TableNames.POST,
      { postId },
      {
        isDeleted: true,
        deletedAt: now,
        ttl: ttl,
      }
    );

    // アカウントの投稿数をデクリメント（非同期）
    decrementCounter(
      TableNames.ACCOUNT,
      {
        PK: `ACCOUNT#${accountId}`,
        SK: 'PROFILE',
      },
      'post_count',
      1
    ).catch((err) => {
      console.warn('Failed to decrement post_count:', err);
    });

    return successResponse({ deleted: true });
  } catch (error: any) {
    logError(error as Error, { handler: 'deletePost' });

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
    return internalErrorResponse('投稿削除中にエラーが発生しました');
  }
};
