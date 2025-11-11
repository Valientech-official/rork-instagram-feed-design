/**
 * Comment API クライアント
 * コメント機能を管理
 */

import apiClient from './client';
import { ApiResponse, Comment, PaginatedResponse } from '@/types/api';

/**
 * コメント取得パラメータ
 */
export interface GetCommentsParams {
  limit?: number;
  nextToken?: string;
  sortBy?: 'latest' | 'oldest' | 'popular';
}

/**
 * コメント作成パラメータ
 */
export interface CreateCommentParams {
  content: string;
  parent_comment_id?: string;
  reply_to_account_id?: string;
}

/**
 * 投稿のコメント一覧を取得
 * @param postId - 投稿ID
 * @param params - クエリパラメータ
 * @returns コメント一覧
 */
export const getComments = async (
  postId: string,
  params: GetCommentsParams = {}
): Promise<ApiResponse<PaginatedResponse<Comment>>> => {
  return apiClient.get<PaginatedResponse<Comment>>(`/posts/${postId}/comments`, params);
};

/**
 * コメントを作成
 * @param postId - 投稿ID
 * @param data - コメントデータ
 * @returns 作成されたコメント
 */
export const createComment = async (
  postId: string,
  data: CreateCommentParams
): Promise<ApiResponse<Comment>> => {
  return apiClient.post<Comment>(`/posts/${postId}/comments`, data);
};

/**
 * コメントを削除
 * @param postId - 投稿ID
 * @param commentId - コメントID
 * @returns 削除結果
 */
export const deleteComment = async (
  postId: string,
  commentId: string
): Promise<ApiResponse<void>> => {
  return apiClient.delete<void>(`/posts/${postId}/comments/${commentId}`);
};

/**
 * コメントにいいね
 * @param postId - 投稿ID
 * @param commentId - コメントID
 * @returns いいね結果
 */
export const likeComment = async (
  postId: string,
  commentId: string
): Promise<ApiResponse<{ liked: boolean; like_count: number }>> => {
  return apiClient.post<{ liked: boolean; like_count: number }>(
    `/posts/${postId}/comments/${commentId}/like`
  );
};

/**
 * コメントのいいねを解除
 * @param postId - 投稿ID
 * @param commentId - コメントID
 * @returns いいね解除結果
 */
export const unlikeComment = async (
  postId: string,
  commentId: string
): Promise<ApiResponse<void>> => {
  return apiClient.delete<void>(`/posts/${postId}/comments/${commentId}/like`);
};

/**
 * 返信コメント一覧を取得
 * @param postId - 投稿ID
 * @param commentId - 親コメントID
 * @param params - クエリパラメータ
 * @returns 返信コメント一覧
 */
export const getReplies = async (
  postId: string,
  commentId: string,
  params: GetCommentsParams = {}
): Promise<ApiResponse<PaginatedResponse<Comment>>> => {
  return apiClient.get<PaginatedResponse<Comment>>(
    `/posts/${postId}/comments/${commentId}/replies`,
    params
  );
};

/**
 * Comment APIのエクスポート
 */
export const commentsApi = {
  getComments,
  createComment,
  deleteComment,
  likeComment,
  unlikeComment,
  getReplies,
};

export default commentsApi;
