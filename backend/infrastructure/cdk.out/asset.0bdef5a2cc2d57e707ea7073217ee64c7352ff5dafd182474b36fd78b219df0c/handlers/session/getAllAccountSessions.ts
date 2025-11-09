/**
 * アカウント全セッション取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { SessionItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  unauthorizedResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, query } from '../../lib/dynamodb';

interface SessionSummary {
  session_id: string;
  device_id: string;
  device_name?: string;
  device_type?: string;
  ip_address?: string;
  last_activity: number;
  created_at: number;
}

interface GetAllAccountSessionsResponse {
  items: SessionSummary[];
  total: number;
}

/**
 * アカウント全セッション取得Lambda関数
 *
 * ユーザーの全てのアクティブセッションを取得
 * セキュリティページで使用（どのデバイスでログインしているか確認）
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

    // GSI1でアカウントの全セッションを取得
    const result = await query<SessionItem>({
      TableName: TableNames.SESSION,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: {
        ':gsi1pk': `ACCOUNT_SESSIONS#${accountId}`,
      },
      ScanIndexForward: false, // 新しい順
    });

    // レスポンス整形
    const sessions = result.items.map((session) => ({
      session_id: session.session_id,
      device_id: session.device_id,
      device_name: session.device_name,
      device_type: session.device_type,
      ip_address: session.ip_address,
      last_activity: session.last_activity,
      created_at: session.created_at,
    }));

    // レスポンス
    const response: GetAllAccountSessionsResponse = {
      items: sessions,
      total: sessions.length,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getAllAccountSessions' });

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
    return internalErrorResponse('セッション一覧取得中にエラーが発生しました');
  }
};
