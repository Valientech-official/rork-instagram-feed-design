/**
 * 通知一覧取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { NotificationItem, AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  unauthorizedResponse,
} from '../../lib/utils/response';
import { validatePaginationLimit } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, query, getItem } from '../../lib/dynamodb';

interface NotificationDetail {
  notification_id: string;
  notification_type: string;
  actor: {
    account_id: string;
    username: string;
    handle: string;
    profile_image?: string;
  };
  target_post_id?: string;
  target_comment_id?: string;
  content_preview?: string;
  created_at: number;
  is_read: boolean;
  read_at?: number;
}

interface GetNotificationsResponse {
  items: NotificationDetail[];
  nextToken?: string;
  unread_count?: number;
  total?: number;
}

/**
 * 通知一覧取得Lambda関数
 *
 * ユーザーの通知を取得（新しい順）
 * 未読のみフィルタリング可能
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
    const unreadOnly = event.queryStringParameters?.unread_only === 'true';
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 50;
    const nextToken = event.queryStringParameters?.nextToken;

    // バリデーション
    const validatedLimit = validatePaginationLimit(limit);

    // 通知一覧を取得
    const indexName = unreadOnly ? 'GSI_unread_notifications' : 'GSI_user_notifications';

    const queryParams: any = {
      TableName: TableNames.NOTIFICATION,
      IndexName: indexName,
      KeyConditionExpression: 'recipient_account_id = :accountId',
      ExpressionAttributeValues: {
        ':accountId': accountId,
      },
      ScanIndexForward: false, // 新しい順
      Limit: validatedLimit,
      ExclusiveStartKey: nextToken
        ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
        : undefined,
    };

    // 未読のみフィルタ
    if (unreadOnly) {
      queryParams.FilterExpression = 'is_read = :isRead';
      queryParams.ExpressionAttributeValues[':isRead'] = false;
    }

    const result = await query<NotificationItem>(queryParams);

    // アクター（通知の発生元ユーザー）の情報を取得
    const actorIds = [...new Set(result.items.map((notif) => notif.actor_account_id))];
    const actorPromises = actorIds.map((id) =>
      getItem<AccountItem>({
        TableName: TableNames.ACCOUNT,
        Key: {
          PK: `ACCOUNT#${id}`,
          SK: 'PROFILE',
        },
      })
    );

    const actors = await Promise.all(actorPromises);
    const actorMap = new Map<string, AccountItem>();

    actors.forEach((actor) => {
      if (actor) {
        actorMap.set(actor.account_id, actor);
      }
    });

    // 通知にアクター情報を付与
    const notificationsWithActor = result.items
      .map((notif) => {
        const actor = actorMap.get(notif.actor_account_id);

        if (!actor) {
          return null;
        }

        return {
          notification_id: notif.notification_id,
          notification_type: notif.notification_type,
          actor: {
            account_id: actor.account_id,
            username: actor.username,
            handle: actor.handle,
            profile_image: actor.profile_image,
          },
          target_post_id: notif.target_post_id,
          target_comment_id: notif.target_comment_id,
          content_preview: notif.content_preview,
          created_at: notif.created_at,
          is_read: notif.is_read,
          read_at: notif.read_at,
        };
      })
      .filter((item): item is NotificationDetail => item !== null);

    // 次のページのトークンを生成
    const nextTokenValue = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;

    // レスポンス
    const response: GetNotificationsResponse = {
      items: notificationsWithActor,
      nextToken: nextTokenValue,
      total: undefined,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getNotifications' });

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
    return internalErrorResponse('通知一覧取得中にエラーが発生しました');
  }
};
