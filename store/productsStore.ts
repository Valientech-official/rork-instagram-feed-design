/**
 * 商品管理ストア
 * 商品一覧、推薦商品、カテゴリフィルタ
 */

import { create } from 'zustand';
import { Product } from '@/types/api';
import { apiClient } from '@/lib/api/client';
import { handleError } from '@/lib/utils/errorHandler';

interface ProductsState {
  // 商品一覧
  products: Product[];
  nextToken?: string;
  loading: boolean;
  error: string | null;

  // 推薦商品
  recommendedProducts: (Product & { score?: number })[];
  recommendedNextToken?: string;
  recommendedLoading: boolean;
  recommendedError: string | null;

  // カテゴリフィルタ
  selectedCategory?: string;

  // アクション
  fetchProducts: (category?: string, refresh?: boolean) => Promise<void>;
  fetchRecommendedProducts: (category?: string, limit?: number) => Promise<void>;
  trackProductClick: (productId: string) => Promise<void>;
  loadMore: () => Promise<void>;
  loadMoreRecommended: () => Promise<void>;
  setCategory: (category?: string) => void;
  clear: () => void;
  clearRecommended: () => void;
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  // 初期状態
  products: [],
  nextToken: undefined,
  loading: false,
  error: null,

  recommendedProducts: [],
  recommendedNextToken: undefined,
  recommendedLoading: false,
  recommendedError: null,

  selectedCategory: undefined,

  /**
   * 商品一覧取得
   */
  fetchProducts: async (category?: string, refresh = false) => {
    try {
      set({ loading: true, error: null });

      const response = await apiClient.get<{
        items: Product[];
        nextToken?: string;
      }>('/product/list', {
        category,
        limit: 20,
        nextToken: refresh ? undefined : get().nextToken,
      });

      if (response.success && response.data) {
        const { items, nextToken } = response.data;

        set({
          products: refresh ? items : [...get().products, ...items],
          nextToken,
          loading: false,
        });
      } else {
        throw new Error(response.error?.message || '商品の取得に失敗しました');
      }
    } catch (error: any) {
      const { message } = handleError(error, 'fetchProducts');
      set({
        error: message,
        loading: false,
      });

      if (__DEV__) {
        console.error('[productsStore] fetchProducts error:', error);
      }
    }
  },

  /**
   * 推薦商品取得
   */
  fetchRecommendedProducts: async (category?: string, limit = 20) => {
    try {
      set({ recommendedLoading: true, recommendedError: null });

      const response = await apiClient.get<{
        items: (Product & { score?: number })[];
        nextToken?: string;
      }>('/recommendation/products', {
        category,
        limit,
        nextToken: get().recommendedNextToken,
      });

      if (response.success && response.data) {
        const { items, nextToken } = response.data;

        set({
          recommendedProducts: [...get().recommendedProducts, ...items],
          recommendedNextToken: nextToken,
          recommendedLoading: false,
        });
      } else {
        throw new Error(response.error?.message || '推薦商品の取得に失敗しました');
      }
    } catch (error: any) {
      const { message } = handleError(error, 'fetchRecommendedProducts');
      set({
        recommendedError: message,
        recommendedLoading: false,
      });

      if (__DEV__) {
        console.error('[productsStore] fetchRecommendedProducts error:', error);
      }
    }
  },

  /**
   * 商品クリック追跡（推薦アルゴリズム用）
   */
  trackProductClick: async (productId: string) => {
    try {
      await apiClient.post<void>(`/product/${productId}/click`);

      if (__DEV__) {
        console.log('[productsStore] Tracked product click:', productId);
      }
    } catch (error: any) {
      // クリック追跡は失敗しても無視（ユーザー体験に影響を与えない）
      if (__DEV__) {
        console.error('[productsStore] trackProductClick error:', error);
      }
    }
  },

  /**
   * 続きを読み込み
   */
  loadMore: async () => {
    if (!get().nextToken || get().loading) {
      return;
    }

    await get().fetchProducts(get().selectedCategory, false);
  },

  /**
   * 推薦商品の続きを読み込み
   */
  loadMoreRecommended: async () => {
    if (!get().recommendedNextToken || get().recommendedLoading) {
      return;
    }

    await get().fetchRecommendedProducts(get().selectedCategory);
  },

  /**
   * カテゴリ設定
   */
  setCategory: (category?: string) => {
    set({ selectedCategory: category });
  },

  /**
   * 商品リストをクリア
   */
  clear: () => {
    set({
      products: [],
      nextToken: undefined,
      error: null,
    });
  },

  /**
   * 推薦商品をクリア
   */
  clearRecommended: () => {
    set({
      recommendedProducts: [],
      recommendedNextToken: undefined,
      recommendedError: null,
    });
  },
}));
