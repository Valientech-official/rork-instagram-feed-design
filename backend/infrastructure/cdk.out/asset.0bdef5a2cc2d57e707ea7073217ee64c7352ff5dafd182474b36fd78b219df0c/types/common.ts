/**
 * 共通型定義
 */

// アカウントタイプ（admin追加済み）
export type AccountType = 'personal' | 'business' | 'shop' | 'verified' | 'admin';

// 投稿タイプ
export type PostType = 'normal' | 'wave';

// 投稿の公開範囲
export type PostVisibility = 'public' | 'followers' | 'private';

// ライブ配信ステータス
export type LiveStreamStatus = 'idle' | 'active' | 'disabled';

// 商品ステータス
export type ProductStatus = 'active' | 'inactive' | 'deleted';

// 商品カテゴリ
export type ProductCategory = 'fashion' | 'beauty' | 'food' | 'other';

// 通知タイプ
export type NotificationType =
  | 'follow'
  | 'like_post'
  | 'like_comment'
  | 'comment'
  | 'reply'
  | 'mention_post'
  | 'mention_comment'
  | 'room_post'
  | 'room_live_started'
  | 'room_wave_posted'
  | 'follow_live_started'
  | 'follow_wave_posted'
  | 'repost'
  | 'quote_repost';

// 通報タイプ
export type ReportTargetType = 'post' | 'comment' | 'account' | 'live_stream' | 'message';

// 通報理由
export type ReportReason = 'spam' | 'harassment' | 'violence' | 'hate_speech' | 'misinformation' | 'other';

// 通報ステータス
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected';

// メッセージタイプ
export type MessageType = 'text' | 'image' | 'video' | 'link' | 'post_share';

// エラーコード
export enum ErrorCode {
  // 認証エラー
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // バリデーションエラー
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // リソースエラー
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',

  // ビジネスロジックエラー
  DUPLICATE_ERROR = 'DUPLICATE_ERROR',
  DUPLICATE_LIKE = 'DUPLICATE_LIKE',
  DUPLICATE_FOLLOW = 'DUPLICATE_FOLLOW',
  ACCOUNT_LIMIT_REACHED = 'ACCOUNT_LIMIT_REACHED',
  REPOST_NOT_ALLOWED = 'REPOST_NOT_ALLOWED',
  PRIVATE_ACCOUNT = 'PRIVATE_ACCOUNT',
  BLOCKED_USER = 'BLOCKED_USER',
  CONTENT_DELETED = 'CONTENT_DELETED',

  // サーバーエラー
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

// ページネーション
export interface Pagination {
  limit: number;
  nextToken?: string;
}

// タイムスタンプ
export type Timestamp = number; // Unix秒

// ULID
export type ULID = string;
