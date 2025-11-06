/**
 * 投稿のいいね一覧取得ハンドラー
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

interface LikeAccount {
  account_id: string;
  username: string;
  handle: string;
  profile_image?: string;
  bio?: string;
  follower_count: number;
  following_count: number;
  is_private: boolean;
  liked_at: number;
}

interface GetPostLikesResponse {
  post_id: string;
  items: LikeAccount[];
  nextToken?: string;
  total?: number;
}

/**
 * 投稿のいいね一覧取得Lambda関数
 *
 * 特定投稿にいいねしたアカウント一覧を取得
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // パスパラメータから投稿IDを取得
    const postId = event.pathParameters?.post_id;

    if (!postId) {
      return notFoundResponse('投稿ID');
    }

    // クエリパラメータを取得
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 50;
    const nextToken = event.queryStringParameters?.nextToken;

    // バリデーション
    const validatedLimit = validatePaginationLimit(limit);

    // LIKEテーブルから投稿へのいいねを取得（post_id）
    const result = await query({
      TableName: TableNames.LIKE,
      KeyConditionExpression: 'post_id = :postId',
      ExpressionAttributeValues: {
        ':postId': postId,
      },
      ScanIndexForward: false, // 新しい順（SKがaccount_idなので時系列ではない）
      Limit: validatedLimit,
      ExclusiveStartKey: nextToken
        ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
        : undefined,
    });

    // いいねしたアカウントの情報を取得
    const accountIds = result.items.map((item: any) => item.account_id);
    const accountPromises = accountIds.map((id: string) =>
      getItem<AccountItem>({
        TableName: TableNames.ACCOUNT,
        Key: {
          PK: `ACCOUNT#${id}`,
          SK: 'PROFILE',
        },
      })
    );

    const accounts = await Promise.all(accountPromises);

    // いいね情報とアカウント情報をマージ
    const likeAccounts = result.items
      .map((likeItem: any) => {
        const account = accounts.find((acc) => acc?.account_id === likeItem.account_id);

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
          liked_at: likeItem.created_at,
        };
      })
      .filter((item): item is LikeAccount => item !== null);

    // 次のページのトークンを生成
    const nextTokenValue = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;

    // レスポンス
    const response: GetPostLikesResponse = {
      post_id: postId,
      items: likeAccounts,
      nextToken: nextTokenValue,
      total: undefined,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getPostLikes' });

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
    return internalErrorResponse('投稿のいいね一覧取得中にエラーが発生しました');
  }
};
