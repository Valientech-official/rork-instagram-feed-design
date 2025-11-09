/**
 * 入力バリデーション関数
 */

import { ValidationError } from '../utils/error';
import { AccountType, PostType, PostVisibility } from '../../types/common';

/**
 * 必須フィールドチェック
 */
export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName}は必須です`);
  }
}

/**
 * 文字列長チェック
 */
export function validateStringLength(
  value: string,
  fieldName: string,
  min?: number,
  max?: number
): void {
  if (min !== undefined && value.length < min) {
    throw new ValidationError(`${fieldName}は${min}文字以上である必要があります`);
  }
  if (max !== undefined && value.length > max) {
    throw new ValidationError(`${fieldName}は${max}文字以下である必要があります`);
  }
}

/**
 * メールアドレス形式チェック
 */
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('有効なメールアドレスを入力してください');
  }
}

/**
 * ハンドル形式チェック（@なし、英数字とアンダースコアのみ）
 */
export function validateHandle(handle: string): void {
  // 長さチェック
  validateStringLength(handle, 'ハンドル', 3, 30);

  // 形式チェック（英数字とアンダースコアのみ、数字のみは不可）
  const handleRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  if (!handleRegex.test(handle)) {
    throw new ValidationError(
      'ハンドルは英字で始まり、英数字とアンダースコアのみ使用できます'
    );
  }

  // 予約語チェック
  const reservedWords = ['admin', 'api', 'www', 'system', 'support', 'help'];
  if (reservedWords.includes(handle.toLowerCase())) {
    throw new ValidationError('このハンドルは使用できません');
  }
}

/**
 * ユーザー名チェック
 */
export function validateUsername(username: string): void {
  validateRequired(username, 'ユーザー名');
  validateStringLength(username, 'ユーザー名', 1, 50);
}

/**
 * パスワード強度チェック
 */
export function validatePassword(password: string): void {
  validateRequired(password, 'パスワード');

  // 最小8文字
  if (password.length < 8) {
    throw new ValidationError('パスワードは8文字以上である必要があります');
  }

  // 最大128文字
  if (password.length > 128) {
    throw new ValidationError('パスワードは128文字以下である必要があります');
  }

  // 少なくとも1つの英字と1つの数字を含む
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    throw new ValidationError('パスワードは英字と数字の両方を含む必要があります');
  }
}

/**
 * 電話番号形式チェック
 */
export function validatePhoneNumber(phoneNumber: string): void {
  validateRequired(phoneNumber, '電話番号');

  // E.164形式（+から始まる国際電話番号）
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phoneNumber)) {
    throw new ValidationError('電話番号はE.164形式（例: +81901234567）で入力してください');
  }
}

/**
 * アカウントタイプチェック
 */
export function validateAccountType(accountType: string): void {
  const validTypes: AccountType[] = ['personal', 'business', 'shop', 'verified', 'admin'];
  if (!validTypes.includes(accountType as AccountType)) {
    throw new ValidationError(`無効なアカウントタイプです: ${accountType}`);
  }
}

/**
 * 投稿タイプチェック
 */
export function validatePostType(postType: string): void {
  const validTypes: PostType[] = ['normal', 'wave'];
  if (!validTypes.includes(postType as PostType)) {
    throw new ValidationError(`無効な投稿タイプです: ${postType}`);
  }
}

/**
 * 投稿公開範囲チェック
 */
export function validatePostVisibility(visibility: string): void {
  const validVisibilities: PostVisibility[] = ['public', 'followers', 'private'];
  if (!validVisibilities.includes(visibility as PostVisibility)) {
    throw new ValidationError(`無効な公開範囲です: ${visibility}`);
  }
}

/**
 * 投稿コンテンツチェック
 */
export function validatePostContent(content: string): void {
  validateRequired(content, '投稿内容');
  validateStringLength(content, '投稿内容', 1, 5000);
}

/**
 * コメントコンテンツチェック
 */
export function validateCommentContent(content: string): void {
  validateRequired(content, 'コメント');
  validateStringLength(content, 'コメント', 1, 1000);
}

/**
 * URLチェック
 */
export function validateURL(url: string, fieldName: string = 'URL'): void {
  try {
    new URL(url);
  } catch {
    throw new ValidationError(`${fieldName}の形式が正しくありません`);
  }
}

/**
 * 配列の長さチェック
 */
export function validateArrayLength(
  array: any[],
  fieldName: string,
  min?: number,
  max?: number
): void {
  if (min !== undefined && array.length < min) {
    throw new ValidationError(`${fieldName}は${min}個以上必要です`);
  }
  if (max !== undefined && array.length > max) {
    throw new ValidationError(`${fieldName}は${max}個以下である必要があります`);
  }
}

/**
 * ハッシュタグ配列チェック
 */
export function validateHashtags(hashtags: string[]): void {
  validateArrayLength(hashtags, 'ハッシュタグ', 0, 30);

  hashtags.forEach((tag) => {
    // #なしで検証
    const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;

    if (cleanTag.length === 0) {
      throw new ValidationError('空のハッシュタグは使用できません');
    }

    if (cleanTag.length > 50) {
      throw new ValidationError('ハッシュタグは50文字以下である必要があります');
    }

    // 英数字、日本語、アンダースコアのみ
    const hashtagRegex = /^[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+$/;
    if (!hashtagRegex.test(cleanTag)) {
      throw new ValidationError(`無効なハッシュタグです: ${tag}`);
    }
  });
}

/**
 * メディアURL配列チェック
 */
export function validateMediaUrls(urls: string[]): void {
  validateArrayLength(urls, 'メディアURL', 0, 10);

  urls.forEach((url) => {
    validateURL(url, 'メディアURL');
  });
}

/**
 * 価格チェック
 */
export function validatePrice(price: number, fieldName: string = '価格'): void {
  if (typeof price !== 'number' || isNaN(price)) {
    throw new ValidationError(`${fieldName}は数値である必要があります`);
  }

  if (price < 0) {
    throw new ValidationError(`${fieldName}は0以上である必要があります`);
  }

  if (price > 10000000) {
    throw new ValidationError(`${fieldName}は10,000,000以下である必要があります`);
  }
}

/**
 * バイオ（自己紹介）チェック
 */
export function validateBio(bio: string): void {
  validateStringLength(bio, 'バイオ', 0, 160);
}

/**
 * ウェブサイトURLチェック
 */
export function validateWebsite(url: string): void {
  validateURL(url, 'ウェブサイト');

  // HTTPSのみ許可
  if (!url.startsWith('https://')) {
    throw new ValidationError('ウェブサイトはHTTPSである必要があります');
  }
}

/**
 * ページネーションlimitチェック
 */
export function validatePaginationLimit(limit?: number): number {
  const defaultLimit = 20;
  const maxLimit = 100;

  if (limit === undefined) {
    return defaultLimit;
  }

  if (limit < 1) {
    throw new ValidationError('limitは1以上である必要があります');
  }

  if (limit > maxLimit) {
    throw new ValidationError(`limitは${maxLimit}以下である必要があります`);
  }

  return limit;
}
