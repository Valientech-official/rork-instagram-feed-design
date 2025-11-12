/**
 * 商品API クライアント
 */

import { apiClient } from './client';
import { Product, CreateProductRequest, GetProductsResponse } from '@/types/api';
import { ProductCategory } from '@/types/common';

/**
 * 商品一覧取得
 */
export async function getProducts(params?: {
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  limit?: number;
  nextToken?: string;
}) {
  return apiClient.get<GetProductsResponse>('/product/list', params);
}

/**
 * おすすめ商品取得
 */
export async function getRecommendedProducts(params?: {
  category?: ProductCategory;
  limit?: number;
  nextToken?: string;
}) {
  return apiClient.get<{
    items: (Product & { score: number })[];
    nextToken?: string;
  }>('/recommendation/products', params);
}

/**
 * 商品詳細取得
 */
export async function getProduct(productId: string) {
  return apiClient.get<Product>(`/product/${productId}`);
}

/**
 * 商品作成
 */
export async function createProduct(data: CreateProductRequest) {
  return apiClient.post<Product>('/product/create', data);
}

/**
 * 商品更新
 */
export async function updateProduct(productId: string, data: Partial<CreateProductRequest>) {
  return apiClient.put<Product>(`/product/${productId}`, data);
}

/**
 * 商品削除
 */
export async function deleteProduct(productId: string) {
  return apiClient.delete<void>(`/product/${productId}`);
}

/**
 * 商品クリック追跡（推薦アルゴリズム用）
 */
export async function clickProduct(productId: string) {
  return apiClient.post<void>(`/product/${productId}/click`);
}

/**
 * カテゴリ別商品取得
 */
export async function getProductsByCategory(
  category: ProductCategory,
  params?: {
    limit?: number;
    nextToken?: string;
  }
) {
  return apiClient.get<GetProductsResponse>('/product/list', {
    category,
    ...params,
  });
}

/**
 * 商品検索
 */
export async function searchProducts(params: {
  query: string;
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  nextToken?: string;
}) {
  return apiClient.get<GetProductsResponse>('/product/search', params);
}
