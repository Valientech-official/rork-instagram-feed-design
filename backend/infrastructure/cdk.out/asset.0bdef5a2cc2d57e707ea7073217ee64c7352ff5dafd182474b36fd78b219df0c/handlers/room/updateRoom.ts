/**
 * ルーム更新ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { RoomItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
} from '../../lib/utils/response';
import { validateRequired } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, getItem, updateItem } from '../../lib/dynamodb';

interface UpdateRoomRequest {
  room_name?: string;
  description?: string;
  category?: string;
  cover_image_url?: string;
  icon_url?: string;
  rules?: string;
  is_active?: boolean;
}

interface UpdateRoomResponse {
  room_id: string;
  room_name: string;
  room_handle: string;
  description?: string;
  category: string;
  cover_image_url?: string;
  icon_url?: string;
  is_active: boolean;
  rules?: string;
}

/**
 * ルーム更新Lambda関数
 *
 * ルーム作成者がルーム情報を更新
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

    // パスパラメータからルームIDを取得
    const roomId = event.pathParameters?.room_id;

    if (!roomId) {
      return notFoundResponse('ルームID');
    }

    // リクエストボディをパース
    const request = parseRequestBody<UpdateRoomRequest>(event.body);

    // 少なくとも1つの更新フィールドが必要
    if (
      !request.room_name &&
      !request.description &&
      !request.category &&
      !request.cover_image_url &&
      !request.icon_url &&
      !request.rules &&
      request.is_active === undefined
    ) {
      return validationErrorResponse('更新する項目を指定してください');
    }

    // ルームが存在するか確認
    const existingRoom = await getItem<RoomItem>({
      TableName: TableNames.ROOM,
      Key: {
        room_id: roomId,
      },
    });

    if (!existingRoom) {
      return notFoundResponse('ルーム');
    }

    // 作成者のみ更新可能
    if (existingRoom.created_by !== accountId) {
      return unauthorizedResponse('このルームを更新する権限がありません');
    }

    // バリデーション
    if (request.room_name !== undefined) {
      validateRequired(request.room_name, 'ルーム名');
      if (request.room_name.length > 100) {
        return validationErrorResponse('ルーム名は100文字以内で入力してください');
      }
    }

    if (request.description !== undefined && request.description.length > 500) {
      return validationErrorResponse('説明は500文字以内で入力してください');
    }

    if (request.rules !== undefined && request.rules.length > 2000) {
      return validationErrorResponse('ルールは2000文字以内で入力してください');
    }

    // 更新用の属性を準備
    const updateExpressionParts: string[] = [];
    const expressionAttributeValues: any = {};

    if (request.room_name !== undefined) {
      updateExpressionParts.push('room_name = :roomName');
      expressionAttributeValues[':roomName'] = request.room_name;
    }

    if (request.description !== undefined) {
      updateExpressionParts.push('description = :description');
      expressionAttributeValues[':description'] = request.description;
    }

    if (request.category !== undefined) {
      updateExpressionParts.push('category = :category');
      expressionAttributeValues[':category'] = request.category;
    }

    if (request.cover_image_url !== undefined) {
      updateExpressionParts.push('cover_image_url = :coverImageUrl');
      expressionAttributeValues[':coverImageUrl'] = request.cover_image_url;
    }

    if (request.icon_url !== undefined) {
      updateExpressionParts.push('icon_url = :iconUrl');
      expressionAttributeValues[':iconUrl'] = request.icon_url;
    }

    if (request.rules !== undefined) {
      updateExpressionParts.push('rules = :rules');
      expressionAttributeValues[':rules'] = request.rules;
    }

    if (request.is_active !== undefined) {
      updateExpressionParts.push('is_active = :isActive');
      expressionAttributeValues[':isActive'] = request.is_active;
    }

    // ルームを更新
    const result = await updateItem({
      TableName: TableNames.ROOM,
      Key: {
        room_id: roomId,
      },
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const updatedRoom = result.Attributes as RoomItem;

    // レスポンス
    const response: UpdateRoomResponse = {
      room_id: updatedRoom.room_id,
      room_name: updatedRoom.room_name,
      room_handle: updatedRoom.room_handle,
      description: updatedRoom.description,
      category: updatedRoom.category,
      cover_image_url: updatedRoom.cover_image_url,
      icon_url: updatedRoom.icon_url,
      is_active: updatedRoom.is_active,
      rules: updatedRoom.rules,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'updateRoom' });

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
    return internalErrorResponse('ルーム更新中にエラーが発生しました');
  }
};
