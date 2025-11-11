/**
 * Posts API クライアント
 * 投稿の作成・編集・削除を管理
 */

import apiClient from './client';
import { ApiResponse, Post, CreatePostRequest } from '@/types/api';

/**
 * 投稿を作成
 * @param data - 投稿データ
 * @returns 作成された投稿
 */
export const createPost = async (
  data: CreatePostRequest
): Promise<ApiResponse<Post>> => {
  return apiClient.post<Post>('/posts', data);
};

/**
 * 投稿を更新
 * @param postId - 投稿ID
 * @param data - 更新する投稿データ
 * @returns 更新された投稿
 */
export const updatePost = async (
  postId: string,
  data: Partial<CreatePostRequest>
): Promise<ApiResponse<Post>> => {
  return apiClient.put<Post>(`/posts/${postId}`, data);
};

/**
 * 投稿を削除
 * @param postId - 投稿ID
 * @returns 削除結果
 */
export const deletePost = async (
  postId: string
): Promise<ApiResponse<void>> => {
  return apiClient.delete<void>(`/posts/${postId}`);
};

/**
 * 投稿の詳細を取得
 * @param postId - 投稿ID
 * @returns 投稿詳細
 */
export const getPost = async (
  postId: string
): Promise<ApiResponse<Post>> => {
  return apiClient.get<Post>(`/posts/${postId}`);
};

/**
 * Posts APIのエクスポート
 */
export const postsApi = {
  createPost,
  updatePost,
  deletePost,
  getPost,
};

export default postsApi;
