/**
 * ミュート解除ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, deleteItem, getItem } from '../../lib/dynamodb';

/**
 * ミュート解除Lambda関数
 *
 * 特定ユーザーのミュートを解除
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

    // パスパラメータからミュート対象アカウントIDを取得
    const mutedAccountId = event.pathParameters?.account_id;

    if (!mutedAccountId) {
      return notFoundResponse('アカウントID');
    }

    // ミュート情報が存在するか確認
    const muteItem = await getItem({
      TableName: TableNames.MUTED_ACCOUNTS,
      Key: {
        account_id: accountId,
        muted_account_id: mutedAccountId,
      },
    });

    if (!muteItem) {
      return notFoundResponse('ミュート情報');
    }

    // ミュート情報を削除
    await deleteItem({
      TableName: TableNames.MUTED_ACCOUNTS,
      Key: {
        account_id: accountId,
        muted_account_id: mutedAccountId,
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
    logError(error as Error, { handler: 'unmuteUser' });

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
    return internalErrorResponse('ミュート解除中にエラーが発生しました');
  }
};
