/**
 * 全通知既読ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { NotificationItem } from '../../types/dynamodb';
import {
  successResponse,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, query, updateItem } from '../../lib/dynamodb';

/**
 * 全通知既読Lambda関数
 *
 * ユーザーの全ての未読通知を既読にする
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

    // 未読通知を全て取得
    const result = await query<NotificationItem>({
      TableName: TableNames.NOTIFICATION,
      IndexName: 'GSI_unread_notifications',
      KeyConditionExpression: 'recipient_account_id = :accountId',
      FilterExpression: 'is_read = :isRead',
      ExpressionAttributeValues: {
        ':accountId': accountId,
        ':isRead': false,
      },
    });

    // 全ての未読通知を既読にする
    const now = getCurrentTimestamp();
    const updatePromises = result.items.map((notification) =>
      updateItem({
        TableName: TableNames.NOTIFICATION,
        Key: {
          notification_id: notification.notification_id,
        },
        UpdateExpression: 'SET is_read = :isRead, read_at = :readAt',
        ExpressionAttributeValues: {
          ':isRead': true,
          ':readAt': now,
        },
      })
    );

    await Promise.all(updatePromises);

    // レスポンス
    return successResponse({
      success: true,
      updated_count: result.items.length,
    });
  } catch (error: any) {
    logError(error as Error, { handler: 'markAllAsRead' });

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
    return internalErrorResponse('全通知既読処理中にエラーが発生しました');
  }
};
