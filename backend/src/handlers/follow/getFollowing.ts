/**
 * フォロー中一覧取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { validatePaginationLimit } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, query, getItem } from '../../lib/dynamodb';

interface FollowingAccount {
  account_id: string;
  username: string;
  handle: string;
  profile_image?: string;
  bio?: string;
  follower_count: number;
  following_count: number;
  is_private: boolean;
  followed_at: number;
}

interface GetFollowingResponse {
  account_id: string;
  items: FollowingAccount[];
  nextToken?: string;
  total?: number;
}

/**
 * フォロー中一覧取得Lambda関数
 *
 * 指定ユーザーがフォローしているアカウント一覧を取得
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // パスパラメータからアカウントIDを取得
    const accountId = event.pathParameters?.account_id;

    if (!accountId) {
      return notFoundResponse('アカウントID');
    }

    // クエリパラメータを取得
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 50;
    const nextToken = event.queryStringParameters?.nextToken;

    // バリデーション
    const validatedLimit = validatePaginationLimit(limit);

    // GSI1でフォロー中一覧を取得（follower_id + created_at）
    const result = await query({
      TableName: TableNames.FOLLOW,
      IndexName: 'GSI1',
      KeyConditionExpression: 'follower_id = :followerId',
      ExpressionAttributeValues: {
        ':followerId': accountId,
      },
      ScanIndexForward: false, // 新しい順
      Limit: validatedLimit,
      ExclusiveStartKey: nextToken
        ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
        : undefined,
    });

    // フォローしているアカウントの情報を取得
    const followingIds = result.items.map((item: any) => item.following_id);
    const accountPromises = followingIds.map((id: string) =>
      getItem<AccountItem>({
        TableName: TableNames.ACCOUNT,
        Key: {
          PK: `ACCOUNT#${id}`,
          SK: 'PROFILE',
        },
      })
    );

    const accounts = await Promise.all(accountPromises);

    // フォロー情報とアカウント情報をマージ
    const followingAccounts = result.items
      .map((followItem: any) => {
        const account = accounts.find((acc) => acc?.account_id === followItem.following_id);

        if (!account) {
          return null;
        }

        return {
          account_id: account.account_id,
          username: account.username,
          handle: account.handle,
          profile_image: account.profile_image,
          bio: account.bio,
          follower_count: account.follower_count,
          following_count: account.following_count,
          is_private: account.is_private,
          followed_at: followItem.created_at,
        };
      })
      .filter((item): item is FollowingAccount => item !== null);

    // 次のページのトークンを生成
    const nextTokenValue = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;

    // レスポンス
    const response: GetFollowingResponse = {
      account_id: accountId,
      items: followingAccounts,
      nextToken: nextTokenValue,
      total: undefined,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getFollowing' });

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
    return internalErrorResponse('フォロー中一覧取得中にエラーが発生しました');
  }
};
