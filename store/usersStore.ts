/**
 * ユーザー管理ストア
 * プロフィール、フォロー関係、推薦ユーザーを管理
 */

import { create } from 'zustand';
import { AccountSummary, AccountProfile } from '@/types/api';
import { apiClient } from '@/lib/api/client';
import { handleError } from '@/lib/utils/errorHandler';

interface UsersState {
  // プロフィールキャッシュ
  profileCache: Record<string, AccountProfile>; // account_id -> profile
  profileLoading: Record<string, boolean>;
  profileError: Record<string, string | null>;

  // 推薦ユーザー
  recommendedUsers: (AccountSummary & { score?: number })[];
  recommendedLoading: boolean;
  recommendedError: string | null;

  // フォロー中ユーザー
  followingList: Record<string, AccountSummary[]>; // account_id -> following
  followingLoading: Record<string, boolean>;
  followingError: Record<string, string | null>;

  // フォロワー
  followersList: Record<string, AccountSummary[]>; // account_id -> followers
  followersLoading: Record<string, boolean>;
  followersError: Record<string, string | null>;

  // アクション
  getUserProfile: (accountId: string, forceRefresh?: boolean) => Promise<AccountProfile | null>;
  updateProfile: (accountId: string, updates: Partial<AccountProfile>) => Promise<void>;
  followUser: (accountId: string) => Promise<void>;
  unfollowUser: (accountId: string) => Promise<void>;
  fetchRecommendedUsers: (limit?: number) => Promise<void>;
  fetchFollowing: (accountId: string) => Promise<void>;
  fetchFollowers: (accountId: string) => Promise<void>;
  clearCache: () => void;
  clearRecommended: () => void;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  // 初期状態
  profileCache: {},
  profileLoading: {},
  profileError: {},

  recommendedUsers: [],
  recommendedLoading: false,
  recommendedError: null,

  followingList: {},
  followingLoading: {},
  followingError: {},

  followersList: {},
  followersLoading: {},
  followersError: {},

  /**
   * ユーザープロフィール取得（キャッシュ機能付き）
   */
  getUserProfile: async (accountId: string, forceRefresh = false) => {
    // キャッシュチェック
    const cached = get().profileCache[accountId];
    if (cached && !forceRefresh) {
      return cached;
    }

    try {
      set({
        profileLoading: { ...get().profileLoading, [accountId]: true },
        profileError: { ...get().profileError, [accountId]: null },
      });

      const response = await apiClient.get<AccountProfile>(`/account/${accountId}/profile`);

      if (response.success && response.data) {
        set({
          profileCache: {
            ...get().profileCache,
            [accountId]: response.data,
          },
          profileLoading: { ...get().profileLoading, [accountId]: false },
        });

        return response.data;
      } else {
        throw new Error(response.error?.message || 'プロフィールの取得に失敗しました');
      }
    } catch (error: any) {
      const { message } = handleError(error, 'getUserProfile');
      set({
        profileError: { ...get().profileError, [accountId]: message },
        profileLoading: { ...get().profileLoading, [accountId]: false },
      });

      if (__DEV__) {
        console.error('[usersStore] getUserProfile error:', error);
      }

      return null;
    }
  },

  /**
   * プロフィール更新
   */
  updateProfile: async (accountId: string, updates: Partial<AccountProfile>) => {
    try {
      const response = await apiClient.put<AccountProfile>(`/account/${accountId}/profile`, updates);

      if (response.success && response.data) {
        // キャッシュを更新
        set({
          profileCache: {
            ...get().profileCache,
            [accountId]: response.data,
          },
        });
      } else {
        throw new Error(response.error?.message || 'プロフィールの更新に失敗しました');
      }
    } catch (error: any) {
      const { message } = handleError(error, 'updateProfile');

      if (__DEV__) {
        console.error('[usersStore] updateProfile error:', error);
      }
      throw error;
    }
  },

  /**
   * フォロー
   */
  followUser: async (accountId: string) => {
    try {
      const response = await apiClient.post<{ following: boolean; follower_count: number }>(
        `/account/${accountId}/follow`
      );

      if (response.success && response.data) {
        const { follower_count } = response.data;

        // キャッシュされたプロフィールを更新
        const cachedProfile = get().profileCache[accountId];
        if (cachedProfile) {
          set({
            profileCache: {
              ...get().profileCache,
              [accountId]: {
                ...cachedProfile,
                is_following: true,
                follower_count,
              },
            },
          });
        }

        // 推薦ユーザーリストを更新
        set({
          recommendedUsers: get().recommendedUsers.map((user) =>
            user.account_id === accountId
              ? { ...user, is_following: true }
              : user
          ),
        });
      } else {
        throw new Error(response.error?.message || 'フォローに失敗しました');
      }
    } catch (error: any) {
      const { message } = handleError(error, 'followUser');

      if (__DEV__) {
        console.error('[usersStore] followUser error:', error);
      }
      throw error;
    }
  },

