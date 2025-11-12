import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Text } from 'react-native';
import ProductCard from '@/components/ProductCard';
import ShopHeader from '@/components/ShopHeader';
import CategoryScroll from '@/components/CategoryScroll';
import FeaturedProducts from '@/components/FeaturedProducts';
import Colors from '@/constants/colors';
import { useProductsStore } from '@/store/productsStore';

export default function ShopScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>();

  // Products store
  const {
    products,
    loading,
    recommendedProducts,
    fetchProducts,
    fetchRecommendedProducts,
    loadMore,
    clear,
  } = useProductsStore();

  // 初回読み込み
  useEffect(() => {
    fetchProducts(undefined, true);
    fetchRecommendedProducts();
  }, []);

  const handleCategorySelect = useCallback((category: string) => {
    // 'all'または'featured'の場合はundefinedに変換
    const categoryFilter = category === 'all' || category === 'featured' ? undefined : category;
    setSelectedCategory(categoryFilter);

    // カテゴリ変更時は商品リストをクリアして再取得
    clear();
    fetchProducts(categoryFilter, true);
  }, [fetchProducts, clear]);

  const onRefresh = useCallback(async () => {
    await fetchProducts(selectedCategory, true);
    await fetchRecommendedProducts(selectedCategory);
  }, [fetchProducts, fetchRecommendedProducts, selectedCategory]);

  const handleLoadMore = useCallback(() => {
    if (!loading) {
      loadMore();
    }
  }, [loading, loadMore]);

  return (
    <View style={styles.container}>
      <ShopHeader />

      <FlatList
        data={products}
        keyExtractor={(item) => item.productId}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={() => (
          <>
            <CategoryScroll onSelectCategory={handleCategorySelect} />
            {!selectedCategory && recommendedProducts.length > 0 && (
              <FeaturedProducts products={recommendedProducts} />
            )}
          </>
        )}
        ListFooterComponent={() => {
          if (loading && products.length > 0) {
            return (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="large" color={Colors.light.shopAccent} />
              </View>
            );
          }
          return null;
        }}
        ListEmptyComponent={() => {
          if (!loading) {
            return (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>商品がありません</Text>
              </View>
            );
          }
          return null;
        }}
        renderItem={({ item, index }) => (
          <ProductCard product={item} index={index} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.shopBackground,
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
  },
});