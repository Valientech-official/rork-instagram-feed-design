/**
 * アプリ内課金カスタムフック
 * react-native-iapとの連携
 */

import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as RNIap from 'react-native-iap';
import { getProductIds, getPackInfoById } from '@/constants/products';
import { useIAPStore } from '@/store/iapStore';

export interface IAPProduct extends RNIap.Product {
  packInfo?: ReturnType<typeof getPackInfoById>;
}

export const useIAP = () => {
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { purchasing, addAIGeneration } = useIAPStore();

  /**
   * IAP初期化と商品情報取得
   */
  useEffect(() => {
    let isActive = true;

    const initIAP = async () => {
      try {
        setLoading(true);
        setError(null);

        // IAP接続
        await RNIap.initConnection();
        console.log('[useIAP] IAP connection established');

        // 商品情報を取得
        const productIds = getProductIds();
        const productsData = await RNIap.getProducts({ skus: productIds });

        if (isActive) {
          // パック情報を追加
          const enrichedProducts: IAPProduct[] = productsData.map((product) => ({
            ...product,
            packInfo: getPackInfoById(product.productId),
          }));

          setProducts(enrichedProducts);
          console.log('[useIAP] Products loaded:', enrichedProducts.length);
        }
      } catch (err: any) {
        if (isActive) {
          console.error('[useIAP] Initialization error:', err);
          setError(err.message || 'アプリ内課金の初期化に失敗しました');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    initIAP();

    // クリーンアップ
    return () => {
      isActive = false;
      RNIap.endConnection();
    };
  }, []);

  /**
   * 購入処理監視（トランザクション更新リスナー）
   */
  useEffect(() => {
    const purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
      async (purchase: RNIap.Purchase) => {
        console.log('[useIAP] Purchase updated:', purchase);

        const receipt = purchase.transactionReceipt;
        if (receipt) {
          try {
            // バックエンドでレシート検証
            // TODO: API実装後に有効化
            // await verifyPurchase(purchase.productId, receipt);

            // 開発中は直接回数を追加
            const packInfo = getPackInfoById(purchase.productId);
            if (packInfo) {
              addAIGeneration(packInfo.count);
              console.log(`[useIAP] Added ${packInfo.count} generations`);
            }

            // トランザクション完了
            if (Platform.OS === 'ios') {
              await RNIap.finishTransaction({ purchase, isConsumable: true });
            } else {
              await RNIap.acknowledgePurchaseAndroid({ purchaseToken: purchase.purchaseToken! });
            }

            console.log('[useIAP] Purchase finished successfully');
          } catch (err) {
            console.error('[useIAP] Purchase verification error:', err);
          }
        }
      }
    );

    const purchaseErrorSubscription = RNIap.purchaseErrorListener((error: RNIap.PurchaseError) => {
      console.warn('[useIAP] Purchase error:', error);
      if (error.code !== 'E_USER_CANCELLED') {
        setError(error.message || '購入処理でエラーが発生しました');
      }
    });

    return () => {
      purchaseUpdateSubscription.remove();
      purchaseErrorSubscription.remove();
    };
  }, [addAIGeneration]);

  /**
   * 商品購入
   */
  const purchaseProduct = async (productId: string) => {
    try {
      setError(null);

      if (Platform.OS === 'ios') {
        await RNIap.requestPurchase({ sku: productId });
      } else {
        await RNIap.requestPurchase({ skus: [productId] });
      }

      console.log('[useIAP] Purchase requested:', productId);
    } catch (err: any) {
      console.error('[useIAP] Purchase request error:', err);

      // ユーザーキャンセルはエラーとして扱わない
      if (err.code !== 'E_USER_CANCELLED') {
        setError(err.message || '購入リクエストに失敗しました');
      }

      throw err;
    }
  };

  /**
   * 購入復元
   */
  const restorePurchases = async () => {
    try {
      setError(null);
      setLoading(true);

      const purchases = await RNIap.getAvailablePurchases();
      console.log('[useIAP] Available purchases:', purchases.length);

      if (purchases.length === 0) {
        throw new Error('復元可能な購入が見つかりませんでした');
      }

      // 各購入について回数を追加
      for (const purchase of purchases) {
        const packInfo = getPackInfoById(purchase.productId);
        if (packInfo) {
          addAIGeneration(packInfo.count);
        }
      }

      return purchases;
    } catch (err: any) {
      console.error('[useIAP] Restore error:', err);
      setError(err.message || '購入復元に失敗しました');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    purchasing,
    purchaseProduct,
    restorePurchases,
  };
};
