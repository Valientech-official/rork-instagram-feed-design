import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Product } from '@/types/api';
import Colors from '@/constants/colors';

interface FeaturedProductsProps {
  products: (Product & { score?: number })[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  const router = useRouter();

  if (products.length === 0) {
    return null;
  }

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const handleSeeAllPress = () => {
    router.push('/shop/featured');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Featured Products</Text>
        <TouchableOpacity style={styles.seeAllButton} onPress={handleSeeAllPress}>
          <Text style={styles.seeAllText}>See All</Text>
          <ChevronRight size={16} color={Colors.light.shopAccent} />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {products.map((product) => (
          <TouchableOpacity
            key={product.productId}
            style={styles.productCard}
            onPress={() => handleProductPress(product.productId)}
            activeOpacity={0.8}
          >
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: product.primaryImageUrl }}
                style={styles.productImage}
                contentFit="cover"
                transition={200}
              />
              {product.salePrice && product.salePrice < product.price && (
                <View style={styles.saleTag}>
                  <Text style={styles.saleText}>SALE</Text>
                </View>
              )}
            </View>
            
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
              
              <View style={styles.priceContainer}>
                {product.salePrice && product.salePrice < product.price ? (
                  <>
                    <Text style={styles.salePrice}>${product.salePrice.toFixed(2)}</Text>
                    <Text style={styles.originalPrice}>${product.price.toFixed(2)}</Text>
                  </>
                ) : (
                  <Text style={styles.price}>${product.price.toFixed(2)}</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.light.shopAccent,
    marginRight: 2,
  },
  scrollContent: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  productCard: {
    width: 160,
    marginRight: 12,
    backgroundColor: Colors.light.shopCard,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  saleTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.light.shopSale,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  saleText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
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
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    textDecorationLine: 'line-through',
  },
});