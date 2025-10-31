/**
 * カスタムエラークラスとエラーハンドリング
 */

import { ErrorCode } from '../../types/common';

/**
 * アプリケーション基底エラークラス
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * 認証エラー
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = '認証が必要です') {
    super(ErrorCode.UNAUTHORIZED, message, 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 権限エラー
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'アクセス権限がありません') {
    super(ErrorCode.FORBIDDEN, message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Not Foundエラー
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'リソース') {
    super(ErrorCode.NOT_FOUND, `${resource}が見つかりません`, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * 重複エラー
 */
export class DuplicateError extends AppError {
  constructor(resource: string, details?: any) {
    super(ErrorCode.DUPLICATE_ERROR, `${resource}は既に存在します`, 409, details);
    this.name = 'DuplicateError';
  }
}

/**
 * いいね重複エラー
 */
export class DuplicateLikeError extends AppError {
  constructor() {
    super(ErrorCode.DUPLICATE_LIKE, '既にいいね済みです', 409);
    this.name = 'DuplicateLikeError';
  }
}

/**
 * フォロー重複エラー
 */
export class DuplicateFollowError extends AppError {
  constructor() {
    super(ErrorCode.DUPLICATE_FOLLOW, '既にフォロー済みです', 409);
    this.name = 'DuplicateFollowError';
  }
}

/**
 * アカウント制限エラー
 */
export class AccountLimitError extends AppError {
  constructor(message: string = 'アカウント作成上限に達しました') {
    super(ErrorCode.ACCOUNT_LIMIT_REACHED, message, 429);
    this.name = 'AccountLimitError';
  }
}

/**
 * プライベートアカウントエラー
 */
export class PrivateAccountError extends AppError {
  constructor() {
    super(ErrorCode.PRIVATE_ACCOUNT, 'このアカウントは非公開です', 403);
    this.name = 'PrivateAccountError';
  }
}

/**
 * ブロック済みエラー
 */
export class BlockedUserError extends AppError {
  constructor() {
    super(ErrorCode.BLOCKED_USER, 'このユーザーをブロックしているため、操作できません', 403);
    this.name = 'BlockedUserError';
  }
}

/**
 * 削除済みコンテンツエラー
 */
export class ContentDeletedError extends AppError {
  constructor(resource: string = 'コンテンツ') {
    super(ErrorCode.CONTENT_DELETED, `${resource}は削除されています`, 410);
    this.name = 'ContentDeletedError';
  }
}

/**
 * エラーがAppErrorかチェック
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

/**
 * エラーログ出力
 * @param error - エラーオブジェクト
 * @param context - コンテキスト情報
 */
export function logError(error: Error, context?: Record<string, any>): void {
  console.error('Error occurred:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(isAppError(error) && {
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    }),
    context,
  });
}
