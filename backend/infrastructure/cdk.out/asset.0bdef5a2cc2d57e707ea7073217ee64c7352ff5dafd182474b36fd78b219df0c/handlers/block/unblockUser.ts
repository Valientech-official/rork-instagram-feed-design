/**
 * ブロック解除ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { BlockItem } from '../../types/dynamodb';
import {
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, deleteItem, getItem } from '../../lib/dynamodb';

/**
 * ブロック解除Lambda関数
 *
 * 指定したユーザーのブロックを解除
 * - ブロックしていない場合は404を返す
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

    // パスパラメータからブロック対象アカウントIDを取得
    const blockedAccountId = event.pathParameters?.account_id;

    if (!blockedAccountId) {
      return notFoundResponse('アカウントID');
    }

    // ブロック情報が存在するか確認
    const blockItem = await getItem<BlockItem>({
      TableName: TableNames.BLOCK,
      Key: {
        blocker_account_id: accountId,
        blocked_account_id: blockedAccountId,
      },
    });

    if (!blockItem) {
      return notFoundResponse('ブロック情報');
    }

    // ブロック情報を削除
    await deleteItem({
      TableName: TableNames.BLOCK,
      Key: {
        blocker_account_id: accountId,
        blocked_account_id: blockedAccountId,
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
    logError(error as Error, { handler: 'unblockUser' });

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
    return internalErrorResponse('ブロック解除中にエラーが発生しました');
  }
};
