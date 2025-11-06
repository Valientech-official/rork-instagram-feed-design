/**
 * リポスト削除ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { RepostItem } from '../../types/dynamodb';
import {
  successResponse,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, updateItem, getItemRequired } from '../../lib/dynamodb';

/**
 * リポスト削除Lambda関数
 *
 * 自分のリポストを削除する（論理削除）
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

    // パスパラメータからリポストIDを取得
    const repostId = event.pathParameters?.repost_id;

    if (!repostId) {
      return notFoundResponse('リポストID');
    }

    // リポストが存在するか確認
    const repost = await getItemRequired<RepostItem>(
      {
        TableName: TableNames.REPOST,
        Key: {
          repost_id: repostId,
        },
      },
      'リポスト'
    );

    // 自分のリポストであることを確認
    if (repost.account_id !== accountId) {
      return forbiddenResponse('他のユーザーのリポストは削除できません');
    }

    // 既に削除済みの場合はエラー
    if (repost.is_deleted) {
      return forbiddenResponse('既に削除されたリポストです');
    }

    // リポストを論理削除
    const now = getCurrentTimestamp();

    await updateItem({
      TableName: TableNames.REPOST,
      Key: {
        repost_id: repostId,
      },
      UpdateExpression: 'SET is_deleted = :isDeleted, updated_at = :updatedAt',
      ExpressionAttributeValues: {
        ':isDeleted': true,
        ':updatedAt': now,
      },
    });

    // 元投稿のリポスト数をデクリメント
    await updateItem({
      TableName: TableNames.POST,
      Key: {
        postId: repost.original_post_id,
      },
      UpdateExpression: 'SET repostCount = if_not_exists(repostCount, :zero) - :dec',
      ExpressionAttributeValues: {
        ':dec': 1,
        ':zero': 0,
      },
    });

    // レスポンス（204 No Content）
    return {
      statusCode: 204,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: '',
    };
  } catch (error: any) {
    logError(error as Error, { handler: 'deleteRepost' });

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
    return internalErrorResponse('リポスト削除中にエラーが発生しました');
  }
};
