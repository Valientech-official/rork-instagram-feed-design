/**
 * Timeline API クライアント
 * タイムライン・ユーザー投稿・おすすめ投稿の取得
 */

import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, Post } from '@/types/api';

/**
 * タイムライン投稿取得のパラメータ
 */
export interface GetTimelineParams {
  limit?: number;
  nextToken?: string;
}

/**
 * ユーザー投稿取得のパラメータ
 */
export interface GetUserPostsParams {
  limit?: number;
  nextToken?: string;
}

/**
 * おすすめ投稿取得のパラメータ
 */
export interface GetRecommendedPostsParams {
  limit?: number;
  nextToken?: string;
}

/**
 * おすすめ投稿のレスポンス型（スコア付き）
 */
export type RecommendedPost = Post & {
  score: number;
};

/**
 * タイムライン投稿を取得
 * フォロー中のユーザーの投稿を時系列で取得
 *
 * @param params - リクエストパラメータ
 * @returns タイムライン投稿のリスト
 */
export const getTimeline = async (
  params: GetTimelineParams = {}
): Promise<ApiResponse<PaginatedResponse<Post>>> => {
  const { limit = 20, nextToken } = params;

  return apiClient.get<PaginatedResponse<Post>>(
    '/timeline',
    {
      limit,
      nextToken,
    }
  );
};

/**
 * 特定ユーザーの投稿を取得
 *
 * @param accountId - アカウントID
 * @param params - リクエストパラメータ
 * @returns ユーザー投稿のリスト
 */
export const getUserPosts = async (
  accountId: string,
  params: GetUserPostsParams = {}
): Promise<ApiResponse<PaginatedResponse<Post>>> => {
  const { limit = 20, nextToken } = params;

  return apiClient.get<PaginatedResponse<Post>>(
    `/account/${accountId}/posts`,
    {
      limit,
      nextToken,
    }
  );
};

/**
 * おすすめ投稿を取得
 * AIレコメンデーションによる推薦投稿を取得
 *
 * @param params - リクエストパラメータ
 * @returns おすすめ投稿のリスト（スコア付き）
 */
export const getRecommendedPosts = async (
  params: GetRecommendedPostsParams = {}
): Promise<ApiResponse<PaginatedResponse<RecommendedPost>>> => {
  const { limit = 10, nextToken } = params;

  return apiClient.get<PaginatedResponse<RecommendedPost>>(
    '/recommendation/timeline',
    {
      limit,
      nextToken,
    }
  );
};

/**
 * タイムラインAPIのエクスポート
 */
export const timelineApi = {
  getTimeline,
  getUserPosts,
  getRecommendedPosts,
};

export default timelineApi;
