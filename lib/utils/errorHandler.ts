/**
 * エラーハンドリングユーティリティ
 * APIエラーをユーザーフレンドリーなメッセージに変換
 */

import { ErrorCode } from '@/types/common';
import { ApiError } from '@/types/api';

/**
 * APIErrorクラス
 * カスタムエラークラス
 */
export class APIError extends Error {
  public code: ErrorCode;
  public details?: any;
  public statusCode?: number;

  constructor(code: ErrorCode, message: string, details?: any, statusCode?: number) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;

    // プロトタイプチェーンの維持
    Object.setPrototypeOf(this, APIError.prototype);
  }

  /**
   * エラーを文字列表現に変換
   */
  toString(): string {
    return `${this.name} [${this.code}]: ${this.message}`;
  }

  /**
   * エラーをJSON形式で取得
   */
  toJSON(): ApiError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * エラーコードを日本語のユーザー向けメッセージに変換
 */
export const getErrorMessage = (error: ApiError | Error): string => {
  // APIErrorの場合
  if (error instanceof APIError || ('code' in error && 'message' in error)) {
    const apiError = error as ApiError;

    switch (apiError.code) {
      // 認証エラー
      case ErrorCode.UNAUTHORIZED:
        return 'ログインが必要です。再度ログインしてください。';
      case ErrorCode.FORBIDDEN:
        return 'この操作を実行する権限がありません。';

      // バリデーションエラー
      case ErrorCode.VALIDATION_ERROR:
        return '入力内容に誤りがあります。もう一度確認してください。';
      case ErrorCode.INVALID_INPUT:
        return '無効な入力です。正しい形式で入力してください。';

      // リソースエラー
      case ErrorCode.NOT_FOUND:
        return 'リクエストされたデータが見つかりませんでした。';
      case ErrorCode.ALREADY_EXISTS:
        return 'すでに存在しています。';

      // ビジネスロジックエラー
      case ErrorCode.DUPLICATE_ERROR:
        return '重複しています。';
      case ErrorCode.DUPLICATE_LIKE:
        return 'すでにいいねしています。';
      case ErrorCode.DUPLICATE_FOLLOW:
        return 'すでにフォローしています。';
      case ErrorCode.ACCOUNT_LIMIT_REACHED:
        return 'アカウントの上限に達しました。';
      case ErrorCode.REPOST_NOT_ALLOWED:
        return 'この投稿はリポストできません。';
      case ErrorCode.PRIVATE_ACCOUNT:
        return 'このアカウントは非公開です。';
      case ErrorCode.BLOCKED_USER:
        return 'このユーザーはブロックされています。';
      case ErrorCode.CONTENT_DELETED:
        return 'このコンテンツは削除されました。';

      // サーバーエラー
      case ErrorCode.INTERNAL_ERROR:
        return 'サーバーエラーが発生しました。しばらく待ってからもう一度お試しください。';
      case ErrorCode.DATABASE_ERROR:
        return 'データベースエラーが発生しました。しばらく待ってからもう一度お試しください。';

      default:
        // カスタムメッセージがある場合はそれを使用
        return apiError.message || '予期しないエラーが発生しました。';
    }
  }

  // 一般的なErrorの場合
  return error.message || '予期しないエラーが発生しました。';
};

/**
 * エラーをユーザーフレンドリーなタイトルに変換
 */
export const getErrorTitle = (error: ApiError | Error): string => {
  if (error instanceof APIError || ('code' in error && 'message' in error)) {
    const apiError = error as ApiError;

    switch (apiError.code) {
      case ErrorCode.UNAUTHORIZED:
      case ErrorCode.FORBIDDEN:
        return '認証エラー';

      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.INVALID_INPUT:
        return '入力エラー';

      case ErrorCode.NOT_FOUND:
        return '見つかりません';

      case ErrorCode.INTERNAL_ERROR:
      case ErrorCode.DATABASE_ERROR:
        return 'サーバーエラー';

      default:
        return 'エラー';
    }
  }

  return 'エラー';
};

/**
 * エラーがリトライ可能かどうかを判定
 */
export const isRetryableError = (error: ApiError | Error): boolean => {
  if (error instanceof APIError || ('code' in error && 'message' in error)) {
    const apiError = error as ApiError;

    // リトライ可能なエラーコード
    const retryableCodes = [
      ErrorCode.INTERNAL_ERROR,
      ErrorCode.DATABASE_ERROR,
    ];

    return retryableCodes.includes(apiError.code);
  }

  // ネットワークエラーはリトライ可能
  if (error.message.includes('Network') || error.message.includes('timeout')) {
    return true;
  }

  return false;
};

/**
 * エラーが認証エラーかどうかを判定
 */
export const isAuthError = (error: ApiError | Error): boolean => {
  if (error instanceof APIError || ('code' in error && 'message' in error)) {
    const apiError = error as ApiError;
    return apiError.code === ErrorCode.UNAUTHORIZED || apiError.code === ErrorCode.FORBIDDEN;
  }
  return false;
};

/**
 * エラーがネットワークエラーかどうかを判定
 */
export const isNetworkError = (error: Error): boolean => {
  return (
    error.message.includes('Network') ||
    error.message.includes('timeout') ||
    error.message.includes('Failed to fetch') ||
    error.message.includes('Network request failed')
  );
};

/**
 * エラーログを記録（開発環境のみ）
 */
export const logError = (error: Error | ApiError, context?: string): void => {
  if (__DEV__) {
    console.group(`🚨 Error${context ? ` in ${context}` : ''}`);
    console.error('Message:', error.message);

    if (error instanceof APIError) {
      console.error('Code:', error.code);
      console.error('Status:', error.statusCode);
      if (error.details) {
        console.error('Details:', error.details);
      }
    }

    console.error('Stack:', error.stack);
    console.groupEnd();
  }
};

/**
 * ApiErrorからAPIErrorクラスのインスタンスを作成
 */
export const createAPIError = (apiError: ApiError, statusCode?: number): APIError => {
  return new APIError(
    apiError.code,
    apiError.message,
    apiError.details,
    statusCode
  );
};

/**
 * エラーハンドリングのヘルパー関数
 * try-catchブロックで使用
 */
export const handleError = (
  error: Error | ApiError,
  context?: string
): { title: string; message: string; isRetryable: boolean; isAuth: boolean } => {
  logError(error, context);

  return {
    title: getErrorTitle(error),
    message: getErrorMessage(error),
    isRetryable: isRetryableError(error),
    isAuth: isAuthError(error),
  };
};

/**
 * エラーメッセージを表示するためのユーティリティ
 * React Nativeのアラートやトーストに使用
 */
export const formatErrorForDisplay = (error: Error | ApiError): {
  title: string;
  message: string;
  actionLabel?: string;
} => {
  const title = getErrorTitle(error);
  const message = getErrorMessage(error);

  let actionLabel: string | undefined;

  if (isAuthError(error)) {
    actionLabel = 'ログイン';
  } else if (isRetryableError(error)) {
    actionLabel = '再試行';
  }

  return { title, message, actionLabel };
};
