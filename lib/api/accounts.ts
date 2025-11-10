/**
 * Account API クライアント
 * プロフィール情報の取得・更新を管理
 */

import apiClient from './client';
import { ApiResponse, AccountProfile, Post } from '@/types/api';

/**
 * プロフィール更新パラメータ
 */
export interface UpdateProfileParams {
  name?: string;
  bio?: string;
  profile_image?: string;
  cover_image?: string;
  website?: string;
  location?: string;
  is_private?: boolean;
}

/**
 * 投稿一覧取得パラメータ
 */
export interface GetPostsParams {
  limit?: number;
  nextToken?: string;
}

/**
 * プロフィール統計情報
 */
export interface ProfileStats {
  posts_count: number;
  followers_count: number;
  following_count: number;
  waves_count?: number;
}

/**
 * 自分のプロフィール情報を取得
 * @returns プロフィール情報
 */
export const getMyProfile = async (): Promise<ApiResponse<AccountProfile>> => {
  return apiClient.get<AccountProfile>('/accounts/me');
};

/**
 * 指定したアカウントのプロフィール情報を取得
 * @param accountId - アカウントID
 * @returns プロフィール情報
 */
export const getProfile = async (accountId: string): Promise<ApiResponse<AccountProfile>> => {
  return apiClient.get<AccountProfile>(`/accounts/${accountId}`);
};

/**
 * 自分のプロフィール情報を更新
 * @param data - 更新するプロフィール情報
 * @returns 更新後のプロフィール情報
 */
export const updateProfile = async (
  data: UpdateProfileParams
): Promise<ApiResponse<AccountProfile>> => {
  return apiClient.put<AccountProfile>('/accounts/me', data);
};

/**
 * 自分の投稿一覧を取得
 * @param params - ページネーションパラメータ
 * @returns 投稿一覧
 */
export const getMyPosts = async (
  params: GetPostsParams = {}
): Promise<ApiResponse<{ items: Post[]; nextToken?: string }>> => {
  return apiClient.get<{ items: Post[]; nextToken?: string }>('/accounts/me/posts', params);
};

/**
 * 指定したアカウントの投稿一覧を取得
 * @param accountId - アカウントID
 * @param params - ページネーションパラメータ
 * @returns 投稿一覧
 */
export const getUserPosts = async (
  accountId: string,
  params: GetPostsParams = {}
): Promise<ApiResponse<{ items: Post[]; nextToken?: string }>> => {
  return apiClient.get<{ items: Post[]; nextToken?: string }>(
    `/accounts/${accountId}/posts`,
    params
  );
};

/**
 * プロフィール統計情報を取得
 * @param accountId - アカウントID（省略時は自分）
 * @returns 統計情報
 */
export const getProfileStats = async (
  accountId?: string
): Promise<ApiResponse<ProfileStats>> => {
  const endpoint = accountId
    ? `/accounts/${accountId}/stats`
    : '/accounts/me/stats';

  return apiClient.get<ProfileStats>(endpoint);
};

/**
 * プロフィール画像をアップロード
 * @param imageUri - 画像URI
 * @returns アップロード後の画像URL
 */
export const uploadProfileImage = async (
  imageUri: string
): Promise<ApiResponse<{ url: string }>> => {
  // TODO: 実際のアップロード処理実装
  // S3へのアップロード処理を実装する
  return apiClient.post<{ url: string }>('/accounts/me/upload-profile-image', {
    image_uri: imageUri,
  });
};

/**
 * カバー画像をアップロード
 * @param imageUri - 画像URI
 * @returns アップロード後の画像URL
 */
export const uploadCoverImage = async (
  imageUri: string
): Promise<ApiResponse<{ url: string }>> => {
  // TODO: 実際のアップロード処理実装
  // S3へのアップロード処理を実装する
  return apiClient.post<{ url: string }>('/accounts/me/upload-cover-image', {
    image_uri: imageUri,
  });
};

/**
 * Account APIのエクスポート
 */
export const accountsApi = {
  getMyProfile,
  getProfile,
  updateProfile,
  getMyPosts,
  getUserPosts,
  getProfileStats,
  uploadProfileImage,
  uploadCoverImage,
};

export default accountsApi;
