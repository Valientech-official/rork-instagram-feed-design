/**
 * アプリ内課金商品定義（消費型アイテム）
 * AI着せ替え回数パック
 */

import { Platform } from 'react-native';

// 商品ID定義
export const CONSUMABLE_PRODUCTS = {
  ios: {
    pack_5: 'com.yourapp.ai.pack5',
    pack_10: 'com.yourapp.ai.pack10',
    pack_30: 'com.yourapp.ai.pack30',
    pack_50: 'com.yourapp.ai.pack50',
  },
  android: {
    pack_5: 'ai_pack_5',
    pack_10: 'ai_pack_10',
    pack_30: 'ai_pack_30',
    pack_50: 'ai_pack_50',
  },
};

// パック情報
export interface PackInfo {
  id: string;
  name: string;
  price: string;
  count: number;
  pricePerUse: string;
  badge?: string;
  discount?: string;
}

export const PACK_INFO: Record<string, PackInfo> = {
  pack_5: {
    id: 'pack_5',
    name: '5回パック',
    price: '¥50',
    count: 5,
    pricePerUse: '¥10/回',
  },
  pack_10: {
    id: 'pack_10',
    name: '10回パック',
    price: '¥100',
    count: 10,
    pricePerUse: '¥10/回',
    badge: '人気',
  },
  pack_30: {
    id: 'pack_30',
    name: '30回パック',
    price: '¥250',
    count: 30,
    pricePerUse: '¥8.3/回',
    badge: 'お得',
    discount: '17% OFF',
  },
  pack_50: {
    id: 'pack_50',
    name: '50回パック',
    price: '¥350',
    count: 50,
    pricePerUse: '¥7/回',
    badge: '最もお得',
    discount: '30% OFF',
  },
};

// プラットフォームに応じた商品IDを取得
export const getProductIds = (): string[] => {
  const products = Platform.OS === 'ios' ? CONSUMABLE_PRODUCTS.ios : CONSUMABLE_PRODUCTS.android;
  return Object.values(products);
};

// パック情報を取得（プラットフォーム対応）
export const getPackInfoById = (productId: string): PackInfo | undefined => {
  // プラットフォーム別のIDからpackキーを特定
  const packKey = Object.entries(
    Platform.OS === 'ios' ? CONSUMABLE_PRODUCTS.ios : CONSUMABLE_PRODUCTS.android
  ).find(([, id]) => id === productId)?.[0];

  return packKey ? PACK_INFO[packKey] : undefined;
};

// 全パック情報を配列で取得
export const getAllPacks = (): PackInfo[] => {
  return Object.values(PACK_INFO);
};

// 無料枠の設定
export const FREE_GENERATION_COUNT = 5; // 無料で使える回数
