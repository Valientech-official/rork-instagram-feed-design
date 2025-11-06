/**
 * メッセージ送信ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { SendMessageRequest, SendMessageResponse } from '../../types/api';
import { MessageItem, ConversationItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  forbiddenResponse,
} from '../../lib/utils/response';
import { validateRequired } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { generateULID } from '../../lib/utils/ulid';
import { TableNames, putItem, getItemRequired, updateItem } from '../../lib/dynamodb';

/**
 * メッセージ送信Lambda関数
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

    // パスパラメータから会話IDを取得
    const conversationId = event.pathParameters?.conversation_id;

    if (!conversationId) {
      return notFoundResponse('会話ID');
    }

    // リクエストボディをパース
    const request = parseRequestBody<SendMessageRequest>(event.body);

    // バリデーション
    validateRequired(request.content, 'メッセージ内容');

    // メッセージ内容の長さチェック（最大5000文字）
    if (request.content.length > 5000) {
      return validationErrorResponse('メッセージは5000文字以内で入力してください');
    }

    if (request.content.trim().length === 0) {
      return validationErrorResponse('空のメッセージは送信できません');
    }

    // 会話が存在するか確認
    const conversation = await getItemRequired<ConversationItem>(
      {
        TableName: TableNames.CONVERSATION,
        Key: {
          conversation_id: conversationId,
        },
      },
      '会話'
    );

    // 送信者がこの会話の参加者であることを確認
    const isParticipant =
      conversation.participant_1_id === accountId ||
      conversation.participant_2_id === accountId;

    if (!isParticipant) {
      return forbiddenResponse('この会話にメッセージを送信する権限がありません');
    }

    // メッセージを作成
    const now = getCurrentTimestamp();
    const messageId = generateULID();

    const messageItem: MessageItem = {
      conversation_id: conversationId,
      message_id: messageId,
      sender_account_id: accountId,
      content: request.content,
      created_at: now,
      is_read: false,
      ttl: now + 90 * 24 * 60 * 60, // 90日後に削除
    };

    // メッセージをDynamoDBに保存
    await putItem({
      TableName: TableNames.MESSAGE,
      Item: messageItem,
    });

    // 会話の最終メッセージ日時を更新
    await updateItem({
      TableName: TableNames.CONVERSATION,
      Key: {
        conversation_id: conversationId,
      },
      UpdateExpression: 'SET last_message_at = :lastMessageAt',
      ExpressionAttributeValues: {
        ':lastMessageAt': now,
      },
    });

    // レスポンス
    const response: SendMessageResponse = {
      message_id: messageId,
      conversation_id: conversationId,
      sender_account_id: accountId,
      content: request.content,
      created_at: now,
      is_read: false,
    };

    return successResponse(response, 201);
  } catch (error: any) {
    logError(error as Error, { handler: 'sendMessage' });

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
    return internalErrorResponse('メッセージ送信中にエラーが発生しました');
  }
};
