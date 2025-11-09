/**
 * ライブチャット送信ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { LiveStreamItem, LiveChatItem } from '../../types/dynamodb';
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

interface SendLiveChatRequest {
  message: string;
}

interface SendLiveChatResponse {
  chat_id: string;
  created_at: number;
}

/**
 * ライブチャット送信Lambda関数
 *
 * アクティブな配信のみ送信可能
 * WebSocket経由でリアルタイム配信
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

    // パスパラメータから配信IDを取得
    const streamId = event.pathParameters?.stream_id;

    if (!streamId) {
      return notFoundResponse('配信ID');
    }

    // リクエストボディをパース
    const request = parseRequestBody<SendLiveChatRequest>(event.body);

    // バリデーション
    validateRequired(request.message, 'メッセージ');

    // メッセージの長さ
    if (request.message.length < 1 || request.message.length > 500) {
      return validationErrorResponse('メッセージは1-500文字で入力してください');
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

    // 削除済み
    if (stream.is_deleted) {
      return notFoundResponse('ライブ配信');
    }

    // アクティブな配信のみチャット送信可能
    if (stream.status !== 'active') {
      return validationErrorResponse('この配信にはチャットを送信できません');
    }

    // TODO: BANされているユーザーはチャット送信不可

    const now = getCurrentTimestamp();
    const chatId = generateULID();

    // LIVE_CHATに保存
    const chatItem: LiveChatItem = {
      stream_id: streamId,
      chat_id: chatId,
      account_id: accountId,
      message: request.message,
      created_at: now,
      is_deleted: false,
      ttl: now + 7 * 24 * 60 * 60, // 7日後削除
    };

    await putItem({
      TableName: TableNames.LIVE_CHAT,
      Item: chatItem,
    });

    // TODO: WebSocket経由で視聴者全員にチャットを配信

    // レスポンス
    const response: SendLiveChatResponse = {
      chat_id: chatId,
      created_at: now,
    };

    return successResponse(response, 201);
  } catch (error: any) {
    logError(error as Error, { handler: 'sendLiveChat' });

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
    return internalErrorResponse('チャット送信中にエラーが発生しました');
  }
};
