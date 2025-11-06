/**
 * ルームメンバー一覧取得ハンドラー
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

interface RoomMember {
  account_id: string;
  username: string;
  handle: string;
  profile_image?: string;
  bio?: string;
  follower_count: number;
  following_count: number;
  is_private: boolean;
  joined_at: number;
  role?: string;
}

interface GetRoomMembersResponse {
  room_id: string;
  items: RoomMember[];
  nextToken?: string;
  total?: number;
}

/**
 * ルームメンバー一覧取得Lambda関数
 *
 * 特定ルームのメンバー一覧を取得
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // パスパラメータからルームIDを取得
    const roomId = event.pathParameters?.room_id;

    if (!roomId) {
      return notFoundResponse('ルームID');
    }

    // クエリパラメータを取得
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 50;
    const nextToken = event.queryStringParameters?.nextToken;

    // バリデーション
    const validatedLimit = validatePaginationLimit(limit);

    // ROOM_MEMBERテーブルからメンバーを取得（room_id）
    const result = await query({
      TableName: TableNames.ROOM_MEMBER,
      KeyConditionExpression: 'room_id = :roomId',
      ExpressionAttributeValues: {
        ':roomId': roomId,
      },
      ScanIndexForward: false, // 新しい順（SKがaccount_idなので実際は時系列ではない）
      Limit: validatedLimit,
      ExclusiveStartKey: nextToken
        ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
        : undefined,
    });

    // メンバーのアカウント情報を取得
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

    // メンバー情報とアカウント情報をマージ
    const roomMembers = result.items
      .map((memberItem: any) => {
        const account = accounts.find((acc) => acc?.account_id === memberItem.account_id);

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
          joined_at: memberItem.joined_at,
          role: memberItem.role,
        };
      })
      .filter((item): item is RoomMember => item !== null);

    // 次のページのトークンを生成
    const nextTokenValue = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;

    // レスポンス
    const response: GetRoomMembersResponse = {
      room_id: roomId,
      items: roomMembers,
      nextToken: nextTokenValue,
      total: undefined,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getRoomMembers' });

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
    return internalErrorResponse('ルームメンバー一覧取得中にエラーが発生しました');
  }
};
