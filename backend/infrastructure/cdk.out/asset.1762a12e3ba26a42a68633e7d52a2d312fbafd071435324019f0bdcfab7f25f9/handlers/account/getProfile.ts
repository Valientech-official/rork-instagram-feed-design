/**
 * プロフィール取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetProfileResponse } from '../../types/api';
import { AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, getItem } from '../../lib/dynamodb';

/**
 * プロフィール取得Lambda関数
 * pathParametersから account_id を取得
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // パスパラメータから account_id を取得
    const accountId = event.pathParameters?.account_id;

    if (!accountId) {
      return notFoundResponse('アカウントID');
    }

    // DynamoDBからアカウント情報を取得
    const account = await getItem<AccountItem>({
      TableName: TableNames.ACCOUNT,
      Key: {
        PK: `ACCOUNT#${accountId}`,
        SK: 'PROFILE',
      },
    });

    if (!account) {
      return notFoundResponse('アカウント');
    }

    // レスポンス
    const response: GetProfileResponse = {
      account,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getProfile' });

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
    return internalErrorResponse('プロフィール取得中にエラーが発生しました');
  }
};
