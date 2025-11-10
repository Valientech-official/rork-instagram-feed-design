/**
 * リトライロジックユーティリティ
 * 指数バックオフによる自動リトライ機能
 */

/**
 * リトライ設定
 */
export interface RetryOptions {
  maxRetries?: number; // 最大リトライ回数（デフォルト: 3）
  initialDelay?: number; // 初回遅延時間（ミリ秒、デフォルト: 1000）
  maxDelay?: number; // 最大遅延時間（ミリ秒、デフォルト: 10000）
  backoffMultiplier?: number; // バックオフ乗数（デフォルト: 2）
  shouldRetry?: (error: Error) => boolean; // リトライ可否を判定する関数
  onRetry?: (attempt: number, error: Error) => void; // リトライ時のコールバック
}

/**
 * デフォルト設定
 */
const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry'>> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * デフォルトのリトライ可否判定関数
 * ネットワークエラーやタイムアウトの場合にリトライ
 */
const defaultShouldRetry = (error: Error): boolean => {
  // ネットワークエラー
  if (
    error.message.includes('Network') ||
    error.message.includes('timeout') ||
    error.message.includes('Failed to fetch')
  ) {
    return true;
  }

  // HTTPステータスコードが5xx系（サーバーエラー）の場合
  if ('statusCode' in error) {
    const statusCode = (error as any).statusCode;
    if (statusCode >= 500 && statusCode < 600) {
      return true;
    }
  }

  // 429 (Too Many Requests) の場合もリトライ
  if ('statusCode' in error && (error as any).statusCode === 429) {
    return true;
  }

  return false;
};

/**
 * 遅延処理（Promise版のsleep）
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 指数バックオフによる遅延時間を計算
 */
const calculateBackoffDelay = (
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number => {
  // 指数バックオフ: initialDelay * (backoffMultiplier ^ attempt)
  const calculatedDelay = initialDelay * Math.pow(backoffMultiplier, attempt);

  // ジッター（ランダム性）を追加して、同時リトライの衝突を避ける
  const jitter = Math.random() * 0.1 * calculatedDelay; // 最大10%のランダム性

  // 最大遅延時間を超えないようにする
  return Math.min(calculatedDelay + jitter, maxDelay);
};

/**
 * リトライ機能付きで関数を実行
 * @param fn 実行する関数
 * @param options リトライオプション
 * @returns 関数の実行結果
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_OPTIONS.maxRetries,
    initialDelay = DEFAULT_OPTIONS.initialDelay,
    maxDelay = DEFAULT_OPTIONS.maxDelay,
    backoffMultiplier = DEFAULT_OPTIONS.backoffMultiplier,
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 関数を実行
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 最後のリトライの場合、またはリトライすべきでない場合はエラーをスロー
      if (attempt === maxRetries || !shouldRetry(lastError)) {
        throw lastError;
      }

      // リトライ時のコールバックを実行
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // バックオフ遅延
      const delayMs = calculateBackoffDelay(attempt, initialDelay, maxDelay, backoffMultiplier);

      if (__DEV__) {
        console.log(
          `[Retry] Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${Math.round(delayMs)}ms...`,
          lastError.message
        );
      }

      await delay(delayMs);
    }
  }

  // TypeScriptの型チェック用（実際にはここには到達しない）
  throw lastError!;
}

/**
 * リトライ可能な関数を作成するラッパー
 * @param fn 元の関数
 * @param options リトライオプション
 * @returns リトライ機能付きの新しい関数
 */
export function createRetryable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return ((...args: Parameters<T>) => {
    return withRetry(() => fn(...args), options);
  }) as T;
}

/**
 * 複数の操作を順番にリトライ実行
 * いずれかが失敗した場合、その時点でエラーをスロー
 */
export async function retrySequence<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<T[]> {
  const results: T[] = [];

  for (const operation of operations) {
    const result = await withRetry(operation, options);
    results.push(result);
  }

  return results;
}

/**
 * 複数の操作を並列にリトライ実行
 * Promise.allと同様だが、各操作が個別にリトライされる
 */
export async function retryParallel<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<T[]> {
  return Promise.all(
    operations.map(operation => withRetry(operation, options))
  );
}

/**
 * タイムアウト付きリトライ
 * 指定時間内に成功しなかった場合はタイムアウトエラーをスロー
 */
export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  retryOptions: RetryOptions = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    withRetry(fn, retryOptions)
      .then(result => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * リトライ状態を管理するクラス
 */
export class RetryManager {
  private attempts: Map<string, number> = new Map();
  private lastAttemptTime: Map<string, number> = new Map();

  /**
   * 特定のキーに対するリトライ回数を取得
   */
  getAttempts(key: string): number {
    return this.attempts.get(key) || 0;
  }

  /**
   * リトライ回数をインクリメント
   */
  incrementAttempts(key: string): number {
    const current = this.getAttempts(key);
    const newCount = current + 1;
    this.attempts.set(key, newCount);
    this.lastAttemptTime.set(key, Date.now());
    return newCount;
  }

  /**
   * リトライ回数をリセット
   */
  resetAttempts(key: string): void {
    this.attempts.delete(key);
    this.lastAttemptTime.delete(key);
  }

  /**
   * 最後のリトライからの経過時間を取得（ミリ秒）
   */
  getTimeSinceLastAttempt(key: string): number {
    const lastTime = this.lastAttemptTime.get(key);
    if (!lastTime) return Infinity;
    return Date.now() - lastTime;
  }

  /**
   * すべてのリトライ状態をクリア
   */
  clear(): void {
    this.attempts.clear();
    this.lastAttemptTime.clear();
  }
}