  /**
   * フォロー解除
   */
  unfollowUser: async (accountId: string) => {
    try {
      const response = await apiClient.delete<{ following: boolean; follower_count: number }>(
        `/account/${accountId}/follow`
      );

      if (response.success && response.data) {
        const { follower_count } = response.data;

        // キャッシュされたプロフィールを更新
        const cachedProfile = get().profileCache[accountId];
        if (cachedProfile) {
          set({
            profileCache: {
              ...get().profileCache,
              [accountId]: {
                ...cachedProfile,
                is_following: false,
                follower_count,
              },
            },
          });
        }

        // 推薦ユーザーリストを更新
        set({
          recommendedUsers: get().recommendedUsers.map((user) =>
            user.account_id === accountId
              ? { ...user, is_following: false }
              : user
          ),
        });
      } else {
        throw new Error(response.error?.message || 'フォロー解除に失敗しました');
      }
    } catch (error: any) {
      const { message } = handleError(error, 'unfollowUser');

      if (__DEV__) {
        console.error('[usersStore] unfollowUser error:', error);
      }
      throw error;
    }
  },

  /**
   * 推薦ユーザー取得
   */
  fetchRecommendedUsers: async (limit = 20) => {
    try {
      set({ recommendedLoading: true, recommendedError: null });

      const response = await apiClient.get<{
        items: (AccountSummary & { score?: number })[];
      }>('/recommendation/users', { limit });

      if (response.success && response.data) {
        const { items } = response.data;

        set({
          recommendedUsers: items,
          recommendedLoading: false,
        });
      } else {
        throw new Error(response.error?.message || '推薦ユーザーの取得に失敗しました');
      }
    } catch (error: any) {
      const { message } = handleError(error, 'fetchRecommendedUsers');
      set({
        recommendedError: message,
        recommendedLoading: false,
      });

      if (__DEV__) {
        console.error('[usersStore] fetchRecommendedUsers error:', error);
      }
    }
  },

  /**
   * フォロー中ユーザー一覧取得
   */
  fetchFollowing: async (accountId: string) => {
    try {
      set({
        followingLoading: { ...get().followingLoading, [accountId]: true },
        followingError: { ...get().followingError, [accountId]: null },
      });

      const response = await apiClient.get<{ items: AccountSummary[] }>(
        `/account/${accountId}/following`
      );

      if (response.success && response.data) {
        const { items } = response.data;

        set({
          followingList: {
            ...get().followingList,
            [accountId]: items,
          },
          followingLoading: { ...get().followingLoading, [accountId]: false },
        });
      } else {
        throw new Error(response.error?.message || 'フォロー中ユーザーの取得に失敗しました');
      }
    } catch (error: any) {
      const { message } = handleError(error, 'fetchFollowing');
      set({
        followingError: { ...get().followingError, [accountId]: message },
        followingLoading: { ...get().followingLoading, [accountId]: false },
      });

      if (__DEV__) {
        console.error('[usersStore] fetchFollowing error:', error);
      }
    }
  },

  /**
   * フォロワー一覧取得
   */
  fetchFollowers: async (accountId: string) => {
    try {
      set({
        followersLoading: { ...get().followersLoading, [accountId]: true },
        followersError: { ...get().followersError, [accountId]: null },
      });

      const response = await apiClient.get<{ items: AccountSummary[] }>(
        `/account/${accountId}/followers`
      );

      if (response.success && response.data) {
        const { items } = response.data;

        set({
          followersList: {
            ...get().followersList,
            [accountId]: items,
          },
          followersLoading: { ...get().followersLoading, [accountId]: false },
        });
      } else {
        throw new Error(response.error?.message || 'フォロワーの取得に失敗しました');
      }
    } catch (error: any) {
      const { message } = handleError(error, 'fetchFollowers');
      set({
        followersError: { ...get().followersError, [accountId]: message },
        followersLoading: { ...get().followersLoading, [accountId]: false },
      });

      if (__DEV__) {
        console.error('[usersStore] fetchFollowers error:', error);
      }
    }
  },

  /**
   * キャッシュクリア
   */
  clearCache: () => {
    set({
      profileCache: {},
      profileLoading: {},
      profileError: {},
    });
  },

  /**
   * 推薦ユーザーをクリア
   */
  clearRecommended: () => {
    set({
      recommendedUsers: [],
      recommendedError: null,
    });
  },
}));
