/**
 * ユーザー推薦ハンドラー
 * 共通フォロワー、興味類似度に基づいておすすめユーザーを返す（簡略版）
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
} from '../../lib/utils/response';
import { validatePaginationLimit } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, query } from '../../lib/dynamodb';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const accountId = event.headers['x-account-id'];

    if (!accountId) {
      return unauthorizedResponse('アカウントIDが取得できません');
    }

    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 20;

    const validatedLimit = validatePaginationLimit(limit);

    // 簡略版: フォロー中ユーザーのフォロワーを取得
    // 実際には共通フォロワー数でスコアリング

    // 1. 自分のフォロー中ユーザーを取得
    const followingResult = await query({
      TableName: TableNames.FOLLOW,
      IndexName: 'GSI1',
      KeyConditionExpression: 'follower_id = :accountId',
      ExpressionAttributeValues: {
        ':accountId': accountId,
      },
      Limit: 50,
    });

    const followingIds = followingResult.items.map((item: any) => item.following_id);

    // 2. フォロー中ユーザーのフォロワーを取得（共通の友人）
    // 簡略化: 最初のフォロー対象のフォロワーを推薦
    if (followingIds.length === 0) {
      return successResponse({
        items: [],
        nextToken: undefined,
      });
    }

    const recommendedFollowersResult = await query({
      TableName: TableNames.FOLLOW,
      IndexName: 'GSI2',
      KeyConditionExpression: 'following_id = :followingId',
      ExpressionAttributeValues: {
        ':followingId': followingIds[0],
      },
      Limit: validatedLimit,
    });

    // アカウント情報を取得
    const recommendedAccountIds = recommendedFollowersResult.items
      .map((item: any) => item.follower_id)
      .filter((id: string) => id !== accountId && !followingIds.includes(id));

    const accountPromises = recommendedAccountIds.slice(0, validatedLimit).map((id: string) =>
      query<AccountItem>({
        TableName: TableNames.ACCOUNT,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `ACCOUNT#${id}`,
        },
        Limit: 1,
      })
    );

    const accountResults = await Promise.all(accountPromises);
    const recommendedAccounts = accountResults
      .map((result) => result.items[0])
      .filter(Boolean);

    return successResponse({
      items: recommendedAccounts,
      nextToken: undefined,
    });
  } catch (error: any) {
    logError(error as Error, { handler: 'getUserRecommendations' });
    return internalErrorResponse('ユーザー推薦取得中にエラーが発生しました');
  }
};
