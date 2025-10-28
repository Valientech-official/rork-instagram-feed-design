/**
 * コメント削除ハンドラー（ハイブリッド削除）
 * ユーザー削除 = 物理削除
 * 運営削除 = 論理削除（TTL 90日後に自動削除）
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { CommentItem } from '../../types/dynamodb';
import {
  successResponse,
  getTTLTimestamp,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { ForbiddenError, logError } from '../../lib/utils/error';
import { TableNames, getItem, deleteItem, updateFields, decrementCounter } from '../../lib/dynamodb';

/**
 * コメント削除Lambda関数
 * ハイブリッド削除:
 * - ユーザー本人の削除 → 物理削除（DynamoDBから完全削除）
 * - 管理者の削除 → 論理削除（TTL 90日後に自動削除）
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // TODO: JWTトークンから account_id と account_type を取得
    // const accountId = event.requestContext.authorizer?.claims?.sub;
    // const accountType = event.requestContext.authorizer?.claims?.account_type;

    // 現在はヘッダーから取得（開発用）
    const accountId = event.headers['x-account-id'];
    const accountType = event.headers['x-account-type'] || 'personal'; // 開発用

    if (!accountId) {
      return unauthorizedResponse('アカウントIDが取得できません');
    }

    // パスパラメータから comment_id を取得
    const commentId = event.pathParameters?.comment_id;

    if (!commentId) {
      return notFoundResponse('コメントID');
    }

    // DynamoDBからコメントを取得
    const comment = await getItem<CommentItem>({
      TableName: TableNames.COMMENT,
      Key: {
        comment_id: commentId,
      },
    });

    if (!comment) {
      return notFoundResponse('コメント');
    }

    // すでに削除済みの場合
    if (comment.is_deleted) {
      return notFoundResponse('コメント');
    }

    // 権限チェック
    const isOwner = comment.account_id === accountId;
    const isAdmin = accountType === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('このコメントを削除する権限がありません');
    }

    const now = getCurrentTimestamp();

    // ユーザー本人による削除 → 物理削除
    if (isOwner && !isAdmin) {
      await deleteItem({
        TableName: TableNames.COMMENT,
        Key: {
          comment_id: commentId,
        },
      });
    }
    // 管理者による削除 → 論理削除（TTL 90日）
    else if (isAdmin) {
      const ttl = getTTLTimestamp(90);

      await updateFields(
        TableNames.COMMENT,
        { comment_id: commentId },
        {
          is_deleted: true,
          deleted_at: now,
          deleted_by_admin: accountId,
          delete_reason: event.queryStringParameters?.reason || '管理者により削除',
          ttl: ttl,
        }
      );
    }

    // 投稿のコメント数をデクリメント（非同期）
    decrementCounter(
      TableNames.POST,
      { postId: comment.post_id },
      'commentCount',
      1
    ).catch((err) => {
      console.warn('Failed to decrement commentCount:', err);
    });

    // 親コメントがある場合、親コメントのreply_countをデクリメント（非同期）
    if (comment.parent_comment_id) {
      decrementCounter(
        TableNames.COMMENT,
        { comment_id: comment.parent_comment_id },
        'reply_count',
        1
      ).catch((err) => {
        console.warn('Failed to decrement reply_count:', err);
      });
    }

    return successResponse({
      deleted: true,
      deletion_type: isOwner && !isAdmin ? 'physical' : 'logical',
    });
  } catch (error: any) {
    logError(error as Error, { handler: 'deleteComment' });

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
    return internalErrorResponse('コメント削除中にエラーが発生しました');
  }
};
