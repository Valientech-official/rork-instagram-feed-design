/**
 * サポートチケット作成ハンドラー
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
import { v4 as uuidv4 } from 'uuid';

interface SupportTicket {
  type: 'crash' | 'feature' | 'bug' | 'other';
  subject?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  systemInfo?: {
    platform: string;
    platformVersion: string | number;
    appVersion: string;
    deviceModel?: string;
    deviceYear?: number;
  };
}

/**
 * サポートチケット作成Lambda関数
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

    const ticket: SupportTicket = JSON.parse(event.body);

    if (!ticket.type) {
      return badRequestResponse('チケットタイプが必要です');
    }

    const ticketId = uuidv4();
    const timestamp = new Date().toISOString();

    // DynamoDBに保存
    await putItem({
      TableName: TableNames.SUPPORT,
      Item: {
        PK: `TICKET#${ticketId}`,
        SK: 'METADATA',
        ticketId,
        accountId,
        type: ticket.type,
        subject: ticket.subject || `${ticket.type} issue`,
        description: ticket.description || '',
        priority: ticket.priority || 'medium',
        status: 'open',
        systemInfo: ticket.systemInfo,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    });

    // アカウントのチケット履歴にも追加
    await putItem({
      TableName: TableNames.ACCOUNT,
      Item: {
        PK: `ACCOUNT#${accountId}`,
        SK: `TICKET#${ticketId}`,
        ticketId,
        type: ticket.type,
        status: 'open',
        createdAt: timestamp,
      },
    });

    return successResponse({
      message: 'サポートチケットを作成しました',
      ticketId,
      status: 'open',
    });
  } catch (error: any) {
    logError(error as Error, { handler: 'createSupportTicket' });

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

    return internalErrorResponse('サポートチケット作成中にエラーが発生しました');
  }
};
