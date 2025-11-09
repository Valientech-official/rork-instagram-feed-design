/**
 * 通知設定更新ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  successResponse,
  parseRequestBody,
  internalErrorResponse,
  unauthorizedResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, putItem } from '../../lib/dynamodb';

interface UpdateNotificationSettingsRequest {
  enable_push?: boolean;
  enable_email?: boolean;
  enable_follow?: boolean;
  enable_like?: boolean;
  enable_comment?: boolean;
  enable_repost?: boolean;
  enable_mention?: boolean;
  enable_dm?: boolean;
}

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
 * 通知設定更新Lambda関数
 *
 * ユーザーの通知設定を更新
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
    const request = parseRequestBody<UpdateNotificationSettingsRequest>(event.body);

    // 通知設定を更新（部分更新対応）
    const settings: NotificationSettingsItem = {
      account_id: accountId,
      enable_push: request.enable_push !== undefined ? request.enable_push : true,
      enable_email: request.enable_email !== undefined ? request.enable_email : true,
      enable_follow: request.enable_follow !== undefined ? request.enable_follow : true,
      enable_like: request.enable_like !== undefined ? request.enable_like : true,
      enable_comment: request.enable_comment !== undefined ? request.enable_comment : true,
      enable_repost: request.enable_repost !== undefined ? request.enable_repost : true,
      enable_mention: request.enable_mention !== undefined ? request.enable_mention : true,
      enable_dm: request.enable_dm !== undefined ? request.enable_dm : true,
    };

    // DynamoDBに保存
    await putItem({
      TableName: TableNames.NOTIFICATION_SETTINGS,
      Item: settings,
    });

    // レスポンス
    return successResponse(settings);
  } catch (error: any) {
    logError(error as Error, { handler: 'updateNotificationSettings' });

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
    return internalErrorResponse('通知設定更新中にエラーが発生しました');
  }
};
