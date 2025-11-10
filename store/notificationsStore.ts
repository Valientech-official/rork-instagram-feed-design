/**
 * 通知管理ストア
 * 通知一覧、未読カウント、既読管理
 */

import { create } from 'zustand';
import { Notification } from '@/types/api';
import { apiClient } from '@/lib/api/client';
import { handleError } from '@/lib/utils/errorHandler';

interface NotificationsState {
  // 通知一覧
  notifications: Notification[];
  unreadCount: number;
  nextToken?: string;
  loading: boolean;
  error: string | null;

  // アクション
  fetchNotifications: (refresh?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loadMore: () => Promise<void>;
  clear: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  // 初期状態
  notifications: [],
  unreadCount: 0,
  nextToken: undefined,
  loading: false,
  error: null,

  /**
   * 通知一覧取得
   */
  fetchNotifications: async (refresh = false) => {
    try {
      set({ loading: true, error: null });

      const response = await apiClient.get<{
        items: Notification[];
        unread_count: number;
        nextToken?: string;
      }>('/notification/list', {
        limit: 30,
        nextToken: refresh ? undefined : get().nextToken,
      });

      if (response.success && response.data) {
        const { items, unread_count, nextToken } = response.data;

        set({
          notifications: refresh ? items : [...get().notifications, ...items],
          unreadCount: unread_count,
          nextToken,
          loading: false,
        });
      } else {
        throw new Error(response.error?.message || '通知の取得に失敗しました');
      }
    } catch (error: any) {
      const { message } = handleError(error, 'fetchNotifications');
      set({
        error: message,
        loading: false,
      });

      if (__DEV__) {
        console.error('[notificationsStore] fetchNotifications error:', error);
      }
    }
  },

  /**
   * 通知を既読にする
   */
  markAsRead: async (notificationId: string) => {
    try {
      const response = await apiClient.post<void>(`/notification/${notificationId}/read`);

      if (response.success) {
        // ローカルで既読に更新
        set({
          notifications: get().notifications.map((notif) =>
            notif.notification_id === notificationId
              ? { ...notif, is_read: true }
              : notif
          ),
          unreadCount: Math.max(0, get().unreadCount - 1),
        });
      } else {
        throw new Error(response.error?.message || '既読処理に失敗しました');
      }
    } catch (error: any) {
      const { message } = handleError(error, 'markAsRead');

      if (__DEV__) {
        console.error('[notificationsStore] markAsRead error:', error);
      }
      throw error;
    }
  },

  /**
   * すべての通知を既読にする
   */
  markAllAsRead: async () => {
    try {
      const response = await apiClient.post<void>('/notification/read-all');

      if (response.success) {
        // すべてを既読に更新
        set({
          notifications: get().notifications.map((notif) => ({
            ...notif,
            is_read: true,
          })),
          unreadCount: 0,
        });
      } else {
        throw new Error(response.error?.message || '一括既読処理に失敗しました');
      }
    } catch (error: any) {
      const { message } = handleError(error, 'markAllAsRead');

      if (__DEV__) {
        console.error('[notificationsStore] markAllAsRead error:', error);
      }
      throw error;
    }
  },

  /**
   * 続きを読み込み
   */
  loadMore: async () => {
    if (!get().nextToken || get().loading) {
      return;
    }

    await get().fetchNotifications(false);
  },

  /**
   * 通知をクリア
   */
  clear: () => {
    set({
      notifications: [],
      unreadCount: 0,
      nextToken: undefined,
      error: null,
    });
  },
}));
