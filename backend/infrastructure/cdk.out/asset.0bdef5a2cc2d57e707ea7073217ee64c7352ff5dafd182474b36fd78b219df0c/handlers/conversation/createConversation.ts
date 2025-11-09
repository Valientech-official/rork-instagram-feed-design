/**
 * 会話作成ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { CreateConversationRequest, CreateConversationResponse } from '../../types/api';
import { ConversationItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '../../lib/utils/response';
import { validateRequired } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { generateULID } from '../../lib/utils/ulid';
import { TableNames, putItem, query } from '../../lib/dynamodb';

/**
 * 会話作成Lambda関数
 *
 * 既存の会話があればそのIDを返す
 * なければ新規作成
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
    const request = parseRequestBody<CreateConversationRequest>(event.body);

    // バリデーション
    validateRequired(request.participant_id, '相手アカウントID');

    // 自分自身との会話は不可
    if (request.participant_id === accountId) {
      return validationErrorResponse('自分自身との会話は作成できません');
    }

    // 既存の会話をチェック（participant_1とparticipant_2の順序を問わない）
    // まず自分がparticipant_1のケースを検索
    const existingConversation1 = await query<ConversationItem>({
      TableName: TableNames.CONVERSATION,
      IndexName: 'GSI_participant1_conversations',
      KeyConditionExpression: 'participant_1_id = :participant1',
      FilterExpression: 'participant_2_id = :participant2',
      ExpressionAttributeValues: {
        ':participant1': accountId,
        ':participant2': request.participant_id,
      },
      Limit: 1,
    });

    if (existingConversation1.items.length > 0) {
      // 既存の会話が見つかった
      const conversation = existingConversation1.items[0];
      const response: CreateConversationResponse = {
        conversation_id: conversation.conversation_id,
        participant_1_id: conversation.participant_1_id,
        participant_2_id: conversation.participant_2_id,
        created_at: conversation.created_at,
        last_message_at: conversation.last_message_at ?? conversation.created_at,
        is_new: false,
      };
      return successResponse(response, 200);
    }

    // 次に自分がparticipant_2のケースを検索
    const existingConversation2 = await query<ConversationItem>({
      TableName: TableNames.CONVERSATION,
      IndexName: 'GSI_participant2_conversations',
      KeyConditionExpression: 'participant_2_id = :participant2',
      FilterExpression: 'participant_1_id = :participant1',
      ExpressionAttributeValues: {
        ':participant2': accountId,
        ':participant1': request.participant_id,
      },
      Limit: 1,
    });

    if (existingConversation2.items.length > 0) {
      // 既存の会話が見つかった
      const conversation = existingConversation2.items[0];
      const response: CreateConversationResponse = {
        conversation_id: conversation.conversation_id,
        participant_1_id: conversation.participant_1_id,
        participant_2_id: conversation.participant_2_id,
        created_at: conversation.created_at,
        last_message_at: conversation.last_message_at ?? conversation.created_at,
        is_new: false,
      };
      return successResponse(response, 200);
    }

    // 既存の会話が見つからなかったので新規作成
    const now = getCurrentTimestamp();
    const conversationId = generateULID();

    // 会話アイテムを作成
    // participant_1とparticipant_2を辞書順にソート（一貫性のため）
    const [participant1, participant2] = [accountId, request.participant_id].sort();

    const conversationItem: ConversationItem = {
      conversation_id: conversationId,
      created_at: now,
      participant_ids: [participant1, participant2],
      participant_1_id: participant1,
      participant_2_id: participant2,
      unread_count_1: 0,
      unread_count_2: 0,
      is_active: true,
      is_archived_by_1: false,
      is_archived_by_2: false,
      is_muted_by_1: false,
      is_muted_by_2: false,
      updated_at: now,
    };

    // DynamoDBに保存
    await putItem({
      TableName: TableNames.CONVERSATION,
      Item: conversationItem,
    });

    // レスポンス
    const response: CreateConversationResponse = {
      conversation_id: conversationId,
      participant_1_id: participant1,
      participant_2_id: participant2,
      created_at: now,
      last_message_at: now, // 新規作成時はcreated_atと同じ
      is_new: true,
    };

    return successResponse(response, 201);
  } catch (error: any) {
    logError(error as Error, { handler: 'createConversation' });

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
    return internalErrorResponse('会話作成中にエラーが発生しました');
  }
};
