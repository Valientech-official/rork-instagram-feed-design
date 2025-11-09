/**
 * ブロックリスト取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetBlockListResponse } from '../../types/api';
import { BlockItem, AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  unauthorizedResponse,
} from '../../lib/utils/response';
import { validatePaginationLimit } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, query, getItem } from '../../lib/dynamodb';

/**
 * ブロックリスト取得Lambda関数
 *
 * 自分がブロックしているユーザー一覧を取得
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

    // 自分がブロックしているユーザーを取得
    const result = await query<BlockItem>({
      TableName: TableNames.BLOCK,
      KeyConditionExpression: 'blocker_account_id = :accountId',
      ExpressionAttributeValues: {
        ':accountId': accountId,
      },
      ScanIndexForward: false, // 新しい順（blocked_at降順）
      Limit: validatedLimit,
      ExclusiveStartKey: nextToken
        ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
        : undefined,
    });

    // ブロックしたユーザーのアカウント情報を取得
    const blockedAccountIds = result.items.map((block) => block.blocked_account_id);
    const accountPromises = blockedAccountIds.map((id) =>
      getItem<AccountItem>({
        TableName: TableNames.ACCOUNT,
        Key: {
          PK: `ACCOUNT#${id}`,
          SK: 'PROFILE',
        },
      })
    );

    const accounts = await Promise.all(accountPromises);

    // ブロック情報とアカウント情報をマージ
    const blockedAccountsWithInfo = result.items
      .map((block) => {
        const account = accounts.find((acc) => acc?.account_id === block.blocked_account_id);

        if (!account) {
          return null;
        }

        return {
          account_id: account.account_id,
          username: account.username,
          handle: account.handle,
          profile_image: account.profile_image,
          blocked_at: block.blocked_at,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // 次のページのトークンを生成
    const nextTokenValue = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;

    // レスポンス
    const response: GetBlockListResponse = {
      items: blockedAccountsWithInfo,
      nextToken: nextTokenValue,
      total: undefined, // 全件数は計算コストが高いため省略
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getBlockList' });

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
    return internalErrorResponse('ブロックリスト取得中にエラーが発生しました');
  }
};
