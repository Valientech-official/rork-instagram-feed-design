/**
 * IAP (In-App Purchase) 管理ストア
 * サブスクリプション状態、購入履歴管理
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubscriptionStatus, PurchaseHistory } from '@/types/api';
import { apiClient } from '@/lib/api/client';
import { handleError } from '@/lib/utils/errorHandler';

// サブスクリプションプラン
export type SubscriptionPlan = 'free' | 'premium_monthly' | 'premium_yearly';

interface IAPState {
  // サブスクリプション状態
  isPremium: boolean;
  currentPlan: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  statusLoading: boolean;
  statusError: string | null;

  // 購入履歴
  purchaseHistory: PurchaseHistory[];
  historyLoading: boolean;
  historyError: string | null;

  // 購入処理中フラグ
  purchasing: boolean;

  // アクション
  checkSubscriptionStatus: () => Promise<void>;
  purchaseProduct: (productId: string, platform: 'ios' | 'android', receiptData: string) => Promise<void>;
  restorePurchases: (platform: 'ios' | 'android') => Promise<void>;
  fetchPurchaseHistory: () => Promise<void>;
  setPremium: (isPremium: boolean) => void;
  clear: () => void;
}

export const useIAPStore = create<IAPState>()(
  persist(
    (set, get) => ({
      // 初期状態
      isPremium: false,
      currentPlan: 'free',
      subscriptionStatus: undefined,
      statusLoading: false,
      statusError: null,

      purchaseHistory: [],
      historyLoading: false,
      historyError: null,

      purchasing: false,

      /**
       * サブスクリプション状態確認
       */
      checkSubscriptionStatus: async () => {
        try {
          set({ statusLoading: true, statusError: null });

          const response = await apiClient.get<SubscriptionStatus>('/iap/subscription/status');

          if (response.success && response.data) {
            const status = response.data;

            set({
              subscriptionStatus: status,
              isPremium: status.is_premium,
              currentPlan: status.plan,
              statusLoading: false,
            });
          } else {
            throw new Error(response.error?.message || 'サブスクリプション状態の取得に失敗しました');
          }
        } catch (error: any) {
          const { message } = handleError(error, 'checkSubscriptionStatus');
          set({
            statusError: message,
            statusLoading: false,
          });

          if (__DEV__) {
            console.error('[iapStore] checkSubscriptionStatus error:', error);
          }
        }
      },

      /**
       * 商品購入
       */
      purchaseProduct: async (productId: string, platform: 'ios' | 'android', receiptData: string) => {
        try {
          set({ purchasing: true });

          const response = await apiClient.post<{ verified: boolean; subscription: SubscriptionStatus }>(
            '/iap/verify-purchase',
            {
              product_id: productId,
              platform,
              receipt_data: receiptData,
            }
          );

          if (response.success && response.data) {
            const { verified, subscription } = response.data;

            if (verified) {
              set({
                subscriptionStatus: subscription,
                isPremium: subscription.is_premium,
                currentPlan: subscription.plan,
                purchasing: false,
              });

              // 購入履歴を再取得
              await get().fetchPurchaseHistory();
            } else {
              throw new Error('購入の検証に失敗しました');
            }
          } else {
            throw new Error(response.error?.message || '購入処理に失敗しました');
          }
        } catch (error: any) {
          const { message } = handleError(error, 'purchaseProduct');
          set({ purchasing: false });

          if (__DEV__) {
            console.error('[iapStore] purchaseProduct error:', error);
          }

          throw error;
        }
      },

      /**
       * 購入復元
       */
      restorePurchases: async (platform: 'ios' | 'android') => {
        try {
          set({ purchasing: true });

          const response = await apiClient.post<{ restored: boolean; subscriptions: SubscriptionStatus[] }>(
            '/iap/restore-purchases',
            { platform }
          );

          if (response.success && response.data) {
            const { restored, subscriptions } = response.data;

            if (restored && subscriptions.length > 0) {
              // 最新のサブスクリプションを設定
              const latestSub = subscriptions[0];

              set({
                subscriptionStatus: latestSub,
                isPremium: latestSub.is_premium,
                currentPlan: latestSub.plan,
                purchasing: false,
              });

              // 購入履歴を再取得
              await get().fetchPurchaseHistory();
            } else {
              set({ purchasing: false });
              throw new Error('復元可能な購入が見つかりませんでした');
            }
          } else {
            throw new Error(response.error?.message || '購入復元に失敗しました');
          }
        } catch (error: any) {
          const { message } = handleError(error, 'restorePurchases');
          set({ purchasing: false });

          if (__DEV__) {
            console.error('[iapStore] restorePurchases error:', error);
          }

          throw error;
        }
      },

      /**
       * 購入履歴取得
       */
      fetchPurchaseHistory: async () => {
        try {
          set({ historyLoading: true, historyError: null });

          const response = await apiClient.get<{ items: PurchaseHistory[] }>(
            '/iap/purchase-history'
          );

          if (response.success && response.data) {
            const { items } = response.data;

            set({
              purchaseHistory: items,
              historyLoading: false,
            });
          } else {
            throw new Error(response.error?.message || '購入履歴の取得に失敗しました');
          }
        } catch (error: any) {
          const { message } = handleError(error, 'fetchPurchaseHistory');
          set({
            historyError: message,
            historyLoading: false,
          });

          if (__DEV__) {
            console.error('[iapStore] fetchPurchaseHistory error:', error);
          }
        }
      },

      /**
       * プレミアムフラグを設定（開発/テスト用）
       */
      setPremium: (isPremium: boolean) => {
        set({
          isPremium,
          currentPlan: isPremium ? 'premium_monthly' : 'free',
        });
      },

      /**
       * 状態をクリア
       */
      clear: () => {
        set({
          isPremium: false,
          currentPlan: 'free',
          subscriptionStatus: undefined,
          purchaseHistory: [],
          statusError: null,
          historyError: null,
        });
      },
    }),
    {
      name: 'iap-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // 永続化する項目
      partialize: (state) => ({
        isPremium: state.isPremium,
        currentPlan: state.currentPlan,
        subscriptionStatus: state.subscriptionStatus,
      }),
    }
  )
);
