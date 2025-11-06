/**
 * ミュートリスト取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  unauthorizedResponse,
} from '../../lib/utils/response';
import { validatePaginationLimit } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, query, getItem } from '../../lib/dynamodb';

interface MutedAccount {
  account_id: string;
  username: string;
  handle: string;
  profile_image?: string;
  muted_at: number;
}

interface GetMutedUsersResponse {
  items: MutedAccount[];
  nextToken?: string;
  total?: number;
}

/**
 * ミュートリスト取得Lambda関数
 *
 * 自分がミュートしているユーザー一覧を取得
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

    // クエリパラメータを取得
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 50;
    const nextToken = event.queryStringParameters?.nextToken;

    // バリデーション
    const validatedLimit = validatePaginationLimit(limit);

    // 自分がミュートしているユーザーを取得
    const result = await query({
      TableName: TableNames.MUTED_ACCOUNTS,
      KeyConditionExpression: 'account_id = :accountId',
      ExpressionAttributeValues: {
        ':accountId': accountId,
      },
      ScanIndexForward: false, // 新しい順
      Limit: validatedLimit,
      ExclusiveStartKey: nextToken
        ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
        : undefined,
    });

    // ミュートしたユーザーのアカウント情報を取得
    const mutedAccountIds = result.items.map((item: any) => item.muted_account_id);
    const accountPromises = mutedAccountIds.map((id: string) =>
      getItem<AccountItem>({
        TableName: TableNames.ACCOUNT,
        Key: {
          PK: `ACCOUNT#${id}`,
          SK: 'PROFILE',
        },
      })
    );

    const accounts = await Promise.all(accountPromises);

    // ミュート情報とアカウント情報をマージ
    const mutedAccountsWithInfo = result.items
      .map((muteItem: any) => {
        const account = accounts.find((acc) => acc?.account_id === muteItem.muted_account_id);

        if (!account) {
          return null;
        }

        return {
          account_id: account.account_id,
          username: account.username,
          handle: account.handle,
          profile_image: account.profile_image,
          muted_at: muteItem.muted_at,
        };
      })
      .filter((item): item is MutedAccount => item !== null);

    // 次のページのトークンを生成
    const nextTokenValue = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;

    // レスポンス
    const response: GetMutedUsersResponse = {
      items: mutedAccountsWithInfo,
      nextToken: nextTokenValue,
      total: undefined,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getMutedUsers' });

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
    return internalErrorResponse('ミュートリスト取得中にエラーが発生しました');
  }
};
