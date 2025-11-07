/**
 * DynamoDBテーブルの型定義
 */

import { AccountType, PostType, PostVisibility, LiveStreamStatus, ProductStatus, ProductCategory, NotificationType, ReportTargetType, ReportReason, ReportStatus, MessageType, Timestamp, ULID } from './common';

// =====================================================
// ACCOUNT テーブル
// =====================================================
export interface AccountItem {
  PK: string; // "ACCOUNT#account_id"
  SK: string; // "PROFILE"
  account_id: string;
  username: string;
  handle: string; // @から始まるハンドル
  email: string;
  password_hash: string;
  phone_number?: string; // 電話番号は任意
  account_type: AccountType;
  is_private: boolean;
  two_factor_enabled?: boolean;
  two_factor_type?: 'sms' | 'email';
  phone_number_verified: boolean;
  email_verified: boolean;
  bio?: string;
  website?: string;
  profile_image?: string; // S3 URL
  profile_banner?: string; // S3 URL
  handle_last_changed?: Timestamp;
  handle_change_count: number;
  created_at: Timestamp;
  updated_at: Timestamp;
  follower_count: number;
  following_count: number;
  // GSI属性
  GSI1PK: string; // "EMAIL#email"
  GSI1SK: string; // "ACCOUNT"
  GSI2PK: string; // "HANDLE#handle"
  GSI2SK: string; // "ACCOUNT"
  GSI3PK?: string; // "PHONE#phone_number" (電話番号がある場合のみ)
  GSI3SK?: string; // "CREATED#created_at" (電話番号がある場合のみ)
}

// =====================================================
// SESSION テーブル
// =====================================================
export interface SessionItem {
  PK: string; // "SESSION#account_id"
  SK: string; // "DEVICE#device_id"
  session_id: string;
  account_id: string;
  device_id: string;
  device_name?: string;
  device_type?: 'ios' | 'android' | 'web';
  access_token: string; // JWT
  refresh_token: string;
  ip_address?: string;
  user_agent?: string;
  last_activity: Timestamp;
  created_at: Timestamp;
  ttl: number; // 30日後削除
  // GSI属性
  GSI1PK: string; // "ACCOUNT_SESSIONS#account_id"
  GSI1SK: string; // "CREATED#created_at"
}

// =====================================================
// POST テーブル
// =====================================================
export interface PostItem {
  postId: ULID;
  accountId: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  isEdited: boolean;
  editCount: number;
  content: string;
  mediaUrls?: string[]; // S3キー配列
  mediaType?: 'image' | 'video' | 'mixed';
  thumbnailUrl?: string;
  visibility: PostVisibility;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  repostCount: number; // 追加
  hashtags?: Set<string>; // String Set (SS)
  isDeleted: boolean;
  deletedAt?: Timestamp;
  ttl?: number; // 削除から90日後
  room_id?: string;
  post_type: PostType;
  wave_video_url?: string;
  wave_duration?: number;
  wave_thumbnail_url?: string;
  wave_aspect_ratio?: string;
  allow_repost: boolean;
  allow_wave_duet: boolean;
}

// =====================================================
// HASHTAG_INDEX テーブル
// =====================================================
export interface HashtagIndexItem {
  hashtag: string; // 小文字化済み
  postId: ULID;
  createdAt: Timestamp;
  accountId: string;
  isDeleted: boolean;
}

// =====================================================
// FOLLOW テーブル
// =====================================================
export interface FollowItem {
  follower_id: string; // フォローする側
  following_id: string; // フォローされる側
  created_at: Timestamp;
  is_mutual: boolean;
  is_blocked: boolean;
}

// =====================================================
// LIKE テーブル
// =====================================================
export interface LikeItem {
  post_id: string;
  account_id: string;
  created_at: Timestamp;
}

// =====================================================
// COMMENT テーブル
// =====================================================
export interface CommentItem {
  comment_id: ULID;
  post_id: string;
  account_id: string;
  content: string;
  parent_comment_id?: string; // トップレベルのcomment_id
  reply_to_account_id?: string; // @メンション
  created_at: Timestamp;
  like_count: number;
  reply_count: number;
  is_deleted: boolean; // 運営削除時のみtrue
  deleted_at?: Timestamp;
  deleted_by_admin?: string;
  delete_reason?: string;
  ttl?: number; // 運営削除から90日後
}

// =====================================================
// ROOM テーブル
// =====================================================
export interface RoomItem {
  room_id: ULID;
  room_name: string;
  room_handle: string;
  description?: string;
  category: string;
  cover_image_url?: string;
  icon_url?: string;
  created_by: string;
  created_at: Timestamp;
  member_count: number;
  post_count: number;
  is_active: boolean;
  rules?: string;
}

// =====================================================
// ROOM_MEMBER テーブル
// =====================================================
export interface RoomMemberItem {
  room_id: ULID;
  account_id: string;
  joined_at: Timestamp;
  role: 'member' | 'moderator' | 'admin';
  is_active: boolean;
}

