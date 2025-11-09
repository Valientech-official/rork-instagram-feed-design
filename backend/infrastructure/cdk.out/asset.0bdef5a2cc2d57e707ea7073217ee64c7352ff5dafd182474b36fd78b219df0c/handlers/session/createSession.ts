/**
 * セッション作成ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { SessionItem } from '../../types/dynamodb';
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
import { TableNames, putItem } from '../../lib/dynamodb';

interface CreateSessionRequest {
  device_id: string;
  device_name?: string;
  device_type?: 'ios' | 'android' | 'web';
  access_token: string;
  refresh_token: string;
}

interface CreateSessionResponse {
  session_id: string;
  account_id: string;
  device_id: string;
  access_token: string;
  refresh_token: string;
  created_at: number;
  ttl: number;
}

/**
 * セッション作成Lambda関数
 *
 * ユーザーがログインした際にセッション情報を保存
 * 複数デバイス対応
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
    const request = parseRequestBody<CreateSessionRequest>(event.body);

    // バリデーション
    validateRequired(request.device_id, 'デバイスID');
    validateRequired(request.access_token, 'アクセストークン');
    validateRequired(request.refresh_token, 'リフレッシュトークン');

    // device_typeのバリデーション
    if (request.device_type && !['ios', 'android', 'web'].includes(request.device_type)) {
      return validationErrorResponse('デバイスタイプが不正です（ios/android/webのいずれか）');
    }

    // セッションIDを生成
    const sessionId = generateULID();
    const now = getCurrentTimestamp();
    const ttl = now + 30 * 24 * 60 * 60; // 30日後に自動削除

    // IPアドレスとUser-Agentを取得
    const ipAddress = event.requestContext.identity?.sourceIp;
    const userAgent = event.headers['User-Agent'] || event.headers['user-agent'];

    // セッション情報を作成
    const sessionItem: SessionItem = {
      PK: `SESSION#${accountId}`,
      SK: `DEVICE#${request.device_id}`,
      session_id: sessionId,
      account_id: accountId,
      device_id: request.device_id,
      device_name: request.device_name,
      device_type: request.device_type,
      access_token: request.access_token,
      refresh_token: request.refresh_token,
      ip_address: ipAddress,
      user_agent: userAgent,
      last_activity: now,
      created_at: now,
      ttl,
      GSI1PK: `ACCOUNT_SESSIONS#${accountId}`,
      GSI1SK: `CREATED#${now}`,
    };

    // DynamoDBに保存
    await putItem({
      TableName: TableNames.SESSION,
      Item: sessionItem,
    });

    // レスポンス
    const response: CreateSessionResponse = {
      session_id: sessionId,
      account_id: accountId,
      device_id: request.device_id,
      access_token: request.access_token,
      refresh_token: request.refresh_token,
      created_at: now,
      ttl,
    };

    return successResponse(response, 201);
  } catch (error: any) {
    logError(error as Error, { handler: 'createSession' });

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
    return internalErrorResponse('セッション作成中にエラーが発生しました');
  }
};
