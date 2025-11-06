/**
 * フォロワー一覧取得ハンドラー
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

interface FollowerAccount {
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

interface GetFollowersResponse {
  account_id: string;
  items: FollowerAccount[];
  nextToken?: string;
  total?: number;
}

/**
 * フォロワー一覧取得Lambda関数
 *
 * 指定ユーザーをフォローしているアカウント一覧を取得
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

    // GSI2でフォロワー一覧を取得（following_id + created_at）
    const result = await query({
      TableName: TableNames.FOLLOW,
      IndexName: 'GSI2',
      KeyConditionExpression: 'following_id = :followingId',
      ExpressionAttributeValues: {
        ':followingId': accountId,
      },
      ScanIndexForward: false, // 新しい順
      Limit: validatedLimit,
      ExclusiveStartKey: nextToken
        ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
        : undefined,
    });

    // フォロワーアカウントの情報を取得
    const followerIds = result.items.map((item: any) => item.follower_id);
    const accountPromises = followerIds.map((id: string) =>
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
    const followerAccounts = result.items
      .map((followItem: any) => {
        const account = accounts.find((acc) => acc?.account_id === followItem.follower_id);

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
      .filter((item): item is FollowerAccount => item !== null);

    // 次のページのトークンを生成
    const nextTokenValue = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;

    // レスポンス
    const response: GetFollowersResponse = {
      account_id: accountId,
      items: followerAccounts,
      nextToken: nextTokenValue,
      total: undefined,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getFollowers' });

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
    return internalErrorResponse('フォロワー一覧取得中にエラーが発生しました');
  }
};
