/**
 * ライブチャット取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { LiveChatItem, AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  notFoundResponse,
  validationErrorResponse,
} from '../../lib/utils/response';
import { validatePaginationLimit } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, query, batchGet } from '../../lib/dynamodb';

interface GetLiveChatsResponse {
  items: Array<{
    chat_id: string;
    message: string;
    created_at: number;
    user: {
      account_id: string;
      username: string;
      handle: string;
      profile_image?: string;
    };
  }>;
  nextToken?: string;
  count: number;
}

/**
 * ライブチャット取得Lambda関数
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // パスパラメータから配信IDを取得
    const streamId = event.pathParameters?.stream_id;

    if (!streamId) {
      return notFoundResponse('配信ID');
    }

    // クエリパラメータを取得
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 50;
    const nextToken = event.queryStringParameters?.nextToken;

    // バリデーション
    const validatedLimit = validatePaginationLimit(limit, 100);

    // LIVE_CHATテーブルからチャットを取得
    const result = await query({
      TableName: TableNames.LIVE_CHAT,
      KeyConditionExpression: 'stream_id = :streamId',
      ExpressionAttributeValues: {
        ':streamId': streamId,
        ':isDeleted': false,
      },
      FilterExpression: 'is_deleted = :isDeleted',
      ScanIndexForward: false, // 新しい順
      Limit: validatedLimit,
      ExclusiveStartKey: nextToken
        ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
        : undefined,
    });

    if (!result.items || result.items.length === 0) {
      // チャットがない場合は空配列を返す
      const response: GetLiveChatsResponse = {
        items: [],
        count: 0,
      };
      return successResponse(response);
    }

    const chats = result.items as LiveChatItem[];

    // ユーザー情報を一括取得
    const accountIds = Array.from(new Set(chats.map((chat) => chat.account_id)));
    const accountKeys = accountIds.map((id) => ({
      PK: `ACCOUNT#${id}`,
      SK: 'PROFILE',
    }));

    const accounts = await batchGet<AccountItem>({
      RequestItems: {
        [TableNames.ACCOUNT]: {
          Keys: accountKeys,
        },
      },
    });

    // アカウントマップを作成
    const accountMap = new Map<string, AccountItem>();
    accounts.forEach((account) => {
      accountMap.set(account.account_id, account);
    });

    // チャットとユーザー情報を結合
    const items = chats
      .map((chat) => {
        const user = accountMap.get(chat.account_id);
        if (!user) {
          return null;
        }

        return {
          chat_id: chat.chat_id,
          message: chat.message,
          created_at: chat.created_at,
          user: {
            account_id: user.account_id,
            username: user.username,
            handle: user.handle,
            profile_image: user.profile_image,
          },
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // 次のページのトークンを生成
    const nextTokenValue = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;

    // レスポンス
    const response: GetLiveChatsResponse = {
      items,
      nextToken: nextTokenValue,
      count: items.length,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getLiveChats' });

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
    return internalErrorResponse('チャット取得中にエラーが発生しました');
  }
};
