/**
 * Likes API クライアント
 * いいね機能のAPI呼び出し
 */

import { apiClient } from './client';
import { ApiResponse } from '@/types/api';

/**
 * いいねAPIのレスポンス型
 */
export interface LikeResponse {
  post_id: string;
  like_count: number;
  is_liked: boolean;
}

/**
 * 投稿にいいねする
 *
 * @param postId - 投稿ID
 * @returns いいね後の投稿情報
 */
export const likePost = async (
  postId: string
): Promise<ApiResponse<LikeResponse>> => {
  return apiClient.post<LikeResponse>(
    `/posts/${postId}/like`,
    {}
  );
};

/**
 * 投稿のいいねを取り消す
 *
 * @param postId - 投稿ID
 * @returns いいね取り消し後の投稿情報
 */
export const unlikePost = async (
  postId: string
): Promise<ApiResponse<LikeResponse>> => {
  return apiClient.delete<LikeResponse>(
    `/posts/${postId}/like`
  );
};

/**
 * いいねAPIのエクスポート
 */
export const likesApi = {
  likePost,
  unlikePost,
};

export default likesApi;
