/**
 * ライブギフト送信ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { LiveStreamItem, LiveGiftItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
} from '../../lib/utils/response';
import { validateRequired } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { generateULID } from '../../lib/utils/ulid';
import { TableNames, query, putItem } from '../../lib/dynamodb';

interface SendGiftRequest {
  gift_type: string;
  gift_amount: number;
  message?: string;
}

interface SendGiftResponse {
  gift_id: string;
  created_at: number;
}

/**
 * ライブギフト送信Lambda関数
 *
 * 将来の収益化機能
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // TODO: JWTトークンから account_id を取得
    const accountId = event.headers['x-account-id'];

    if (!accountId) {
      return unauthorizedResponse('アカウントIDが取得できません');
    }

    // パスパラメータから配信IDを取得
    const streamId = event.pathParameters?.stream_id;

    if (!streamId) {
      return notFoundResponse('配信ID');
    }

    // リクエストボディをパース
    const request = parseRequestBody<SendGiftRequest>(event.body);

    // バリデーション
    validateRequired(request.gift_type, 'ギフトタイプ');
    validateRequired(request.gift_amount, 'ギフト金額');

    if (request.gift_amount <= 0) {
      return validationErrorResponse('ギフト金額は1以上で指定してください');
    }

    // ライブ配信を取得
    const streamResult = await query({
      TableName: TableNames.LIVE_STREAM,
      KeyConditionExpression: 'stream_id = :streamId',
      ExpressionAttributeValues: {
        ':streamId': streamId,
      },
      Limit: 1,
    });

    if (!streamResult.items || streamResult.items.length === 0) {
      return notFoundResponse('ライブ配信');
    }

    const stream = streamResult.items[0] as LiveStreamItem;

    if (stream.is_deleted) {
      return notFoundResponse('ライブ配信');
    }

    if (stream.status !== 'active') {
      return validationErrorResponse('この配信にはギフトを送信できません');
    }

    const now = getCurrentTimestamp();
    const giftId = generateULID();

    // LIVE_GIFTに保存
    const giftItem: LiveGiftItem = {
      gift_id: giftId,
      created_at: now,
      stream_id: streamId,
      sender_account_id: accountId,
      receiver_account_id: stream.account_id,
      gift_type: request.gift_type,
      gift_amount: request.gift_amount,
      message: request.message,
      ttl: now + 30 * 24 * 60 * 60, // 30日後削除
    };

    await putItem({
      TableName: TableNames.LIVE_GIFT,
      Item: giftItem,
    });

    // TODO: WebSocket経由でギフトを配信

    // レスポンス
    const response: SendGiftResponse = {
      gift_id: giftId,
      created_at: now,
    };

    return successResponse(response, 201);
  } catch (error: any) {
    logError(error as Error, { handler: 'sendGift' });

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

    return internalErrorResponse('ギフト送信中にエラーが発生しました');
  }
};
