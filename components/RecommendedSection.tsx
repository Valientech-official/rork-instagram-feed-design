import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { products, Product } from '@/mocks/products';
import Colors from '@/constants/colors';

interface RecommendedSectionProps {
  selectedGender?: string;
  selectedClothingItems?: string[];
  selectedStyleCategories?: string[];
}

export default function RecommendedSection({
  selectedGender = 'メンズ',
  selectedClothingItems = [],
  selectedStyleCategories = []
}: RecommendedSectionProps) {
  const router = useRouter();

  // Get personalized recommendations based on user selections
  const recommendedProducts = useMemo(() => {
    let recommendations = [...products];

    // Filter by gender preference
    recommendations = recommendations.filter(product =>
      product.gender === selectedGender || product.gender === 'ユニセックス'
    );

    // If user has selected items or categories, prioritize matching products
    if (selectedClothingItems.length > 0 || selectedStyleCategories.length > 0) {
      // Sort by relevance
      recommendations.sort((a, b) => {
        const aScore = calculateRelevanceScore(a);
        const bScore = calculateRelevanceScore(b);
        return bScore - aScore;
      });
    } else {
      // Default: show featured and high-rated products
      recommendations = recommendations.filter(p => p.featured || p.rating >= 4.5);
    }

    // Return top 6 recommendations
    return recommendations.slice(0, 6);
  }, [selectedGender, selectedClothingItems, selectedStyleCategories]);

  const calculateRelevanceScore = (product: Product): number => {
    let score = 0;

    // Add points for matching style categories
    if (selectedStyleCategories.length > 0) {
      const hasMatchingTag = product.tags.some(tag =>
        selectedStyleCategories.some(catId => {
          // Simple matching logic - can be enhanced
          return tag.toLowerCase().includes(catId) || catId.includes(tag.toLowerCase());
        })
      );
      if (hasMatchingTag) score += 3;
    }

    // Add points for high rating
    score += product.rating;

    // Add bonus for featured products
    if (product.featured) score += 2;

    return score;
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => handleProductPress(item.id)}
    >
      <Image
        source={{ uri: item.images[0] }}
        style={styles.productImage}
        contentFit="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.brandName} numberOfLines={1}>{item.brand}</Text>
        <View style={styles.priceContainer}>
          {item.salePrice ? (
            <>
              <Text style={styles.salePrice}>¥{Math.round(item.salePrice * 100)}</Text>
              <Text style={styles.originalPrice}>¥{Math.round(item.price * 100)}</Text>
            </>
          ) : (
            <Text style={styles.price}>¥{Math.round(item.price * 100)}</Text>
          )}
        </View>
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>★ {item.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (recommendedProducts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Sparkles size={20} color={Colors.light.shopAccent} />
        <Text style={styles.title}>あなたにおすすめ</Text>
      </View>
      <FlatList
        data={recommendedProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProductItem}
        numColumns={2}
        scrollEnabled={false}
        contentContainerStyle={styles.productsGrid}
        columnWrapperStyle={styles.productRow}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginLeft: 8,
  },
  productsGrid: {
    paddingHorizontal: 16,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productItem: {
    width: '48%',
    backgroundColor: Colors.light.shopCard,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 180,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  brandName: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.shopPrice,
  },
  salePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.shopSale,
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: Colors.light.warning,
  },
});
