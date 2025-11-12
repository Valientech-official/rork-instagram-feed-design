/**
 * APIリクエスト/レスポンスの型定義（フロントエンド用）
 */

import {
  AccountType,
  PostType,
  PostVisibility,
  ErrorCode,
  ProductCategory,
  Timestamp,
  ULID,
  RecommendationType,
  BehaviorType,
  AIGenerationType,
  AIGenerationStatus,
  SubscriptionStatus,
  SubscriptionPlan,
  PurchasePlatform
} from './common';

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
// アカウント管理
// =====================================================

export interface AccountSummary {
  account_id: string;
  username: string;
  handle: string;
  profile_image?: string;
  account_type: AccountType;
  is_private: boolean;
}

export interface AccountDetail extends AccountSummary {
  bio?: string;
  website?: string;
  profile_banner?: string;
  follower_count: number;
  following_count: number;
  created_at: Timestamp;
}

/**
 * プロフィール情報（統計情報含む）
 */
export interface AccountProfile {
  account_id: string;
  username: string;
  handle: string;
  name?: string;
  bio?: string;
  profile_image?: string;
  cover_image?: string;
  website?: string;
  location?: string;
  is_private: boolean;
  account_type: AccountType;
  posts_count: number;
  followers_count: number;
  following_count: number;
  waves_count?: number;
  created_at: Timestamp;
  updated_at?: Timestamp;
}

export interface UpdateProfileRequest {
  username?: string;
  bio?: string;
  website?: string;
  profile_image?: string;
  profile_banner?: string;
}

// =====================================================
// 投稿管理
// =====================================================

