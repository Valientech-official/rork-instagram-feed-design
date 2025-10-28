/**
 * フォロー追加ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { FollowUserRequest, FollowUserResponse } from '../../types/api';
import { FollowItem, AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
} from '../../lib/utils/response';
import { validateRequired } from '../../lib/validators';
import { DuplicateFollowError, logError } from '../../lib/utils/error';
import { TableNames, putItem, getItemRequired, query, incrementCounter } from '../../lib/dynamodb';

/**
 * フォロー追加Lambda関数
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
    validateRequired(request.following_id, 'フォロー対象アカウントID');

    // 自分自身をフォローできない
    if (accountId === request.following_id) {
      throw new Error('自分自身をフォローすることはできません');
    }

    // フォロー対象のアカウントが存在するか確認
    await getItemRequired<AccountItem>(
      {
        TableName: TableNames.ACCOUNT,
        Key: {
          PK: `ACCOUNT#${request.following_id}`,
          SK: 'PROFILE',
        },
      },
      'フォロー対象アカウント'
    );

    // 既にフォローしているかチェック（GSI1で検索）
    const existingFollow = await query({
      TableName: TableNames.FOLLOW,
      IndexName: 'GSI1',
      KeyConditionExpression: 'follower_id = :followerId AND following_id = :followingId',
      ExpressionAttributeValues: {
        ':followerId': accountId,
        ':followingId': request.following_id,
      },
      Limit: 1,
    });

    if (existingFollow.items.length > 0) {
      throw new DuplicateFollowError();
    }

    // 相互フォローかチェック（相手が自分をフォローしているか）
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

    const isMutual = reverseFollow.items.length > 0;
    const now = getCurrentTimestamp();

    // フォローアイテムを作成
    const followItem: FollowItem = {
      follower_id: accountId,
      following_id: request.following_id,
      created_at: now,
      is_mutual: isMutual,
      is_blocked: false,
    };

    // DynamoDBに保存
    await putItem({
      TableName: TableNames.FOLLOW,
      Item: followItem,
    });

    // 相互フォローになった場合、相手側のis_mutualも更新
    if (isMutual && reverseFollow.items.length > 0) {
      const reverseFollowItem = reverseFollow.items[0];
      await putItem({
        TableName: TableNames.FOLLOW,
        Item: {
          ...reverseFollowItem,
          is_mutual: true,
        },
      });
    }

    // フォロワー数とフォロー中数を更新（並列実行）
    await Promise.all([
      // フォローされた側のフォロワー数をインクリメント
      incrementCounter(
        TableNames.ACCOUNT,
        {
          PK: `ACCOUNT#${request.following_id}`,
          SK: 'PROFILE',
        },
        'follower_count',
        1
      ),
      // フォローした側のフォロー中数をインクリメント
      incrementCounter(
        TableNames.ACCOUNT,
        {
          PK: `ACCOUNT#${accountId}`,
          SK: 'PROFILE',
        },
        'following_count',
        1
      ),
    ]);

    // レスポンス
    const response: FollowUserResponse = {
      followed: true,
      is_mutual: isMutual,
    };

    return successResponse(response, 201);
  } catch (error: any) {
    logError(error as Error, { handler: 'followUser' });

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
    return internalErrorResponse('フォロー追加中にエラーが発生しました');
  }
};
