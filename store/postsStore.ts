/**
 * 投稿管理ストア
 * タイムライン、推薦投稿、いいね、削除を管理
 */

import { create } from 'zustand';
import { Post } from '@/types/api';
import { apiClient } from '@/lib/api/client';
import { handleError } from '@/lib/utils/errorHandler';

interface PostsState {
  // タイムライン投稿
  timelinePosts: Post[];
  timelineNextToken?: string;
  timelineLoading: boolean;
  timelineError: string | null;

  // 推薦投稿
  recommendedPosts: (Post & { score: number })[];
  recommendedNextToken?: string;
  recommendedLoading: boolean;
  recommendedError: string | null;

  // ユーザー投稿
  userPosts: Record<string, Post[]>; // account_id -> posts
  userPostsLoading: Record<string, boolean>;
  userPostsError: Record<string, string | null>;

  // アクション
  fetchTimeline: (refresh?: boolean) => Promise<void>;
  fetchRecommendedPosts: (limit?: number) => Promise<void>;
  fetchUserPosts: (accountId: string, refresh?: boolean) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  loadMoreTimeline: () => Promise<void>;
  loadMoreRecommended: () => Promise<void>;
  clearTimeline: () => void;
  clearRecommended: () => void;
}

export const usePostsStore = create<PostsState>((set, get) => ({
  // 初期状態
  timelinePosts: [],
  timelineNextToken: undefined,
  timelineLoading: false,
  timelineError: null,

  recommendedPosts: [],
  recommendedNextToken: undefined,
  recommendedLoading: false,
  recommendedError: null,

  userPosts: {},
  userPostsLoading: {},
  userPostsError: {},

  /**
   * タイムライン取得
   */
  fetchTimeline: async (refresh = false) => {
    try {
      set({ timelineLoading: true, timelineError: null });

      const response = await apiClient.get<{ items: Post[]; nextToken?: string }>(
        '/timeline',
        {
          limit: 20,
          nextToken: refresh ? undefined : get().timelineNextToken,
        }
      );

      if (response.success && response.data) {
        const { items, nextToken } = response.data;

        set({
          timelinePosts: refresh ? items : [...get().timelinePosts, ...items],
          timelineNextToken: nextToken,
          timelineLoading: false,
        });
      } else {
        throw new Error(response.error?.message || 'タイムラインの取得に失敗しました');
      }
    } catch (error: any) {
      const { message } = handleError(error, 'fetchTimeline');
      set({
        timelineError: message,
        timelineLoading: false,
      });

      if (__DEV__) {
        console.error('[postsStore] fetchTimeline error:', error);
      }
    }
  },

  /**
   * 推薦投稿取得
   */
  fetchRecommendedPosts: async (limit = 20) => {
    try {
      set({ recommendedLoading: true, recommendedError: null });

      const response = await apiClient.get<{
        items: (Post & { score: number })[];
        nextToken?: string;
      }>('/recommendation/timeline', {
        limit,
        nextToken: get().recommendedNextToken,
      });

      if (response.success && response.data) {
        const { items, nextToken } = response.data;

        set({
          recommendedPosts: [...get().recommendedPosts, ...items],
          recommendedNextToken: nextToken,
          recommendedLoading: false,
        });
      } else {
        throw new Error(response.error?.message || '推薦投稿の取得に失敗しました');
      }
    } catch (error: any) {
      const { message } = handleError(error, 'fetchRecommendedPosts');
      set({
        recommendedError: message,
        recommendedLoading: false,
      });

      if (__DEV__) {
        console.error('[postsStore] fetchRecommendedPosts error:', error);
      }
    }
  },

  /**
   * 特定ユーザーの投稿取得
   */
  fetchUserPosts: async (accountId: string, refresh = false) => {
    try {
      set({
        userPostsLoading: { ...get().userPostsLoading, [accountId]: true },
        userPostsError: { ...get().userPostsError, [accountId]: null },
      });

      const response = await apiClient.get<{ items: Post[] }>(
        `/post/user/${accountId}`,
        { limit: 20 }
      );

      if (response.success && response.data) {
        const { items } = response.data;

        set({
          userPosts: {
            ...get().userPosts,
            [accountId]: items,
          },
          userPostsLoading: { ...get().userPostsLoading, [accountId]: false },
        });
      } else {
        throw new Error(response.error?.message || 'ユーザー投稿の取得に失敗しました');
      }
    } catch (error: any) {
      const { message } = handleError(error, 'fetchUserPosts');
      set({
        userPostsError: { ...get().userPostsError, [accountId]: message },
        userPostsLoading: { ...get().userPostsLoading, [accountId]: false },
      });

      if (__DEV__) {
        console.error('[postsStore] fetchUserPosts error:', error);
      }
    }
  },

  /**
   * いいね追加
   */
  likePost: async (postId: string) => {
    try {
      const response = await apiClient.post<{ liked: boolean; like_count: number }>(
        `/post/${postId}/like`
      );

      if (response.success && response.data) {
        const { like_count } = response.data;

        // タイムライン投稿を更新
        set({
          timelinePosts: get().timelinePosts.map((post) =>
            post.post_id === postId
              ? { ...post, is_liked: true, like_count }
              : post
          ),
          recommendedPosts: get().recommendedPosts.map((post) =>
            post.post_id === postId
              ? { ...post, is_liked: true, like_count }
              : post
          ),
        });
      } else {
        throw new Error(response.error?.message || 'いいねに失敗しました');
      }
    } catch (error: any) {
      const { message } = handleError(error, 'likePost');

      if (__DEV__) {
        console.error('[postsStore] likePost error:', error);
      }
      throw error;
    }
  },

  /**
   * いいね解除
   */
  unlikePost: async (postId: string) => {
    try {
      const response = await apiClient.delete<{ liked: boolean; like_count: number }>(
        `/post/${postId}/like`
      );

      if (response.success && response.data) {
        const { like_count } = response.data;

        // タイムライン投稿を更新
        set({
          timelinePosts: get().timelinePosts.map((post) =>
            post.post_id === postId
              ? { ...post, is_liked: false, like_count }
              : post
          ),
          recommendedPosts: get().recommendedPosts.map((post) =>
            post.post_id === postId
              ? { ...post, is_liked: false, like_count }
              : post
          ),
        });
      } else {
        throw new Error(response.error?.message || 'いいね解除に失敗しました');
      }
    } catch (error: any) {
      const { message } = handleError(error, 'unlikePost');

      if (__DEV__) {
        console.error('[postsStore] unlikePost error:', error);
      }
      throw error;
    }
  },

  /**
   * 投稿削除
   */
  deletePost: async (postId: string) => {
    try {
      const response = await apiClient.delete<void>(`/post/${postId}`);

      if (response.success) {
        // ローカルから削除
        set({
          timelinePosts: get().timelinePosts.filter((post) => post.post_id !== postId),
          recommendedPosts: get().recommendedPosts.filter((post) => post.post_id !== postId),
        });
      } else {
        throw new Error(response.error?.message || '投稿の削除に失敗しました');
      }
    } catch (error: any) {
      const { message } = handleError(error, 'deletePost');

      if (__DEV__) {
        console.error('[postsStore] deletePost error:', error);
      }
      throw error;
    }
  },

  /**
   * タイムラインの続きを読み込み
   */
  loadMoreTimeline: async () => {
    if (!get().timelineNextToken || get().timelineLoading) {
      return;
    }

    await get().fetchTimeline(false);
  },

  /**
   * 推薦投稿の続きを読み込み
   */
  loadMoreRecommended: async () => {
    if (!get().recommendedNextToken || get().recommendedLoading) {
      return;
    }

    await get().fetchRecommendedPosts();
  },

  /**
   * タイムラインをクリア
   */
  clearTimeline: () => {
    set({
      timelinePosts: [],
      timelineNextToken: undefined,
      timelineError: null,
    });
  },

  /**
   * 推薦投稿をクリア
   */
  clearRecommended: () => {
    set({
      recommendedPosts: [],
      recommendedNextToken: undefined,
      recommendedError: null,
    });
  },
}));
