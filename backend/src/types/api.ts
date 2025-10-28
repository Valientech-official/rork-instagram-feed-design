/**
 * APIリクエスト/レスポンスの型定義
 */

import { AccountType, PostType, PostVisibility, ErrorCode } from './common';
import { AccountItem, PostItem, CommentItem, RoomItem, NotificationItem, ProductItem } from './dynamodb';

// =====================================================
// 共通レスポンス
// =====================================================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextToken?: string;
  total?: number;
}

// =====================================================
// アカウント管理API
// =====================================================

// アカウント作成
export interface CreateAccountRequest {
  username: string;
  handle: string; // @なし
  email: string;
  password: string;
  phone_number: string;
  account_type?: AccountType;
}

export interface CreateAccountResponse {
  account_id: string;
  handle: string;
  email: string;
}

// ログイン
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  account: AccountSummary;
}

// プロフィール取得
export interface GetProfileResponse {
  account: AccountItem;
}

// プロフィール更新
export interface UpdateProfileRequest {
  username?: string;
  bio?: string;
  website?: string;
  profile_image?: string;
  profile_banner?: string;
}

// アカウントサマリー
export interface AccountSummary {
  account_id: string;
  username: string;
  handle: string;
  profile_image?: string;
  account_type: AccountType;
  is_private: boolean;
}

// =====================================================
// 投稿管理API
// =====================================================

// 投稿作成
export interface CreatePostRequest {
  content: string;
  media_urls?: string[];
  media_type?: 'image' | 'video' | 'mixed';
  visibility: PostVisibility;
  hashtags?: string[];
  room_id?: string;
  post_type: PostType;
  wave_video_url?: string;
  wave_duration?: number;
}

export interface CreatePostResponse {
  post_id: string;
  created_at: number;
}

// 投稿取得
export interface GetPostResponse {
  post: PostItem & { author: AccountSummary };
}

// タイムライン取得
export interface GetTimelineRequest {
  limit?: number;
  nextToken?: string;
}

export interface GetTimelineResponse extends PaginatedResponse<PostItem & { author: AccountSummary }> {}

// 投稿削除
export interface DeletePostRequest {
  post_id: string;
}

// =====================================================
// いいね・コメントAPI
// =====================================================

// いいね追加
export interface LikePostRequest {
  post_id: string;
}

export interface LikePostResponse {
  liked: boolean;
  like_count: number;
}

// コメント作成
export interface CreateCommentRequest {
  post_id: string;
  content: string;
  parent_comment_id?: string;
  reply_to_account_id?: string;
}

export interface CreateCommentResponse {
  comment_id: string;
  created_at: number;
}

// コメント取得
export interface GetCommentsRequest {
  post_id: string;
  limit?: number;
  nextToken?: string;
}

export interface GetCommentsResponse extends PaginatedResponse<CommentItem & { author: AccountSummary }> {}

// =====================================================
// フォロー機能API
// =====================================================

// フォロー
export interface FollowUserRequest {
  following_id: string; // フォロー対象
}

export interface FollowUserResponse {
  followed: boolean;
  is_mutual: boolean;
}

// フォロワー一覧取得
export interface GetFollowersRequest {
  account_id: string;
  limit?: number;
  nextToken?: string;
}

export interface GetFollowersResponse extends PaginatedResponse<AccountSummary> {}

// フォロー中一覧取得
export interface GetFollowingRequest {
  account_id: string;
  limit?: number;
  nextToken?: string;
}

export interface GetFollowingResponse extends PaginatedResponse<AccountSummary> {}

// =====================================================
// ROOM機能API
// =====================================================

// ROOM作成
export interface CreateRoomRequest {
  room_name: string;
  room_handle: string;
  description?: string;
  category: string;
  cover_image_url?: string;
  icon_url?: string;
  rules?: string;
}

export interface CreateRoomResponse {
  room_id: string;
  room_handle: string;
  created_at: number;
}

// ROOM一覧取得
export interface GetRoomsRequest {
  category?: string;
  limit?: number;
  nextToken?: string;
}

export interface GetRoomsResponse extends PaginatedResponse<RoomItem> {}

// ROOM参加
export interface JoinRoomRequest {
  room_id: string;
}

export interface JoinRoomResponse {
  joined: boolean;
  room_id: string;
  rejoined?: boolean;
}

// ROOM投稿取得
export interface GetRoomPostsRequest {
  room_id: string;
  limit?: number;
  nextToken?: string;
}

export interface GetRoomPostsResponse extends PaginatedResponse<PostItem & { author: AccountSummary }> {}

// =====================================================
// 通知API
// =====================================================

// 通知一覧取得
export interface GetNotificationsRequest {
  limit?: number;
  nextToken?: string;
  unread_only?: boolean;
}

export interface GetNotificationsResponse extends PaginatedResponse<NotificationItem & { actor: AccountSummary }> {}

// 既読処理
export interface MarkNotificationAsReadRequest {
  notification_id: string;
}

// =====================================================
// リポストAPI
// =====================================================

// リポスト作成
export interface RepostRequest {
  original_post_id: string;
  comment?: string; // 引用リポスト用
}

export interface RepostResponse {
  repost_id: string;
  created_at: number;
}

// =====================================================
// ショップAPI
// =====================================================

// 商品作成
export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  sale_price?: number;
  image_urls: string[];
  external_url: string;
  category: string;
  tags?: string[];
}

export interface CreateProductResponse {
  product_id: string;
  created_at: number;
}

// 商品一覧取得
export interface GetProductsRequest {
  seller_account_id?: string;
  category?: string;
  limit?: number;
  nextToken?: string;
}

export interface GetProductsResponse extends PaginatedResponse<ProductItem> {}

// =====================================================
// ハッシュタグ検索API
// =====================================================

// ハッシュタグ検索
export interface SearchHashtagRequest {
  hashtag: string; // #なし
  limit?: number;
  nextToken?: string;
}

export interface SearchHashtagResponse extends PaginatedResponse<PostItem & { author: AccountSummary }> {}

// トレンドハッシュタグ取得
export interface GetTrendingHashtagsRequest {
  period?: 'daily' | 'weekly' | 'all_time';
  limit?: number;
}

export interface TrendingHashtag {
  hashtag: string;
  count: number;
}

export interface GetTrendingHashtagsResponse {
  hashtags: TrendingHashtag[];
}
