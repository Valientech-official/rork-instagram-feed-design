/**
 * セッション削除（ログアウト）ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { SessionItem } from '../../types/dynamodb';
import {
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, deleteItem, getItem } from '../../lib/dynamodb';

/**
 * セッション削除Lambda関数
 *
 * 特定のデバイスのセッションを削除（ログアウト）
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

    // パスパラメータからデバイスIDを取得
    const deviceId = event.pathParameters?.device_id;

    if (!deviceId) {
      return notFoundResponse('デバイスID');
    }

    // セッションが存在するか確認
    const session = await getItem<SessionItem>({
      TableName: TableNames.SESSION,
      Key: {
        PK: `SESSION#${accountId}`,
        SK: `DEVICE#${deviceId}`,
      },
    });

    if (!session) {
      return notFoundResponse('セッション');
    }

    // 自分のセッションであることを確認
    if (session.account_id !== accountId) {
      return forbiddenResponse('他のユーザーのセッションを削除することはできません');
    }

    // セッションを削除
    await deleteItem({
      TableName: TableNames.SESSION,
      Key: {
        PK: `SESSION#${accountId}`,
        SK: `DEVICE#${deviceId}`,
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
    logError(error as Error, { handler: 'logoutSession' });

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
    return internalErrorResponse('セッション削除中にエラーが発生しました');
  }
};
