/**
 * ROOM参加ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { JoinRoomRequest, JoinRoomResponse } from '../../types/api';
import { RoomItem, RoomMemberItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
} from '../../lib/utils/response';
import { validateRequired } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, putItem, getItemRequired, query, incrementCounter } from '../../lib/dynamodb';

/**
 * ROOM参加Lambda関数
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
    const request = parseRequestBody<JoinRoomRequest>(event.body);

    // バリデーション
    validateRequired(request.room_id, 'ROOM ID');

    // ROOMが存在するか確認
    const room = await getItemRequired<RoomItem>(
      {
        TableName: TableNames.ROOM,
        Key: {
          room_id: request.room_id,
        },
      },
      'ROOM'
    );

    // ROOMが有効かチェック
    if (!room.is_active) {
      throw new Error('このROOMは現在参加できません');
    }

    // 既に参加しているかチェック（GSI1で検索）
    const existingMember = await query<RoomMemberItem>({
      TableName: TableNames.ROOM_MEMBER,
      IndexName: 'GSI1',
      KeyConditionExpression: 'account_id = :accountId AND room_id = :roomId',
      ExpressionAttributeValues: {
        ':accountId': accountId,
        ':roomId': request.room_id,
      },
      Limit: 1,
    });

    // 既に参加している場合
    if (existingMember.items.length > 0) {
      const member = existingMember.items[0];

      // アクティブな場合は重複エラー
      if (member.is_active) {
        throw new Error('既にこのROOMに参加しています');
      }

      // 非アクティブな場合は再参加（is_activeをtrueに更新）
      const now = getCurrentTimestamp();
      await putItem({
        TableName: TableNames.ROOM_MEMBER,
        Item: {
          ...member,
          is_active: true,
          joined_at: now, // 再参加日時を更新
        },
      });

      // メンバー数をインクリメント
      await incrementCounter(
        TableNames.ROOM,
        { room_id: request.room_id },
        'member_count',
        1
      );

      return successResponse({
        joined: true,
        room_id: request.room_id,
        rejoined: true,
      });
    }

    // 新規参加
    const now = getCurrentTimestamp();

    const memberItem: RoomMemberItem = {
      room_id: request.room_id,
      account_id: accountId,
      joined_at: now,
      role: 'member', // デフォルトはメンバー
      is_active: true,
    };

    // DynamoDBに保存
    await putItem({
      TableName: TableNames.ROOM_MEMBER,
      Item: memberItem,
    });

    // ROOMのメンバー数をインクリメント
    await incrementCounter(
      TableNames.ROOM,
      { room_id: request.room_id },
      'member_count',
      1
    );

    // レスポンス
    const response: JoinRoomResponse = {
      joined: true,
      room_id: request.room_id,
    };

    return successResponse(response, 201);
  } catch (error: any) {
    logError(error as Error, { handler: 'joinRoom' });

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
    return internalErrorResponse('ROOM参加中にエラーが発生しました');
  }
};
