/**
 * フォロー解除ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { FollowUserRequest, FollowUserResponse } from '../../types/api';
import { FollowItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { validateRequired } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, query, deleteItem, decrementCounter, putItem } from '../../lib/dynamodb';

/**
 * フォロー解除Lambda関数
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
    const request = parseRequestBody<FollowUserRequest>(event.body);

    // バリデーション
    validateRequired(request.following_id, 'フォロー解除対象アカウントID');

    // フォロー関係を検索（GSI1を使用）
    const result = await query<FollowItem>({
      TableName: TableNames.FOLLOW,
      IndexName: 'GSI1',
      KeyConditionExpression: 'follower_id = :followerId AND following_id = :followingId',
      ExpressionAttributeValues: {
        ':followerId': accountId,
        ':followingId': request.following_id,
      },
      Limit: 1,
    });

    if (result.items.length === 0) {
      return notFoundResponse('フォロー関係');
    }

    const follow = result.items[0];
    const wasMutual = follow.is_mutual;

    // フォロー関係を削除（複合キー）
    await deleteItem({
      TableName: TableNames.FOLLOW,
      Key: {
        follower_id: follow.follower_id,
        following_id: follow.following_id,
      },
    });

    // 相互フォローだった場合、相手側のis_mutualをfalseに更新
    if (wasMutual) {
      const reverseFollow = await query<FollowItem>({
        TableName: TableNames.FOLLOW,
        IndexName: 'GSI1',
        KeyConditionExpression: 'follower_id = :followerId AND following_id = :followingId',
        ExpressionAttributeValues: {
          ':followerId': request.following_id,
          ':followingId': accountId,
        },
        Limit: 1,
      });

      if (reverseFollow.items.length > 0) {
        const reverseFollowItem = reverseFollow.items[0];
        await putItem({
          TableName: TableNames.FOLLOW,
          Item: {
            ...reverseFollowItem,
            is_mutual: false,
          },
        });
      }
    }

    // フォロワー数とフォロー中数を更新（並列実行）
    await Promise.all([
      // フォローされていた側のフォロワー数をデクリメント
      decrementCounter(
        TableNames.ACCOUNT,
        {
          PK: `ACCOUNT#${request.following_id}`,
          SK: 'PROFILE',
        },
        'follower_count',
        1
      ).catch((err) => {
        console.warn('Failed to decrement follower_count:', err);
      }),
      // フォローしていた側のフォロー中数をデクリメント
      decrementCounter(
        TableNames.ACCOUNT,
        {
          PK: `ACCOUNT#${accountId}`,
          SK: 'PROFILE',
        },
        'following_count',
        1
      ).catch((err) => {
        console.warn('Failed to decrement following_count:', err);
      }),
    ]);

    // レスポンス
    const response: FollowUserResponse = {
      followed: false,
      is_mutual: false,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'unfollowUser' });

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
    return internalErrorResponse('フォロー解除中にエラーが発生しました');
  }
};
