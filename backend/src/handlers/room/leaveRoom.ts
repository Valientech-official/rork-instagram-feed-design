/**
 * ルーム退出ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  successResponse,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, deleteItem, getItem, updateItem } from '../../lib/dynamodb';

/**
 * ルーム退出Lambda関数
 *
 * ルームメンバーがルームから退出
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

    // メンバーシップが存在するか確認
    const membershipItem = await getItem({
      TableName: TableNames.ROOM_MEMBER,
      Key: {
        room_id: roomId,
        account_id: accountId,
      },
    });

    if (!membershipItem) {
      return notFoundResponse('ルームメンバーシップ');
    }

    // ルーム作成者は退出できない
    const room = await getItem({
      TableName: TableNames.ROOM,
      Key: {
        room_id: roomId,
      },
    });

    if (!room) {
      return notFoundResponse('ルーム');
    }

    if (room.created_by === accountId) {
      return validationErrorResponse('ルーム作成者は退出できません。ルームを削除するか、他のメンバーに管理を移譲してください。');
    }

    // メンバーシップを削除
    await deleteItem({
      TableName: TableNames.ROOM_MEMBER,
      Key: {
        room_id: roomId,
        account_id: accountId,
      },
    });

    // ルームのメンバー数をデクリメント（非同期）
    updateItem({
      TableName: TableNames.ROOM,
      Key: {
        room_id: roomId,
      },
      UpdateExpression: 'SET member_count = member_count - :one',
      ExpressionAttributeValues: {
        ':one': 1,
      },
    }).catch((err) => {
      console.warn('Failed to decrement room member_count:', err);
    });

    // レスポンス（204 No Content）
    return {
      statusCode: 204,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: '',
    };
  } catch (error: any) {
    logError(error as Error, { handler: 'leaveRoom' });

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
    return internalErrorResponse('ルーム退出中にエラーが発生しました');
  }
};
