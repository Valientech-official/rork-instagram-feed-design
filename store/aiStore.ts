/**
 * AI機能管理ストア
 * AI生成履歴、使用制限、プロンプトテンプレート管理
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIGenerationResult } from '@/types/api';
import { apiClient } from '@/lib/api/client';
import { handleError } from '@/lib/utils/errorHandler';

// AI生成タイプ
export type AIGenerationType = 'dressup' | 'style_suggestion' | 'caption';

// 使用制限設定
interface UsageLimits {
  free_monthly: number; // 無料プラン月間使用可能回数
  premium_monthly: number; // プレミアム月間使用可能回数
}

// デフォルト制限
const DEFAULT_LIMITS: UsageLimits = {
  free_monthly: 5,
  premium_monthly: 100,
};

interface AIState {
  // AI生成履歴
  generationHistory: AIGenerationResult[];
  historyLoading: boolean;
  historyError: string | null;

  // 使用カウント（ローカルキャッシュ）
  usageCount: number; // 今月の使用回数
  usageLastReset: number; // 最後にリセットした日時（Unix秒）
  usageLimits: UsageLimits;

  // 生成中状態
  generating: boolean;
  generatingType?: AIGenerationType;

  // アクション
  generateImage: (
    type: AIGenerationType,
    prompt: string,
    avatarImage: string,
    itemImage: string,
    options?: { aspect_ratio?: string; fit_size?: string }
  ) => Promise<AIGenerationResult | null>;
  fetchHistory: (limit?: number) => Promise<void>;
  checkUsageLimit: (isPremium: boolean) => boolean;
  incrementUsageCount: () => void;
  resetUsageCount: () => void;
  clearHistory: () => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      // 初期状態
      generationHistory: [],
      historyLoading: false,
      historyError: null,

      usageCount: 0,
      usageLastReset: Date.now() / 1000,
      usageLimits: DEFAULT_LIMITS,

      generating: false,
      generatingType: undefined,

      /**
       * AI画像生成
       */
      generateImage: async (type, prompt, avatarImage, itemImage, options = {}) => {
        try {
          // 使用制限チェック（バックエンドでも行うが、UX向上のためフロントでも確認）
          const isPremium = false; // TODO: IAPストアから取得
          if (!get().checkUsageLimit(isPremium)) {
            throw new Error('今月の生成回数上限に達しました。プレミアムプランへのアップグレードを検討してください。');
          }

          set({ generating: true, generatingType: type });

          const response = await apiClient.post<AIGenerationResult>('/ai/generate-image', {
            type,
            prompt,
            avatar_image: avatarImage,
            item_image: itemImage,
            aspect_ratio: options.aspect_ratio || '9:16',
            fit_size: options.fit_size || 'just',
          });

          if (response.success && response.data) {
            const result = response.data;

            // 履歴に追加
            set({
              generationHistory: [result, ...get().generationHistory],
              generating: false,
              generatingType: undefined,
            });

            // 使用カウントを増やす
            get().incrementUsageCount();

            return result;
          } else {
            throw new Error(response.error?.message || 'AI生成に失敗しました');
          }
        } catch (error: any) {
          const { message } = handleError(error, 'generateImage');

          set({ generating: false, generatingType: undefined });

          if (__DEV__) {
            console.error('[aiStore] generateImage error:', error);
          }

          throw error;
        }
      },

      /**
       * 生成履歴取得
       */
      fetchHistory: async (limit = 20) => {
        try {
          set({ historyLoading: true, historyError: null });

          const response = await apiClient.get<{ items: AIGenerationResult[] }>(
            '/ai/generation-history',
            { limit }
          );

          if (response.success && response.data) {
            const { items } = response.data;

            set({
              generationHistory: items,
              historyLoading: false,
            });
          } else {
            throw new Error(response.error?.message || '履歴の取得に失敗しました');
          }
        } catch (error: any) {
          const { message } = handleError(error, 'fetchHistory');
          set({
            historyError: message,
            historyLoading: false,
          });

          if (__DEV__) {
            console.error('[aiStore] fetchHistory error:', error);
          }
        }
      },

      /**
       * 使用制限チェック
       */
      checkUsageLimit: (isPremium: boolean) => {
        // 月が変わっていればリセット
        const now = Date.now() / 1000;
        const lastReset = get().usageLastReset;
        const currentMonth = new Date(now * 1000).getMonth();
        const lastResetMonth = new Date(lastReset * 1000).getMonth();

        if (currentMonth !== lastResetMonth) {
          get().resetUsageCount();
          return true;
        }

        // 使用制限チェック
        const limit = isPremium
          ? get().usageLimits.premium_monthly
          : get().usageLimits.free_monthly;

        return get().usageCount < limit;
      },

      /**
       * 使用カウントを増やす
       */
      incrementUsageCount: () => {
        set({ usageCount: get().usageCount + 1 });
      },

      /**
       * 使用カウントをリセット
       */
      resetUsageCount: () => {
        set({
          usageCount: 0,
          usageLastReset: Date.now() / 1000,
        });
      },

      /**
       * 履歴をクリア
       */
      clearHistory: () => {
        set({
          generationHistory: [],
          historyError: null,
        });
      },
    }),
    {
      name: 'ai-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // 永続化する項目を選択（履歴はサーバーから取得するため除外）
      partialize: (state) => ({
        usageCount: state.usageCount,
        usageLastReset: state.usageLastReset,
        usageLimits: state.usageLimits,
      }),
    }
  )
);
