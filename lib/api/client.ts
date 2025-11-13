/**
 * ベースAPIクライアント
 * 全APIリクエストの基盤となるクラス
 */

import Constants from 'expo-constants';
import { fetchAuthSession } from 'aws-amplify/auth';
import { ApiResponse, ApiError } from '@/types/api';
import { ErrorCode } from '@/types/common';

// 環境別エンドポイント設定
const getApiUrl = (): string => {
  const environment = Constants.expoConfig?.extra?.EXPO_PUBLIC_ENVIRONMENT || 'development';
  const apiUrl = Constants.expoConfig?.extra?.API_URL;

  if (apiUrl) {
    return apiUrl;
  }

  // デフォルトのdev環境URL
  return 'https://1k88cwk5zk.execute-api.ap-northeast-1.amazonaws.com/dev/';
};

// リクエストオプション
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
  timeout?: number;
}

/**
 * ベースAPIクライアントクラス
 */
export class BaseAPIClient {
  private baseUrl: string;
  private defaultTimeout: number = 30000; // 30秒

  constructor() {
    this.baseUrl = getApiUrl();
  }

  /**
   * 認証トークンを取得
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();

      // デバッグ: トークン情報を確認
      if (__DEV__) {
        console.log('[API Client] Token exists:', !!idToken);
        if (idToken) {
          // 完全なトークンを出力（デバッグ用）
          console.log('[API Client] Full Token:', idToken);
          console.log('[API Client] Token length:', idToken.length);

          // トークンのペイロードをデコード
          try {
            const parts = idToken.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              console.log('[API Client] Token Payload:', {
                iss: payload.iss,
                aud: payload.aud,
                client_id: payload.client_id,
                token_use: payload.token_use,
                exp: payload.exp,
                exp_date: new Date(payload.exp * 1000).toISOString(),
                sub: payload.sub,
              });

              // 有効期限チェック
              const now = Math.floor(Date.now() / 1000);
              const isExpired = payload.exp < now;
              console.log('[API Client] Token expired:', isExpired);
              if (isExpired) {
                console.warn('[API Client] Token is expired! Exp:', payload.exp, 'Now:', now);
              }
            }
          } catch (e) {
            console.warn('[API Client] Failed to decode token:', e);
          }
        }
      }

      if (!idToken) {
        console.warn('[API Client] No auth token found. User may not be logged in.');
      }
      return idToken || null;
    } catch (error) {
      console.error('[API Client] Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * リクエストヘッダーを生成
   */
  private async buildHeaders(
    customHeaders?: Record<string, string>,
    requiresAuth: boolean = true
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (requiresAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        // トークンがない場合はエラーをthrow
        throw new Error('認証が必要です。ログインしてください。');
      }
    }

    return headers;
  }

  /**
   * リクエストインターセプター
   * リクエスト送信前の共通処理
   */
  private async requestInterceptor(
    url: string,
    options: RequestOptions
  ): Promise<{ url: string; options: RequestInit }> {
    const headers = await this.buildHeaders(options.headers, options.requiresAuth);

    const requestOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
    };

    if (options.body && options.method !== 'GET') {
      requestOptions.body = JSON.stringify(options.body);
    }

    // ログ出力（開発環境のみ）
    if (__DEV__) {
      console.log(`[API Request] ${options.method || 'GET'} ${url}`);
      if (options.body) {
        console.log('[API Request Body]', options.body);
      }
      // ヘッダー確認（トークンは除外）
      const headersForLog = { ...headers };
      if (headersForLog.Authorization) {
        headersForLog.Authorization = headersForLog.Authorization.substring(0, 20) + '...';
      }
      console.log('[API Request Headers]', headersForLog);
    }

    return { url: this.baseUrl + url, options: requestOptions };
  }

  /**
   * レスポンスインターセプター
   * レスポンス受信後の共通処理
   */
  private async responseInterceptor<T>(response: Response): Promise<ApiResponse<T>> {
    // ログ出力（開発環境のみ）
    if (__DEV__) {
      console.log(`[API Response] ${response.status} ${response.url}`);
    }

    // レスポンスボディを取得
    let data: any;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // ステータスコードでエラーハンドリング
    if (!response.ok) {
      const error: ApiError = {
        code: this.mapHttpStatusToErrorCode(response.status),
        message: data?.message || data?.error || `HTTP Error ${response.status}`,
        details: data,
      };

      if (__DEV__) {
        console.error('[API Error]', error);
      }

      return {
        success: false,
        error,
      };
    }

    // 成功レスポンス
    return {
      success: true,
      data: data?.data || data,
    };
  }

  /**
   * HTTPステータスコードをアプリのエラーコードにマッピング
   */
  private mapHttpStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case 401:
        return ErrorCode.UNAUTHORIZED;
      case 403:
        return ErrorCode.FORBIDDEN;
      case 404:
        return ErrorCode.NOT_FOUND;
      case 409:
        return ErrorCode.DUPLICATE_ERROR;
      case 422:
        return ErrorCode.VALIDATION_ERROR;
      case 500:
      case 502:
      case 503:
      case 504:
        return ErrorCode.INTERNAL_ERROR;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }

  /**
   * タイムアウト付きfetch
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * 汎用リクエストメソッド
   */
  public async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      // リクエストインターセプター
      const { url, options: requestOptions } = await this.requestInterceptor(
        endpoint,
        options
      );

      // タイムアウト付きでリクエスト実行
      const timeout = options.timeout || this.defaultTimeout;
      const response = await this.fetchWithTimeout(url, requestOptions, timeout);

      // レスポンスインターセプター
      return await this.responseInterceptor<T>(response);
    } catch (error: any) {
      console.error('[API Client Error]', error);

      // ネットワークエラー等のハンドリング
      const apiError: ApiError = {
        code: ErrorCode.INTERNAL_ERROR,
        message: error.message || 'Network error occurred',
        details: error,
      };

      return {
        success: false,
        error: apiError,
      };
    }
  }

  /**
   * GETリクエスト
   */
  public async get<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    let url = endpoint;

    // クエリパラメータを追加
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * POSTリクエスト
   */
  public async post<T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUTリクエスト
   */
  public async put<T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * PATCHリクエスト
   */
  public async patch<T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  /**
   * DELETEリクエスト
   */
  public async delete<T = any>(
    endpoint: string,
    options?: Omit<RequestOptions, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * ベースURLを取得（テスト用）
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * ベースURLを設定（テスト用）
   */
  public setBaseUrl(url: string): void {
    this.baseUrl = url;
  }
}

// シングルトンインスタンス
export const apiClient = new BaseAPIClient();

// デフォルトエクスポート
export default apiClient;
