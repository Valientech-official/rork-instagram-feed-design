/**
 * ROOM作成ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { CreateRoomRequest, CreateRoomResponse } from '../../types/api';
import { RoomItem, RoomMemberItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
} from '../../lib/utils/response';
import {
  validateRequired,
  validateStringLength,
  validateHandle,
} from '../../lib/validators';
import { DuplicateError, logError } from '../../lib/utils/error';
import { generateULID } from '../../lib/utils/ulid';
import { TableNames, putItem, query } from '../../lib/dynamodb';

/**
 * ROOM作成Lambda関数
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
    const request = parseRequestBody<CreateRoomRequest>(event.body);

    // バリデーション
    validateRequired(request.room_name, 'ROOM名');
    validateRequired(request.room_handle, 'ROOMハンドル');
    validateRequired(request.category, 'カテゴリ');

    validateStringLength(request.room_name, 'ROOM名', 1, 100);
    validateHandle(request.room_handle); // ハンドル形式チェック

    if (request.description) {
      validateStringLength(request.description, '説明', 0, 500);
    }

    if (request.rules) {
      validateStringLength(request.rules, 'ルール', 0, 2000);
    }

    // ROOMハンドルの重複チェック（GSI1で検索）
    const handleCheck = await query({
      TableName: TableNames.ROOM,
      IndexName: 'GSI1',
      KeyConditionExpression: 'room_handle = :handle',
      ExpressionAttributeValues: {
        ':handle': request.room_handle,
      },
      Limit: 1,
    });

    if (handleCheck.items.length > 0) {
      throw new DuplicateError('ROOMハンドル', { room_handle: request.room_handle });
    }

    // ROOMIDを生成
    const roomId = generateULID();
    const now = getCurrentTimestamp();

    // ROOMアイテムを作成
    const roomItem: RoomItem = {
      room_id: roomId,
      room_name: request.room_name,
      room_handle: request.room_handle,
      description: request.description,
      category: request.category,
      cover_image_url: request.cover_image_url,
      icon_url: request.icon_url,
      created_by: accountId,
      created_at: now,
      member_count: 1, // 作成者が最初のメンバー
      post_count: 0,
      is_active: true,
      rules: request.rules,
    };

    // ROOMメンバーアイテムを作成（作成者を管理者として追加）
    const memberItem: RoomMemberItem = {
      room_id: roomId,
      account_id: accountId,
      joined_at: now,
      role: 'admin', // 作成者は管理者
      is_active: true,
    };

    // DynamoDBに保存（並列実行）
    await Promise.all([
      putItem({
        TableName: TableNames.ROOM,
        Item: roomItem,
      }),
      putItem({
        TableName: TableNames.ROOM_MEMBER,
        Item: memberItem,
      }),
    ]);

    // レスポンス
    const response: CreateRoomResponse = {
      room_id: roomId,
      room_handle: request.room_handle,
      created_at: now,
    };

    return successResponse(response, 201);
  } catch (error: any) {
    logError(error as Error, { handler: 'createRoom' });

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
    return internalErrorResponse('ROOM作成中にエラーが発生しました');
  }
};
