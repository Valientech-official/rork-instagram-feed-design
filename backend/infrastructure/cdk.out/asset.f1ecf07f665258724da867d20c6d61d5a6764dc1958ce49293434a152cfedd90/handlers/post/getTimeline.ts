/**
 * タイムライン取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetTimelineResponse, AccountSummary } from '../../types/api';
import { PostItem, AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  unauthorizedResponse,
} from '../../lib/utils/response';
import { validatePaginationLimit } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, query, getItem } from '../../lib/dynamodb';

/**
 * タイムライン取得Lambda関数
 *
 * 注: 実際のタイムラインは複雑なロジックが必要
 * - フォローしているアカウントの投稿を取得
 * - 複数アカウントの投稿をマージしてソート
 * - ここでは簡略化して、公開投稿を新しい順に取得
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
      : 20;
    const nextToken = event.queryStringParameters?.nextToken;

    // バリデーション
    const validatedLimit = validatePaginationLimit(limit);

    // 公開投稿を取得（GSI2: visibility + createdAt）
    // 実際には、フォローしているアカウントの投稿を取得する必要がある
    const result = await query<PostItem>({
      TableName: TableNames.POST,
      IndexName: 'GSI2',
      KeyConditionExpression: 'visibility = :visibility',
      ExpressionAttributeValues: {
        ':visibility': 'public',
        ':false': false,
      },
      FilterExpression: 'isDeleted = :false',
      ScanIndexForward: false, // 新しい順
      Limit: validatedLimit,
      ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) : undefined,
    });

    // 投稿者のアカウント情報を取得
    const accountIds = [...new Set(result.items.map((post) => post.accountId))];
    const accountPromises = accountIds.map((id) =>
      getItem<AccountItem>({
        TableName: TableNames.ACCOUNT,
        Key: {
          PK: `ACCOUNT#${id}`,
          SK: 'PROFILE',
        },
      })
    );

    const accounts = await Promise.all(accountPromises);
    const accountMap = new Map<string, AccountItem>();

    accounts.forEach((account) => {
      if (account) {
        accountMap.set(account.account_id, account);
      }
    });

    // 投稿にアカウント情報を付与
    const postsWithAuthor = result.items.map((post) => {
      const account = accountMap.get(post.accountId);

      if (!account) {
        return null;
      }

      const accountSummary: AccountSummary = {
        account_id: account.account_id,
        username: account.username,
        handle: account.handle,
        profile_image: account.profile_image,
        account_type: account.account_type,
        is_private: account.is_private,
      };

      return {
        ...post,
        author: accountSummary,
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    // 次のページのトークンを生成
    const nextTokenValue = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;

    // レスポンス
    const response: GetTimelineResponse = {
      items: postsWithAuthor,
      nextToken: nextTokenValue,
      total: undefined, // 全件数は計算コストが高いため省略
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getTimeline' });

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
    return internalErrorResponse('タイムライン取得中にエラーが発生しました');
  }
};
