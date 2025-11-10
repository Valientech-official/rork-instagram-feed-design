/**
 * ユーザー行動トラッキングハンドラー
 * いいね、閲覧、フォロー等の行動をUSER_BEHAVIORテーブルに記録
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { UserBehaviorItem } from '../../types/dynamodb';
import {
  successResponse,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
  badRequestResponse,
  getTTLTimestamp,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, putItem } from '../../lib/dynamodb';

/**
 * リクエストボディ型定義
 */
interface TrackBehaviorRequest {
  behavior_type: 'like' | 'comment' | 'view' | 'follow' | 'repost' | 'product_click' | 'room_join' | 'hashtag_use';
  target_id: string;
  target_type: 'post' | 'product' | 'user' | 'room' | 'hashtag';
  weight?: number; // 1-10 (デフォルト: 5)
}

/**
 * ユーザー行動トラッキングLambda関数
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

    // リクエストボディのパース
    if (!event.body) {
      return badRequestResponse('リクエストボディが必要です');
    }

    const body: TrackBehaviorRequest = JSON.parse(event.body);
    const { behavior_type, target_id, target_type, weight = 5 } = body;

    // バリデーション
    if (!behavior_type || !target_id || !target_type) {
      return badRequestResponse('behavior_type, target_id, target_type は必須です');
    }

    if (weight < 1 || weight > 10) {
      return badRequestResponse('weightは1から10の間である必要があります');
    }

    const now = getCurrentTimestamp();

    // behavior_id: timestamp + type で一意性を保証
    const behaviorId = `${now}_${behavior_type}`;

    // USER_BEHAVIORアイテムを作成
    const behaviorItem: UserBehaviorItem = {
      account_id: accountId,
      behavior_id: behaviorId,
      behavior_type,
      target_id,
      target_type,
      timestamp: now,
      weight,
      ttl: getTTLTimestamp(30), // 30日後に自動削除
    };

    // DynamoDBに保存
    await putItem({
      TableName: TableNames.USER_BEHAVIOR,
      Item: behaviorItem,
    });

    // レスポンス
    return successResponse(
      {
        tracked: true,
        behavior_id: behaviorId,
        timestamp: now,
      },
      201
    );
  } catch (error: any) {
    logError(error as Error, { handler: 'trackBehavior' });

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
    return internalErrorResponse('行動トラッキング中にエラーが発生しました');
  }
};
