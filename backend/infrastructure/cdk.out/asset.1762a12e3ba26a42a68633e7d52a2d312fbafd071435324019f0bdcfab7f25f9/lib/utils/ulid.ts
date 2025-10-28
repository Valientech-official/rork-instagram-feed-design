/**
 * ULID生成ユーティリティ
 * Universally Unique Lexicographically Sortable Identifier
 */

import { ulid } from 'ulid';

/**
 * 新しいULIDを生成
 * @returns ULID文字列 (26文字)
 */
export function generateULID(): string {
  return ulid();
}

/**
 * 特定のタイムスタンプでULIDを生成（テスト用）
 * @param timestamp - Unix timestamp (ミリ秒)
 * @returns ULID文字列
 */
export function generateULIDWithTimestamp(timestamp: number): string {
  return ulid(timestamp);
}

/**
 * ULIDからタイムスタンプを抽出
 * @param id - ULID文字列
 * @returns Unix timestamp (ミリ秒)
 */
export function getTimestampFromULID(id: string): number {
  // ULIDの最初の10文字がタイムスタンプ部分
  const timeChars = id.substring(0, 10);

  // Crockfordのbase32デコード
  const decodeChar = (char: string): number => {
    const encoding = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    return encoding.indexOf(char.toUpperCase());
  };

  let timestamp = 0;
  for (let i = 0; i < timeChars.length; i++) {
    timestamp = timestamp * 32 + decodeChar(timeChars[i]);
  }

  return timestamp;
}

/**
 * ULIDの妥当性を検証
 * @param id - 検証対象の文字列
 * @returns 妥当なULIDの場合true
 */
export function isValidULID(id: string): boolean {
  // 長さチェック
  if (id.length !== 26) {
    return false;
  }

  // 使用可能文字チェック（Crockford's Base32）
  const validChars = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
  return validChars.test(id);
}
