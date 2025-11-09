/**
 * ユーザーミュートハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
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
import { AccountItem } from '../../types/dynamodb';

interface MuteUserRequest {
  muted_account_id: string;
}

interface MuteUserResponse {
  account_id: string;
  muted_account_id: string;
  muted_at: number;
}

/**
 * ユーザーミュートLambda関数
 *
 * 特定ユーザーをミュート（投稿がタイムラインに表示されなくなる）
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
    const request = parseRequestBody<MuteUserRequest>(event.body);

    // バリデーション
    validateRequired(request.muted_account_id, 'ミュート対象アカウントID');

    // 自分自身をミュートすることはできない
    if (request.muted_account_id === accountId) {
      return validationErrorResponse('自分自身をミュートすることはできません');
    }

    // ミュート対象のアカウントが存在するか確認
    const targetAccount = await getItem<AccountItem>({
      TableName: TableNames.ACCOUNT,
      Key: {
        PK: `ACCOUNT#${request.muted_account_id}`,
        SK: 'PROFILE',
      },
    });

    if (!targetAccount) {
      return validationErrorResponse('ミュート対象のアカウントが見つかりません');
    }

    // ミュート情報を作成
    const now = getCurrentTimestamp();

    const muteItem = {
      account_id: accountId,
      muted_account_id: request.muted_account_id,
      muted_at: now,
    };

    // DynamoDBに保存（既に存在する場合は上書き）
    await putItem({
      TableName: TableNames.MUTED_ACCOUNTS,
      Item: muteItem,
    });

    // レスポンス
    const response: MuteUserResponse = {
      account_id: accountId,
      muted_account_id: request.muted_account_id,
      muted_at: now,
    };

    return successResponse(response, 201);
  } catch (error: any) {
    logError(error as Error, { handler: 'muteUser' });

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
    return internalErrorResponse('ミュート処理中にエラーが発生しました');
  }
};
