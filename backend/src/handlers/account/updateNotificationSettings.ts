/**
 * 通知設定更新ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  successResponse,
  badRequestResponse,
  internalErrorResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, putItem } from '../../lib/dynamodb';

interface NotificationSettings {
  posts: {
    likes: boolean;
    comments: boolean;
    newFollowers: boolean;
  };
  messages: {
    messageRequests: boolean;
    directMessages: boolean;
  };
  liveVideo: {
    liveStreams: boolean;
    igtvUploads: boolean;
  };
  fromPiece: {
    productUpdates: boolean;
    newsAnnouncements: boolean;
  };
  email: {
    enabled: boolean;
    frequency: 'instant' | 'daily' | 'weekly';
  };
  sms: {
    enabled: boolean;
  };
  pauseAll: boolean;
}

/**
 * 通知設定更新Lambda関数
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const accountId = event.requestContext.authorizer?.claims?.sub;

    if (!accountId) {
      return notFoundResponse('アカウントID');
    }

    if (!event.body) {
      return badRequestResponse('リクエストボディが必要です');
    }

    const { preferences } = JSON.parse(event.body) as { preferences: NotificationSettings };

    if (!preferences) {
      return badRequestResponse('通知設定が必要です');
    }

    // 設定を検証
    if (
      !preferences.posts ||
      !preferences.messages ||
      !preferences.liveVideo ||
      !preferences.fromPiece ||
      !preferences.email ||
      !preferences.sms
    ) {
      return badRequestResponse('通知設定の形式が正しくありません');
    }

    // DynamoDBに保存
    await putItem({
      TableName: TableNames.ACCOUNT,
      Item: {
        PK: `ACCOUNT#${accountId}`,
        SK: 'SETTINGS#NOTIFICATIONS',
        settings: preferences,
        updatedAt: new Date().toISOString(),
      },
    });

    return successResponse({
      message: '通知設定を更新しました',
      preferences,
    });
  } catch (error: any) {
    logError(error as Error, { handler: 'updateNotificationSettings' });

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

    return internalErrorResponse('通知設定更新中にエラーが発生しました');
  }
};
