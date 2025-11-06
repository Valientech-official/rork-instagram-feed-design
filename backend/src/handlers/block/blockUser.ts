/**
 * ユーザーブロックハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { BlockUserRequest, BlockUserResponse } from '../../types/api';
import { BlockItem, AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '../../lib/utils/response';
import { validateRequired } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, putItem, getItem } from '../../lib/dynamodb';

/**
 * ユーザーブロックLambda関数
 *
 * 指定したユーザーをブロック
 * - 自分自身をブロックすることはできない
 * - 既にブロック済みの場合も成功とする（冪等性）
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
    const request = parseRequestBody<BlockUserRequest>(event.body);

    // バリデーション
    validateRequired(request.blocked_account_id, 'ブロック対象アカウントID');

    // 自分自身をブロックすることはできない
    if (request.blocked_account_id === accountId) {
      return validationErrorResponse('自分自身をブロックすることはできません');
    }

    // ブロック対象のアカウントが存在するか確認
    const targetAccount = await getItem<AccountItem>({
      TableName: TableNames.ACCOUNT,
      Key: {
        PK: `ACCOUNT#${request.blocked_account_id}`,
        SK: 'PROFILE',
      },
    });

    if (!targetAccount) {
      return validationErrorResponse('ブロック対象のアカウントが見つかりません');
    }

    // ブロック情報を作成
    const now = getCurrentTimestamp();

    const blockItem: BlockItem = {
      blocker_account_id: accountId,
      blocked_account_id: request.blocked_account_id,
      blocked_at: now,
    };

    // DynamoDBに保存（既に存在する場合は上書き）
    await putItem({
      TableName: TableNames.BLOCK,
      Item: blockItem,
    });

    // レスポンス
    const response: BlockUserResponse = {
      blocker_account_id: accountId,
      blocked_account_id: request.blocked_account_id,
      blocked_at: now,
    };

    return successResponse(response, 201);
  } catch (error: any) {
    logError(error as Error, { handler: 'blockUser' });

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
    return internalErrorResponse('ブロック処理中にエラーが発生しました');
  }
};