export interface Post {
  postId: ULID;
  accountId: string;
  author: AccountSummary;
  content: string;
  mediaUrls?: string[];
  mediaType?: 'image' | 'video' | 'mixed';
  thumbnailUrl?: string;
  visibility: PostVisibility;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  repostCount: number;
  hashtags?: string[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  isEdited: boolean;
  post_type: PostType;
  waveVideoUrl?: string;
  waveDuration?: number;
  roomId?: string;
  isLiked?: boolean; // フロントエンド用
  isReposted?: boolean; // フロントエンド用
  location?: string; // 位置情報
  allowRepost?: boolean; // リポスト許可
  allowWaveDuet?: boolean; // ウェーブデュエット許可
  editCount?: number; // 編集回数
  isDeleted?: boolean; // 削除フラグ
}

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

export interface GetTimelineResponse extends PaginatedResponse<Post> {}

// =====================================================
// いいね・コメント
// =====================================================

export interface Comment {
  comment_id: string;
  post_id: string;
  account_id: string;
  author: AccountSummary;
  content: string;
  parent_comment_id?: string;
  reply_to_account_id?: string;
  like_count: number;
  reply_count: number;
  created_at: Timestamp;
  is_liked?: boolean; // フロントエンド用
  replies?: Comment[]; // ネストされた返信（フロントエンド用）
}

export interface CreateCommentRequest {
  content: string;
  parent_comment_id?: string;
  reply_to_account_id?: string;
}

export interface GetCommentsResponse extends PaginatedResponse<Comment> {}

// =====================================================
// フォロー機能
// =====================================================

export interface FollowUserResponse {
  followed: boolean;
  is_mutual: boolean;
}

export interface GetFollowersResponse extends PaginatedResponse<AccountSummary> {}

// =====================================================
// Room機能
// =====================================================

export interface Room {
  room_id: string;
  room_name: string;
  room_handle: string;
  description?: string;
  category: string;
  cover_image_url?: string;
  icon_url?: string;
  creator: AccountSummary;
  created_at: Timestamp;
  member_count: number;
  post_count: number;
  is_active: boolean;
  is_joined?: boolean; // フロントエンド用
}

export interface GetRoomsResponse extends PaginatedResponse<Room> {}

// =====================================================
// 通知
// =====================================================

export interface Notification {
  notification_id: string;
  account_id: string;
  actor: AccountSummary;
  type: string;
  target_id?: string;
  created_at: Timestamp;
  is_read: boolean;
}

export interface GetNotificationsResponse extends PaginatedResponse<Notification> {}

// =====================================================
// 商品
// =====================================================

export interface Product {
  productId: string;
  accountId: string;
  name: string;
  description?: string;
  price: number;
  salePrice?: number;
  currency: string;
  imageUrls: string[];
  primaryImageUrl: string;
  externalUrl: string;
  externalShopName?: string;
  category: ProductCategory;
  tags?: string[];
  clickCount: number;
  status: string;
  createdAt: Timestamp;
  seller?: AccountSummary; // フロントエンド用
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  salePrice?: number;
  currency: string;
  imageUrls: string[];
  primaryImageUrl: string;
  externalUrl: string;
  externalShopName?: string;
  category: ProductCategory;
  tags?: string[];
}

export interface GetProductsResponse extends PaginatedResponse<Product> {}

// =====================================================
// DM（ダイレクトメッセージ）
// =====================================================

export interface Conversation {
  conversation_id: string;
  partner: AccountSummary;
  last_message: {
    message_id: string;
    content: string;
    sender_account_id: string;
    created_at: Timestamp;
  } | null;
  last_message_at: Timestamp;
  created_at: Timestamp;
  unread_count?: number; // フロントエンド用
}

export interface Message {
  message_id: string;
  conversation_id: string;
  content: string;
  sender: AccountSummary;
  created_at: Timestamp;
  is_read: boolean;
}

export interface SendMessageRequest {
  content: string;
}

export interface GetConversationsResponse extends PaginatedResponse<Conversation> {}
export interface GetMessagesResponse extends PaginatedResponse<Message> {}

// =====================================================
// ハッシュタグ
// =====================================================

export interface TrendingHashtag {
  hashtag: string;
  count: number;
}

export interface GetTrendingHashtagsResponse {
  hashtags: TrendingHashtag[];
}

// =====================================================
// ライブ配信（追加）
// =====================================================

export interface LiveStream {
  stream_id: string;
  account_id: string;
  streamer: AccountSummary;
  title: string;
  description?: string;
  thumbnail_url?: string;
  playback_url?: string;
  rtmp_url?: string;
  stream_key?: string;
  viewer_count: number;
  like_count: number;
  status: string;
  started_at?: Timestamp;
  ended_at?: Timestamp;
  created_at: Timestamp;
}

export interface CreateLiveStreamRequest {
  title: string;
  description?: string;
  thumbnail_url?: string;
}

export interface GetLiveStreamsResponse extends PaginatedResponse<LiveStream> {}

// =====================================================
// おすすめシステム（新規追加）
// =====================================================

// おすすめ取得リクエスト
export interface GetRecommendationsRequest {
  type: RecommendationType;
  limit?: number;
  nextToken?: string;
  category?: string; // 商品推薦用
}

// おすすめ投稿レスポンス
export interface GetRecommendedPostsResponse extends PaginatedResponse<Post & { score: number }> {}

// おすすめRoomレスポンス
export interface GetRecommendedRoomsResponse extends PaginatedResponse<Room & { score: number }> {}

// おすすめ商品レスポンス
export interface GetRecommendedProductsResponse extends PaginatedResponse<Product & { score: number }> {}

// おすすめユーザーレスポンス
export interface GetRecommendedUsersResponse extends PaginatedResponse<AccountSummary & { score: number; reason?: string }> {}

// おすすめハッシュタグレスポンス
export interface GetRecommendedHashtagsResponse {
  hashtags: Array<TrendingHashtag & { score: number }>;
}

// 行動トラッキングリクエスト
export interface TrackBehaviorRequest {
  behavior_type: BehaviorType;
  target_id: string;
  target_type: 'post' | 'product' | 'user' | 'room' | 'hashtag';
  weight?: number; // 1-10の重み
}

export interface TrackBehaviorResponse {
  success: boolean;
}

// =====================================================
// AI機能（新規追加）
// =====================================================

// AI画像生成リクエスト
export interface GenerateAIImageRequest {
  prompt: string;
  avatar_image: string; // base64またはURL
  item_image: string; // base64またはURL
  aspect_ratio?: string; // "9:16", "16:9", "1:1"
  fit_size?: 'tight' | 'just' | 'relaxed' | 'oversize';
}

// AI画像生成レスポンス
export interface GenerateAIImageResponse {
  generation_id: string;
  image_url: string;
  status: AIGenerationStatus;
  created_at: Timestamp;
}

// AI使用履歴取得
export interface GetAIUsageResponse {
  account_id: string;
  total_generations: number;
  monthly_generations: number;
  monthly_limit: number;
  remaining_generations: number;
  is_premium: boolean;
  reset_at: Timestamp;
}

// AIプロンプトテンプレート
export interface AIPromptTemplate {
  template_id: string;
  name: string;
  description: string;
  category: 'casual' | 'formal' | 'street' | 'seasonal' | 'scene';
  prompt: string;
}

export interface GetAITemplatesResponse {
  templates: AIPromptTemplate[];
}

// =====================================================
// アプリ内課金（新規追加）
// =====================================================

// サブスクリプション情報
export interface Subscription {
  account_id: string;
  subscription_id?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  platform: PurchasePlatform;
  start_date?: Timestamp;
  end_date?: Timestamp;
  auto_renew: boolean;
  is_premium: boolean;
}

// サブスクリプションステータス取得
export interface GetSubscriptionStatusResponse {
  subscription: Subscription;
}

// 購入検証リクエスト
export interface VerifyPurchaseRequest {
  platform: PurchasePlatform;
  receipt_data: string; // レシート情報（Apple/Googleのレシート）
  product_id: string; // "premium_monthly" | "premium_yearly"
}

// 購入検証レスポンス
export interface VerifyPurchaseResponse {
  success: boolean;
  subscription: Subscription;
  transaction_id: string;
}

// 購入履歴
export interface PurchaseHistory {
  purchase_id: string;
  product_id: string;
  platform: PurchasePlatform;
  amount: number;
  currency: string;
  purchased_at: Timestamp;
  expires_at?: Timestamp;
}

export interface GetPurchaseHistoryResponse {
  purchases: PurchaseHistory[];
}

// =====================================================
// 分析・統計
// =====================================================

export interface PostAnalytics {
  post_id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reposts: number;
  engagement_rate: number;
}

export interface AccountAnalytics {
  account_id: string;
  follower_count: number;
  following_count: number;
  post_count: number;
  total_likes: number;
  total_views: number;
  engagement_rate: number;
  growth: {
    followers_last_7_days: number;
    followers_last_30_days: number;
  };
}
