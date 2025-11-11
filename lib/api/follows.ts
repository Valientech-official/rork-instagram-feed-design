/**
 * Follow API クライアント
 * フォロー/アンフォロー機能を管理
 */

import apiClient from './client';
import { ApiResponse, AccountSummary, PaginatedResponse } from '@/types/api';

/**
 * ページネーションパラメータ
 */
export interface GetFollowListParams {
  limit?: number;
  nextToken?: string;
}

/**
 * フォローレスポンス
 */
export interface FollowResponse {
  followed: boolean;
  is_mutual: boolean;
}

/**
 * ユーザーをフォロー
 * @param accountId - フォローするアカウントID
 * @returns フォロー結果
 */
export const followUser = async (accountId: string): Promise<ApiResponse<FollowResponse>> => {
  return apiClient.post<FollowResponse>(`/follows/${accountId}`);
};

/**
 * ユーザーをアンフォロー
 * @param accountId - アンフォローするアカウントID
 * @returns アンフォロー結果
 */
export const unfollowUser = async (accountId: string): Promise<ApiResponse<void>> => {
  return apiClient.delete<void>(`/follows/${accountId}`);
};

/**
 * フォロワー一覧を取得
 * @param accountId - アカウントID（省略時は自分）
 * @param params - ページネーションパラメータ
 * @returns フォロワー一覧
 */
export const getFollowers = async (
  accountId?: string,
  params: GetFollowListParams = {}
): Promise<ApiResponse<PaginatedResponse<AccountSummary>>> => {
  const endpoint = accountId
    ? `/accounts/${accountId}/followers`
    : '/accounts/me/followers';

  return apiClient.get<PaginatedResponse<AccountSummary>>(endpoint, params);
};

/**
 * フォロー中一覧を取得
 * @param accountId - アカウントID（省略時は自分）
 * @param params - ページネーションパラメータ
 * @returns フォロー中一覧
 */
export const getFollowing = async (
  accountId?: string,
  params: GetFollowListParams = {}
): Promise<ApiResponse<PaginatedResponse<AccountSummary>>> => {
  const endpoint = accountId
    ? `/accounts/${accountId}/following`
    : '/accounts/me/following';

  return apiClient.get<PaginatedResponse<AccountSummary>>(endpoint, params);
};

/**
 * フォロー状態を確認
 * @param accountId - 確認するアカウントID
 * @returns フォロー状態
 */
export const checkFollowStatus = async (
  accountId: string
): Promise<ApiResponse<{ is_following: boolean; is_followed_by: boolean }>> => {
  return apiClient.get<{ is_following: boolean; is_followed_by: boolean }>(
    `/follows/${accountId}/status`
  );
};

/**
 * Follow APIのエクスポート
 */
export const followsApi = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus,
};

export default followsApi;
