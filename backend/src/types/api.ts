/**
 * APIリクエスト/レスポンスの型定義
 */

import { AccountType, PostType, PostVisibility, ErrorCode, ProductCategory } from './common';
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
  account: AccountItem & {
    posts_count: number;
    waves_count?: number;
  };
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
// post_idはパスパラメータから取得するため、リクエストボディは空
export interface LikePostRequest {
  // 将来の拡張のために空インターフェースとして保持
}

export interface LikePostResponse {
  liked: boolean;
  like_count: number;
}

// コメント作成
// post_idはパスパラメータから取得
export interface CreateCommentRequest {
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
// room_idはパスパラメータから取得するため、リクエストボディは空
export interface JoinRoomRequest {
  // 将来の拡張のために空インターフェースとして保持
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

// 商品作成 (deprecated - use the one in Stage 2C)
// export interface CreateProductRequest {
//   name: string;
//   description?: string;
//   price: number;
//   sale_price?: number;
//   image_urls: string[];
//   external_url: string;
//   category: string;
//   tags?: string[];
// }

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

// =====================================================
// DM（会話・メッセージ）API
// =====================================================

// 会話作成
export interface CreateConversationRequest {
  participant_id: string; // 相手のアカウントID
}

export interface CreateConversationResponse {
  conversation_id: string;
  participant_1_id: string;
  participant_2_id: string;
  created_at: number;
  last_message_at: number;
  is_new: boolean; // 新規作成か既存会話か
}

// 会話一覧取得
export interface GetConversationsRequest {
  limit?: number;
  nextToken?: string;
}

export interface ConversationSummary {
  conversation_id: string;
  partner: AccountSummary; // 相手のアカウント情報
  last_message: {
    message_id: string;
    content: string;
    sender_account_id: string;
    created_at: number;
  } | null;
  last_message_at: number;
  created_at: number;
}

export interface GetConversationsResponse extends PaginatedResponse<ConversationSummary> {}

// メッセージ送信
export interface SendMessageRequest {
  content: string;
}

export interface SendMessageResponse {
  message_id: string;
  conversation_id: string;
  sender_account_id: string;
  content: string;
  created_at: number;
  is_read: boolean;
}

// メッセージ履歴取得
export interface GetMessagesRequest {
  conversation_id: string;
  limit?: number;
  nextToken?: string;
}

export interface MessageDetail {
  message_id: string;
  conversation_id: string;
  content: string;
  sender: AccountSummary;
  created_at: number;
  is_read: boolean;
}

export interface GetMessagesResponse extends PaginatedResponse<MessageDetail> {}

// =====================================================
// Block（ブロック）API
// =====================================================

// ユーザーブロック
export interface BlockUserRequest {
  blocked_account_id: string;
}

export interface BlockUserResponse {
  blocker_account_id: string;
  blocked_account_id: string;
  blocked_at: number;
}

// ブロックリスト取得
export interface BlockedAccount {
  account_id: string;
  username: string;
  handle: string;
  profile_image?: string;
  blocked_at: number;
}

export interface GetBlockListResponse extends PaginatedResponse<BlockedAccount> {}

// =====================================================
// Repost（リポスト）API
// =====================================================

// リポスト作成
export interface CreateRepostRequest {
  post_id: string;
  comment?: string; // 引用リポスト用のコメント（オプション）
}

export interface CreateRepostResponse {
  repost_id: string;
  account_id: string;
  original_post_id: string;
  original_author_id: string;
  comment?: string;
  created_at: number;
}

// =====================================================
// Report（通報）API
// =====================================================

// 通報作成
export interface CreateReportRequest {
  target_type: 'post' | 'account' | 'comment';
  target_id: string;
  reason: string;
  description?: string;
}

export interface CreateReportResponse {
  report_id: string;
  target_type: string;
  target_id: string;
  reporter_account_id: string;
  status: string;
  created_at: number;
}

// 通報一覧取得
export interface GetReportsRequest {
  status?: string; // pending/reviewing/resolved/dismissed
  target_type?: string; // post/account/comment
  limit?: number;
  nextToken?: string;
}

export interface ReportDetail {
  report_id: string;
  target_type: string;
  target_id: string;
  target_account_id: string;
  reporter_account_id: string;
  reason: string;
  description?: string;
  status: string;
  created_at: number;
  reviewed_at?: number;
  reviewed_by_account_id?: string;
}

export interface GetReportsResponse extends PaginatedResponse<ReportDetail> {}

// =====================================================
// Notification（通知）API追加型定義
// =====================================================

// 全通知既読
export interface MarkAllAsReadRequest {
  // リクエストボディは空
}

export interface MarkAllAsReadResponse {
  success: boolean;
  updated_count: number;
}

// 通知既読
export interface MarkAsReadRequest {
  // notification_id はパスパラメータから取得
}

export interface MarkAsReadResponse {
  success: boolean;
}

// 通知設定取得
export interface GetNotificationSettingsRequest {
  // リクエストボディは空
}

export interface NotificationSettings {
  account_id: string;
  enable_push: boolean;
  enable_email: boolean;
  enable_follow: boolean;
  enable_like: boolean;
  enable_comment: boolean;
  enable_repost: boolean;
  enable_mention: boolean;
  enable_dm: boolean;
}

export interface GetNotificationSettingsResponse extends NotificationSettings {}

// 通知設定更新
export interface UpdateNotificationSettingsRequest {
  enable_push?: boolean;
  enable_email?: boolean;
  enable_follow?: boolean;
  enable_like?: boolean;
  enable_comment?: boolean;
  enable_repost?: boolean;
  enable_mention?: boolean;
  enable_dm?: boolean;
}

export interface UpdateNotificationSettingsResponse extends NotificationSettings {}

// =====================================================
// Session（セッション管理）API
// =====================================================

// セッション作成
export interface CreateSessionRequest {
  device_id: string;
  device_name?: string;
  device_type?: 'ios' | 'android' | 'web';
  access_token: string;
  refresh_token: string;
}

export interface CreateSessionResponse {
  session_id: string;
  account_id: string;
  device_id: string;
  access_token: string;
  refresh_token: string;
  created_at: number;
  ttl: number;
}

// アカウント全セッション取得
export interface GetAllAccountSessionsRequest {
  // リクエストボディは空
}

export interface SessionSummary {
  session_id: string;
  device_id: string;
  device_name?: string;
  device_type?: string;
  ip_address?: string;
  last_activity: number;
  created_at: number;
}

export interface GetAllAccountSessionsResponse {
  items: SessionSummary[];
  total: number;
}

// セッション削除（ログアウト）
export interface LogoutSessionRequest {
  // device_id はパスパラメータから取得
}

// =====================================================
// Hashtag（ハッシュタグ）API追加型定義
// =====================================================

// ハッシュタグ検索
export interface SearchByHashtagRequest {
  hashtag?: string; // パスパラメータまたはクエリパラメータ
  limit?: number;
  nextToken?: string;
}

export interface HashtagPost {
  post_id: string;
  account_id: string;
  created_at: number;
}

export interface SearchByHashtagResponse {
  hashtag: string;
  items: HashtagPost[];
  nextToken?: string;
  total?: number;
}

// トレンドハッシュタグ取得（既に定義済みだが、念のため確認）
// getTrendingHashtags は既に GetTrendingHashtagsRequest/Response が定義済み

// =====================================================
// Mute（ミュート）API
// =====================================================

// ユーザーミュート
export interface MuteUserRequest {
  muted_account_id: string;
}

export interface MuteUserResponse {
  account_id: string;
  muted_account_id: string;
  muted_at: number;
}

// ミュート解除
export interface UnmuteUserRequest {
  // account_id はパスパラメータから取得
}

// ミュートリスト取得
export interface GetMutedUsersRequest {
  limit?: number;
  nextToken?: string;
}

export interface MutedAccountDetail {
  account_id: string;
  username: string;
  handle: string;
  profile_image?: string;
  muted_at: number;
}

export interface GetMutedUsersResponse extends PaginatedResponse<MutedAccountDetail> {}

// =====================================================
// Stage 2A: Existing Feature Extensions
// =====================================================

// Post拡張
export interface UpdatePostRequest {
  content?: string;
  media_urls?: string[];
  media_type?: 'image' | 'video' | 'mixed';
  hashtags?: string[];
  visibility?: 'public' | 'followers' | 'room' | 'private';
  allow_repost?: boolean;
  allow_wave_duet?: boolean;
}

export interface UpdatePostResponse {
  post_id: string;
  updated_at: number;
  is_edited: boolean;
  edit_count: number;
}

export interface UserPost {
  post_id: string;
  account_id: string;
  content: string;
  media_urls?: string[];
  media_type?: string;
  thumbnail_url?: string;
  visibility: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  repost_count: number;
  hashtags?: string[];
  created_at: number;
  updated_at?: number;
  is_edited: boolean;
  edit_count: number;
  post_type: string;
  wave_video_url?: string;
  wave_duration?: number;
  wave_thumbnail_url?: string;
  room_id?: string;
}

export interface GetUserPostsResponse {
  account_id: string;
  items: UserPost[];
  nextToken?: string;
  total?: number;
}

export interface DiscoveryPost {
  post_id: string;
  account_id: string;
  author: {
    username: string;
    handle: string;
    profile_image?: string;
  };
  content: string;
  media_urls?: string[];
  media_type?: string;
  thumbnail_url?: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  repost_count: number;
  hashtags?: string[];
  created_at: number;
  post_type: string;
  wave_video_url?: string;
  wave_duration?: number;
  wave_thumbnail_url?: string;
}

export interface GetDiscoveryFeedResponse {
  items: DiscoveryPost[];
  nextToken?: string;
  total?: number;
}

export interface RoomPost {
  post_id: string;
  account_id: string;
  author: {
    username: string;
    handle: string;
    profile_image?: string;
  };
  content: string;
  media_urls?: string[];
  media_type?: string;
  thumbnail_url?: string;
  visibility: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  repost_count: number;
  hashtags?: string[];
  created_at: number;
  updated_at?: number;
  is_edited: boolean;
  post_type: string;
  wave_video_url?: string;
  wave_duration?: number;
  wave_thumbnail_url?: string;
}

export interface GetRoomPostsResponse {
  room_id: string;
  items: RoomPost[];
  nextToken?: string;
  total?: number;
}

// Follow拡張
export interface FollowingAccount {
  account_id: string;
  username: string;
  handle: string;
  profile_image?: string;
  bio?: string;
  follower_count: number;
  following_count: number;
  is_private: boolean;
  account_type: AccountType;
  followed_at: number;
}

export interface GetFollowingResponse {
  account_id: string;
  items: FollowingAccount[];
  nextToken?: string;
  total?: number;
}

export interface FollowerAccount {
  account_id: string;
  username: string;
  handle: string;
  profile_image?: string;
  bio?: string;
  follower_count: number;
  following_count: number;
  is_private: boolean;
  account_type: AccountType;
  followed_at: number;
}

export interface GetFollowersResponse {
  account_id: string;
  items: FollowerAccount[];
  nextToken?: string;
  total?: number;
}

// Like拡張
export interface LikeAccount {
  account_id: string;
  username: string;
  handle: string;
  profile_image?: string;
  bio?: string;
  follower_count: number;
  following_count: number;
  is_private: boolean;
  liked_at: number;
}

export interface GetPostLikesResponse {
  post_id: string;
  items: LikeAccount[];
  nextToken?: string;
  total?: number;
}

export interface LikedPost {
  post_id: string;
  account_id: string;
  content: string;
  media_urls?: string[];
  media_type?: string;
  thumbnail_url?: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  repost_count: number;
  hashtags?: string[];
  created_at: number;
  post_type: string;
  wave_video_url?: string;
  wave_duration?: number;
  wave_thumbnail_url?: string;
  liked_at: number;
}

export interface GetUserLikesResponse {
  account_id: string;
  items: LikedPost[];
  nextToken?: string;
  total?: number;
}

// Repost拡張
export interface RepostedPost {
  repost_id: string;
  original_post_id: string;
  account_id: string;
  post_content: string;
  post_media_urls?: string[];
  post_media_type?: string;
  post_author_id: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  repost_count: number;
  hashtags?: string[];
  post_created_at: number;
  post_type: string;
  wave_video_url?: string;
  wave_duration?: number;
  reposted_at: number;
  comment?: string;
}

export interface GetUserRepostsResponse {
  account_id: string;
  items: RepostedPost[];
  nextToken?: string;
  total?: number;
}

export interface RepostAccount {
  repost_id: string;
  account_id: string;
  username: string;
  handle: string;
  profile_image?: string;
  bio?: string;
  follower_count: number;
  following_count: number;
  is_private: boolean;
  reposted_at: number;
  comment?: string;
}

export interface GetPostRepostsResponse {
  post_id: string;
  items: RepostAccount[];
  nextToken?: string;
  total?: number;
}

// Room拡張
export interface GetRoomResponse {
  room_id: string;
  room_name: string;
  room_handle: string;
  description?: string;
  category: string;
  cover_image_url?: string;
  icon_url?: string;
  creator: {
    account_id: string;
    username: string;
    handle: string;
    profile_image?: string;
  };
  created_at: number;
  member_count: number;
  post_count: number;
  is_active: boolean;
  rules?: string;
}

export interface UpdateRoomRequest {
  room_name?: string;
  description?: string;
  category?: string;
  cover_image_url?: string;
  icon_url?: string;
  rules?: string;
  is_active?: boolean;
}

export interface UpdateRoomResponse {
  room_id: string;
  room_name: string;
  room_handle: string;
  description?: string;
  category: string;
  cover_image_url?: string;
  icon_url?: string;
  is_active: boolean;
  rules?: string;
}

export interface RoomMember {
  account_id: string;
  username: string;
  handle: string;
  profile_image?: string;
  bio?: string;
  follower_count: number;
  following_count: number;
  is_private: boolean;
  joined_at: number;
  role?: string;
}

export interface GetRoomMembersResponse {
  room_id: string;
  items: RoomMember[];
  nextToken?: string;
  total?: number;
}

// =====================================================
// Stage 2B: Analytics
// =====================================================

// trackEvent
export interface TrackEventRequest {
  event_type: string;
  target_type?: 'post' | 'account' | 'comment' | 'room' | 'product';
  target_id?: string;
  metadata?: Record<string, any>;
}

export interface TrackEventResponse {
  event_id: string;
  timestamp: number;
}

// getPostAnalytics
export interface PostAnalytics {
  post_id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reposts: number;
  engagement_rate: number;
  recent_events: Array<{
    event_type: string;
    count: number;
  }>;
  daily_stats?: Array<{
    date: string;
    views: number;
    likes: number;
    comments: number;
  }>;
}

export interface GetPostAnalyticsResponse {
  analytics: PostAnalytics;
}

// getAccountAnalytics
export interface AccountAnalytics {
  account_id: string;
  follower_count: number;
  following_count: number;
  post_count: number;
  total_likes: number;
  total_comments: number;
  total_views: number;
  engagement_rate: number;
  growth: {
    followers_last_7_days: number;
    followers_last_30_days: number;
    posts_last_7_days: number;
    posts_last_30_days: number;
  };
  top_posts: Array<{
    post_id: string;
    views: number;
    likes: number;
    comments: number;
  }>;
}

export interface GetAccountAnalyticsResponse {
  analytics: AccountAnalytics;
}

// getDashboard
export interface DashboardData {
  overview: {
    follower_count: number;
    following_count: number;
    post_count: number;
    total_likes: number;
    total_views: number;
    engagement_rate: number;
  };
  recent_activity: Array<{
    event_type: string;
    count: number;
    last_occurred: number;
  }>;
  trending_posts: Array<{
    post_id: string;
    views: number;
    likes: number;
    engagement_rate: number;
  }>;
  audience_insights: {
    active_hours: Record<string, number>;
    top_locations?: string[];
  };
}

export interface GetDashboardResponse {
  dashboard: DashboardData;
}

// =====================================================
// Stage 2C: Product/Shop
// =====================================================

// createProduct
export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  sale_price?: number;
  currency: string;
  image_urls: string[];
  primary_image_url: string;
  external_url: string;
  external_shop_name?: string;
  category: ProductCategory;
  tags?: string[];
}

export interface CreateProductResponse {
  product_id: string;
  created_at: number;
}

// getProduct
export interface GetProductResponse {
  product: ProductItem;
  seller: {
    account_id: string;
    username: string;
    handle: string;
    profile_image?: string;
    account_type: string;
  };
}

// updateProduct
export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  sale_price?: number;
  currency?: string;
  image_urls?: string[];
  primary_image_url?: string;
  external_url?: string;
  external_shop_name?: string;
  category?: ProductCategory;
  tags?: string[];
  status?: 'active' | 'inactive';
}

export interface UpdateProductResponse {
  product_id: string;
  updated_at: number;
}

// deleteProduct
export interface DeleteProductResponse {
  product_id: string;
  deleted_at: number;
}

// getProducts
export interface GetProductsResponse {
  items: ProductItem[];
  nextToken?: string;
  count: number;
}

// tagProductOnPost
export interface TagProductOnPostRequest {
  product_ids: string[];
}

export interface TagProductOnPostResponse {
  post_id: string;
  tagged_products: number;
  tags: Array<{
    product_id: string;
    tagged_at: number;
  }>;
}

// getPostProducts
export interface GetPostProductsResponse {
  post_id: string;
  products: Array<{
    product: ProductItem;
    seller: {
      account_id: string;
      username: string;
      handle: string;
      profile_image?: string;
    };
    tagged_at: number;
    tagged_by_account_id: string;
  }>;
  count: number;
}

// clickProduct
export interface ClickProductResponse {
  product_id: string;
  external_url: string;
  click_count: number;
}
