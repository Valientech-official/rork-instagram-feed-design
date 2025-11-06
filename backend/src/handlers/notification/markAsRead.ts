/**
 * 通知既読ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { NotificationItem } from '../../types/dynamodb';
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
 * 通知既読Lambda関数
 *
 * 特定の通知を既読にする
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

    // パスパラメータから通知IDを取得
    const notificationId = event.pathParameters?.notification_id;

    if (!notificationId) {
      return notFoundResponse('通知ID');
    }

    // 通知が存在するか確認
    const notification = await getItemRequired<NotificationItem>(
      {
        TableName: TableNames.NOTIFICATION,
        Key: {
          notification_id: notificationId,
        },
      },
      '通知'
    );

    // 自分の通知であることを確認
    if (notification.recipient_account_id !== accountId) {
      return forbiddenResponse('他のユーザーの通知を既読にすることはできません');
    }

    // 既に既読の場合はそのまま成功を返す（冪等性）
    if (notification.is_read) {
      return successResponse({ success: true });
    }

    // 通知を既読にする
    const now = getCurrentTimestamp();

    await updateItem({
      TableName: TableNames.NOTIFICATION,
      Key: {
        notification_id: notificationId,
      },
      UpdateExpression: 'SET is_read = :isRead, read_at = :readAt',
      ExpressionAttributeValues: {
        ':isRead': true,
        ':readAt': now,
      },
    });

    // レスポンス
    return successResponse({ success: true });
  } catch (error: any) {
    logError(error as Error, { handler: 'markAsRead' });

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
    return internalErrorResponse('通知既読処理中にエラーが発生しました');
  }
};
