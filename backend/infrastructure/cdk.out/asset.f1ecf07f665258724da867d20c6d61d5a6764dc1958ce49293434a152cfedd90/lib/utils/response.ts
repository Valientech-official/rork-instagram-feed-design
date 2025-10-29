/**
 * APIレスポンスビルダー
 */

import { APIGatewayProxyResult } from 'aws-lambda';
import { ApiResponse, ApiError } from '../../types/api';
import { ErrorCode } from '../../types/common';

/**
 * 成功レスポンスを生成
 * @param data - レスポンスデータ
 * @param statusCode - HTTPステータスコード（デフォルト: 200）
 * @returns APIGatewayProxyResult
 */
export function successResponse<T>(data: T, statusCode: number = 200): APIGatewayProxyResult {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // 本番では特定のドメインに制限
      'Access-Control-Allow-Credentials': 'true',
    },
    body: JSON.stringify(response),
  };
}

/**
 * エラーレスポンスを生成
 * @param code - エラーコード
 * @param message - エラーメッセージ
 * @param statusCode - HTTPステータスコード
 * @param details - 追加のエラー詳細（オプション）
 * @returns APIGatewayProxyResult
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  statusCode: number,
  details?: any
): APIGatewayProxyResult {
  const error: ApiError = {
    code,
    message,
    details,
  };

  const response: ApiResponse = {
    success: false,
    error,
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
    },
    body: JSON.stringify(response),
  };
}

/**
 * バリデーションエラーレスポンス
 * @param message - エラーメッセージ
 * @param details - バリデーション詳細
 * @returns APIGatewayProxyResult
 */
export function validationErrorResponse(message: string, details?: any): APIGatewayProxyResult {
  return errorResponse(ErrorCode.VALIDATION_ERROR, message, 400, details);
}

/**
 * 認証エラーレスポンス
 * @param message - エラーメッセージ
 * @returns APIGatewayProxyResult
 */
export function unauthorizedResponse(message: string = '認証が必要です'): APIGatewayProxyResult {
  return errorResponse(ErrorCode.UNAUTHORIZED, message, 401);
}

/**
 * 権限エラーレスポンス
 * @param message - エラーメッセージ
 * @returns APIGatewayProxyResult
 */
export function forbiddenResponse(message: string = 'アクセス権限がありません'): APIGatewayProxyResult {
  return errorResponse(ErrorCode.FORBIDDEN, message, 403);
}

/**
 * Not Foundエラーレスポンス
 * @param resource - 見つからなかったリソース名
 * @returns APIGatewayProxyResult
 */
export function notFoundResponse(resource: string = 'リソース'): APIGatewayProxyResult {
  return errorResponse(ErrorCode.NOT_FOUND, `${resource}が見つかりません`, 404);
}

/**
 * 内部サーバーエラーレスポンス
 * @param message - エラーメッセージ
 * @param details - エラー詳細
 * @returns APIGatewayProxyResult
 */
export function internalErrorResponse(
  message: string = '内部サーバーエラーが発生しました',
  details?: any
): APIGatewayProxyResult {
  return errorResponse(ErrorCode.INTERNAL_ERROR, message, 500, details);
}

/**
 * リクエストボディをパース
 * @param body - APIGateway event.body
 * @returns パースされたオブジェクト
 * @throws エラーの場合は例外をスロー
 */
export function parseRequestBody<T>(body: string | null): T {
  if (!body) {
    throw new Error('Request body is empty');
  }

  try {
    return JSON.parse(body) as T;
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * 現在のUnixタイムスタンプ（秒）を取得
 * @returns Unix timestamp (秒)
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * 現在のUnixタイムスタンプ（ミリ秒）を取得
 * @returns Unix timestamp (ミリ秒)
 */
export function getCurrentTimestampMs(): number {
  return Date.now();
}

/**
 * TTLタイムスタンプを生成（指定日数後）
 * @param days - 日数
 * @returns Unix timestamp (秒)
 */
export function getTTLTimestamp(days: number): number {
  return getCurrentTimestamp() + days * 24 * 60 * 60;
}
