/**
 * メッセージ履歴取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetMessagesResponse } from '../../types/api';
import { MessageItem, ConversationItem, AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
} from '../../lib/utils/response';
import { validatePaginationLimit } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, query, getItemRequired, getItem } from '../../lib/dynamodb';

/**
 * メッセージ履歴取得Lambda関数
 *
 * 指定した会話のメッセージを取得
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

    // クエリパラメータを取得
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 50;
    const nextToken = event.queryStringParameters?.nextToken;

    // バリデーション
    const validatedLimit = validatePaginationLimit(limit);

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

    // ユーザーがこの会話の参加者であることを確認
    const isParticipant =
      conversation.participant_1_id === accountId ||
      conversation.participant_2_id === accountId;

    if (!isParticipant) {
      return forbiddenResponse('この会話にアクセスする権限がありません');
    }

    // メッセージを取得
    const result = await query<MessageItem>({
      TableName: TableNames.MESSAGE,
      KeyConditionExpression: 'conversation_id = :conversationId',
      ExpressionAttributeValues: {
        ':conversationId': conversationId,
      },
      ScanIndexForward: false, // 新しい順（message_id は ULID なので時系列順）
      Limit: validatedLimit,
      ExclusiveStartKey: nextToken
        ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
        : undefined,
    });

    // 送信者のアカウント情報を取得
    const senderIds = [...new Set(result.items.map((message) => message.sender_account_id))];
    const senderPromises = senderIds.map((id) =>
      getItem<AccountItem>({
        TableName: TableNames.ACCOUNT,
        Key: {
          PK: `ACCOUNT#${id}`,
          SK: 'PROFILE',
        },
      })
    );

    const senders = await Promise.all(senderPromises);
    const senderMap = new Map<string, AccountItem>();

    senders.forEach((sender) => {
      if (sender) {
        senderMap.set(sender.account_id, sender);
      }
    });

    // メッセージに送信者情報を付与
    const messagesWithSender = result.items.map((message) => {
      const sender = senderMap.get(message.sender_account_id);

      if (!sender) {
        return null;
      }

      return {
        message_id: message.message_id,
        conversation_id: message.conversation_id,
        content: message.content ?? '',
        sender: {
          account_id: sender.account_id,
          username: sender.username,
          handle: sender.handle,
          profile_image: sender.profile_image,
          account_type: sender.account_type,
          is_private: sender.is_private,
        },
        created_at: message.created_at,
        is_read: message.is_read || false,
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    // 次のページのトークンを生成
    const nextTokenValue = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;

    // レスポンス
    const response: GetMessagesResponse = {
      items: messagesWithSender,
      nextToken: nextTokenValue,
      total: undefined, // 全件数は計算コストが高いため省略
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getMessages' });

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
    return internalErrorResponse('メッセージ取得中にエラーが発生しました');
  }
};
