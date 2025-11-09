/**
 * プライバシーポリシー承認ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  successResponse,
  internalErrorResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, putItem } from '../../lib/dynamodb';

/**
 * プライバシーポリシー承認Lambda関数
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const accountId = event.requestContext.authorizer?.claims?.sub;

    if (!accountId) {
      return notFoundResponse('アカウントID');
    }

    const timestamp = new Date().toISOString();
    const version = event.body ? JSON.parse(event.body).version : 'latest';

    // DynamoDBに承認記録を保存
    await putItem({
      TableName: TableNames.ACCOUNT,
      Item: {
        PK: `ACCOUNT#${accountId}`,
        SK: 'LEGAL#PRIVACY',
        acceptedAt: timestamp,
        version,
        ipAddress: event.requestContext.identity?.sourceIp,
        userAgent: event.requestContext.identity?.userAgent,
      },
    });

    return successResponse({
      message: 'プライバシーポリシーを承認しました',
      acceptedAt: timestamp,
      version,
    });
  } catch (error: any) {
    logError(error as Error, { handler: 'acceptPrivacyPolicy' });

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

    return internalErrorResponse('プライバシーポリシー承認中にエラーが発生しました');
  }
};
