/**
 * 会話一覧取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetConversationsResponse } from '../../types/api';
import { ConversationItem, MessageItem, AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  unauthorizedResponse,
} from '../../lib/utils/response';
import { validatePaginationLimit } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, query, getItem } from '../../lib/dynamodb';

/**
 * 会話一覧取得Lambda関数
 *
 * 自分が参加している会話を取得
 * GSI1 と GSI2 で participant_1_id と participant_2_id の両方から検索
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

    // クエリパラメータを取得
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 20;
    const nextToken = event.queryStringParameters?.nextToken;

    // バリデーション
    const validatedLimit = validatePaginationLimit(limit);

    // participant_1として参加している会話を取得
    const conversations1 = await query<ConversationItem>({
      TableName: TableNames.CONVERSATION,
      IndexName: 'GSI_participant1_conversations',
      KeyConditionExpression: 'participant_1_id = :accountId',
      ExpressionAttributeValues: {
        ':accountId': accountId,
      },
      ScanIndexForward: false, // 最終メッセージ日時の新しい順
      Limit: validatedLimit,
    });

    // participant_2として参加している会話を取得
    const conversations2 = await query<ConversationItem>({
      TableName: TableNames.CONVERSATION,
      IndexName: 'GSI_participant2_conversations',
      KeyConditionExpression: 'participant_2_id = :accountId',
      ExpressionAttributeValues: {
        ':accountId': accountId,
      },
      ScanIndexForward: false, // 最終メッセージ日時の新しい順
      Limit: validatedLimit,
    });

    // 2つの結果をマージして last_message_at でソート
    const allConversations = [...conversations1.items, ...conversations2.items];
    allConversations.sort((a, b) => b.last_message_at - a.last_message_at);

    // limit数に制限
    const limitedConversations = allConversations.slice(0, validatedLimit);

    // 各会話の相手アカウント情報を取得
    const conversationsWithPartner = await Promise.all(
      limitedConversations.map(async (conversation) => {
        // 相手のアカウントIDを特定
        const partnerId =
          conversation.participant_1_id === accountId
            ? conversation.participant_2_id
            : conversation.participant_1_id;

        // 相手のアカウント情報を取得
        const partner = await getItem<AccountItem>({
          TableName: TableNames.ACCOUNT,
          Key: {
            PK: `ACCOUNT#${partnerId}`,
            SK: 'PROFILE',
          },
        });

        if (!partner) {
          return null;
        }

        // 最新メッセージを取得（1件のみ）
        const lastMessageResult = await query<MessageItem>({
          TableName: TableNames.MESSAGE,
          KeyConditionExpression: 'conversation_id = :conversationId',
          ExpressionAttributeValues: {
            ':conversationId': conversation.conversation_id,
          },
          ScanIndexForward: false, // 新しい順
          Limit: 1,
        });

        const lastMessage = lastMessageResult.items[0] || null;

        return {
          conversation_id: conversation.conversation_id,
          partner: {
            account_id: partner.account_id,
            username: partner.username,
            handle: partner.handle,
            profile_image: partner.profile_image,
          },
          last_message: lastMessage
            ? {
                message_id: lastMessage.message_id,
                content: lastMessage.content,
                sender_account_id: lastMessage.sender_account_id,
                created_at: lastMessage.created_at,
              }
            : null,
          last_message_at: conversation.last_message_at,
          created_at: conversation.created_at,
        };
      })
    );

    // null を除外
    const filteredConversations = conversationsWithPartner.filter(
      (item): item is NonNullable<typeof item> => item !== null
    );

    // レスポンス
    const response: GetConversationsResponse = {
      items: filteredConversations,
      nextToken: undefined, // 簡略化のため省略（実装時は lastEvaluatedKey を使用）
      total: undefined,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getConversations' });

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
    return internalErrorResponse('会話一覧取得中にエラーが発生しました');
  }
};