// =====================================================
// NOTIFICATION テーブル
// =====================================================
export interface NotificationItem {
  notification_id: ULID;
  recipient_account_id: string;
  notification_type: NotificationType;
  actor_account_id: string;
  target_post_id?: string;
  target_comment_id?: string;
  source_room_id?: string;
  content_preview?: string;
  created_at: Timestamp;
  is_read: boolean;
  read_at?: Timestamp;
  ttl: number; // 90日後削除
}

// =====================================================
// REPOST テーブル
// =====================================================
export interface RepostItem {
  repost_id: ULID;
  account_id: string;
  original_post_id: string;
  original_author_id: string;
  comment?: string; // 引用リポスト用
  created_at: Timestamp;
  is_deleted: boolean;
}

// =====================================================
// LIVE_STREAM テーブル
// =====================================================
export interface LiveStreamItem {
  stream_id: ULID;
  created_at: Timestamp;
  account_id: string;
  room_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  mux_live_stream_id: string;
  mux_stream_key: string;
  mux_playback_id: string;
  status: LiveStreamStatus;
  viewer_count: number; // ベストプラクティス
  peak_viewer_count: number;
  total_views: number;
  started_at?: Timestamp;
  ended_at?: Timestamp;
  updated_at: Timestamp;
  is_archived: boolean;
  recent_asset_ids?: string[];
  is_deleted: boolean;
  deleted_at?: Timestamp;
  ttl?: number; // 30日後削除
}

// =====================================================
// LIVE_VIEWER テーブル（履歴・分析専用）
// =====================================================
export interface LiveViewerItem {
  viewer_key: string; // "stream_id#account_id"
  joined_at: Timestamp;
  stream_id: string;
  account_id: string;
  is_active: boolean;
  last_ping_at: Timestamp;
  left_at?: Timestamp;
  watch_duration: number;
  total_rejoins: number;
  created_at: Timestamp;
  updated_at: Timestamp;
  ttl?: number; // 7日後削除
}

// =====================================================
// PRODUCT テーブル
// =====================================================
export interface ProductItem {
  product_id: ULID;
  created_at: Timestamp;
  seller_account_id: string;
  name: string;
  description?: string;
  price: number;
  sale_price?: number; // 追加
  currency: string;
  image_urls: string[];
  primary_image_url: string;
  external_url: string;
  external_shop_name?: string;
  category: ProductCategory;
  tags?: string[];
  status: ProductStatus;
  view_count: number;
  click_count: number;
  tag_count: number;
  updated_at: Timestamp;
  deleted_at?: Timestamp;
  is_deleted: boolean;
  ttl?: number; // 90日後削除
}

// =====================================================
// PRODUCT_TAG テーブル
// =====================================================
export interface ProductTagItem {
  post_id: string;
  product_id: string;
  tagged_by_account_id: string;
  seller_account_id: string;
  tagged_at: Timestamp;
}

// =====================================================
// REPORT テーブル
// =====================================================
export interface ReportItem {
  report_id: ULID;
  created_at: Timestamp;
  reporter_account_id: string;
  target_type: ReportTargetType;
  target_id: string;
  target_account_id: string;
  reason: ReportReason;
  description?: string;
  snapshot?: any; // JSON
  status: ReportStatus;
  reviewed_by_account_id?: string;
  reviewed_at?: Timestamp;
  review_note?: string;
  action_taken?: string;
  duplicate_of_report_id?: string;
  updated_at: Timestamp;
  ttl?: number; // 180日後削除
}

// =====================================================
// CONVERSATION テーブル
// =====================================================
export interface ConversationItem {
  conversation_id: ULID;
  created_at: Timestamp;
  participant_ids: string[]; // ソート済み
  participant_1_id: string;
  participant_2_id: string;
  last_message_text?: string;
  last_message_at?: Timestamp;
  last_message_sender_id?: string;
  unread_count_1: number;
  unread_count_2: number;
  is_active: boolean;
  is_archived_by_1: boolean;
  is_archived_by_2: boolean;
  is_muted_by_1: boolean;
  is_muted_by_2: boolean;
  deleted_by_1_at?: Timestamp;
  deleted_by_2_at?: Timestamp;
  updated_at: Timestamp;
}

// =====================================================
// MESSAGE テーブル
// =====================================================
export interface MessageItem {
  conversation_id: string;
  message_id: ULID;
  sender_account_id: string;
  content?: string;
  message_type: MessageType;
  media_url?: string;
  media_type?: string;
  media_width?: number;
  media_height?: number;
  shared_post_id?: string;
  link_preview?: any; // JSON
  is_read: boolean;
  read_at?: Timestamp;
  is_deleted: boolean;
  deleted_at?: Timestamp;
  deleted_by_account_id?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  ttl?: number; // 90日後削除
}

// =====================================================
// BLOCK テーブル
// =====================================================
export interface BlockItem {
  blocker_account_id: string; // ブロックした人
  blocked_account_id: string; // ブロックされた人
  blocked_at: Timestamp;
}
