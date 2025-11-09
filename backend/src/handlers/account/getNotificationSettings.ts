/**
 * 通知設定取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  successResponse,
  internalErrorResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, getItem } from '../../lib/dynamodb';

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
 * 通知設定取得Lambda関数
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const accountId = event.requestContext.authorizer?.claims?.sub;

    if (!accountId) {
      return notFoundResponse('アカウントID');
    }

    // DynamoDBから通知設定を取得
    const settings = await getItem<{ settings: NotificationSettings }>({
      TableName: TableNames.ACCOUNT,
      Key: {
        PK: `ACCOUNT#${accountId}`,
        SK: 'SETTINGS#NOTIFICATIONS',
      },
    });

    // デフォルト設定
    const defaultSettings: NotificationSettings = {
      posts: {
        likes: true,
        comments: true,
        newFollowers: true,
      },
      messages: {
        messageRequests: true,
        directMessages: true,
      },
      liveVideo: {
        liveStreams: false,
        igtvUploads: false,
      },
      fromPiece: {
        productUpdates: true,
        newsAnnouncements: true,
      },
      email: {
        enabled: true,
        frequency: 'daily',
      },
      sms: {
        enabled: false,
      },
      pauseAll: false,
    };

    const preferences = settings?.settings || defaultSettings;

    return successResponse({
      preferences,
    });
  } catch (error: any) {
    logError(error as Error, { handler: 'getNotificationSettings' });

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

    return internalErrorResponse('通知設定取得中にエラーが発生しました');
  }
};
