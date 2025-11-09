/**
 * 通知設定取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  successResponse,
  internalErrorResponse,
  unauthorizedResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, getItem } from '../../lib/dynamodb';

interface NotificationSettingsItem {
  account_id: string;
  enable_push: boolean;
  enable_email: boolean;
  enable_follow: boolean;
  enable_like: boolean;
  enable_comment: boolean;
  enable_repost: boolean;
  enable_mention: boolean;
  enable_dm: boolean;
}

/**
 * 通知設定取得Lambda関数
 *
 * ユーザーの通知設定を取得
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

    // 通知設定を取得
    const settings = await getItem<NotificationSettingsItem>({
      TableName: TableNames.NOTIFICATION_SETTINGS,
      Key: {
        account_id: accountId,
      },
    });

    // 設定が存在しない場合はデフォルト値を返す
    if (!settings) {
      const defaultSettings = {
        account_id: accountId,
        enable_push: true,
        enable_email: true,
        enable_follow: true,
        enable_like: true,
        enable_comment: true,
        enable_repost: true,
        enable_mention: true,
        enable_dm: true,
      };

      return successResponse(defaultSettings);
    }

    // レスポンス
    return successResponse(settings);
  } catch (error: any) {
    logError(error as Error, { handler: 'getNotificationSettings' });

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
    return internalErrorResponse('通知設定取得中にエラーが発生しました');
  }
};
