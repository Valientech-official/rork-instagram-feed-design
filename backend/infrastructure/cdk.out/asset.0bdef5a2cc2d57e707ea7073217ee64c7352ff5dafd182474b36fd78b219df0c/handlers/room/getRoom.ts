/**
 * ルーム詳細取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { RoomItem, AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, getItem } from '../../lib/dynamodb';

interface GetRoomResponse {
  room_id: string;
  room_name: string;
  room_handle: string;
  description?: string;
  category: string;
  cover_image_url?: string;
  icon_url?: string;
  creator: {
    account_id: string;
    username: string;
    handle: string;
    profile_image?: string;
  };
  created_at: number;
  member_count: number;
  post_count: number;
  is_active: boolean;
  rules?: string;
}

/**
 * ルーム詳細取得Lambda関数
 *
 * 特定ルームの詳細情報を取得
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // パスパラメータからルームIDを取得
    const roomId = event.pathParameters?.room_id;

    if (!roomId) {
      return notFoundResponse('ルームID');
    }

    // ルーム情報を取得
    const room = await getItem<RoomItem>({
      TableName: TableNames.ROOM,
      Key: {
        room_id: roomId,
      },
    });

    if (!room) {
      return notFoundResponse('ルーム');
    }

    // 作成者のアカウント情報を取得
    const creator = await getItem<AccountItem>({
      TableName: TableNames.ACCOUNT,
      Key: {
        PK: `ACCOUNT#${room.created_by}`,
        SK: 'PROFILE',
      },
    });

    if (!creator) {
      return notFoundResponse('ルーム作成者');
    }

    // レスポンス
    const response: GetRoomResponse = {
      room_id: room.room_id,
      room_name: room.room_name,
      room_handle: room.room_handle,
      description: room.description,
      category: room.category,
      cover_image_url: room.cover_image_url,
      icon_url: room.icon_url,
      creator: {
        account_id: creator.account_id,
        username: creator.username,
        handle: creator.handle,
        profile_image: creator.profile_image,
      },
      created_at: room.created_at,
      member_count: room.member_count,
      post_count: room.post_count,
      is_active: room.is_active,
      rules: room.rules,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getRoom' });

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
    return internalErrorResponse('ルーム詳細取得中にエラーが発生しました');
  }
};
