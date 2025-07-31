import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { products } from '@/mocks/products';
import ProductCard from '@/components/ProductCard';
import ShopHeader from '@/components/ShopHeader';
import CategoryScroll from '@/components/CategoryScroll';
import FeaturedProducts from '@/components/FeaturedProducts';
import Colors from '@/constants/colors';

export default function ShopScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredProducts, setFilteredProducts] = useState(products);

  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category);
    
    if (category === 'all') {
      setFilteredProducts(products);
    } else if (category === 'featured') {
      setFilteredProducts(products.filter(product => product.featured));
    } else {
      // Convert category ID to proper format (e.g., 'home-decor' to 'Home Decor')
      const formattedCategory = category
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      setFilteredProducts(products.filter(product => 
        product.category === formattedCategory
      ));
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate a refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <View style={styles.container}>
      <ShopHeader />
      
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={() => (
          <>
            <CategoryScroll onSelectCategory={handleCategorySelect} />
            {selectedCategory === 'all' && <FeaturedProducts products={products} />}
          </>
        )}
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
});