import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { Product } from '@/mocks/products';
import { useFavoritesStore } from '@/store/favoritesStore';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width / 2) - 16;

interface ProductCardProps {
  product: Product;
  index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const router = useRouter();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavoritesStore();
  const isProductFavorite = isFavorite(product.id);

  const handlePress = () => {
    router.push(`/product/${product.id}`);
  };

  const handleFavoritePress = () => {
    if (isProductFavorite) {
      removeFromFavorites(product.id);
    } else {
      addToFavorites(product);
    }
  };

  const isOnSale = product.salePrice && product.salePrice < product.price;

  return (
    <TouchableOpacity 
      style={[styles.container, { marginLeft: index % 2 === 0 ? 8 : 4, marginRight: index % 2 === 0 ? 4 : 8 }]} 
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.images[0] }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={handleFavoritePress}
          activeOpacity={0.7}
        >
          <Heart 
            size={18} 
            color={isProductFavorite ? Colors.light.shopSale : Colors.light.secondaryText}
            fill={isProductFavorite ? Colors.light.shopSale : 'transparent'}
          />
        </TouchableOpacity>
        {isOnSale && (
          <View style={styles.saleTag}>
            <Text style={styles.saleText}>SALE</Text>
          </View>
        )}
        {product.featured && (
          <View style={styles.featuredTag}>
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        
        <View style={styles.sellerContainer}>
          <Image
            source={{ uri: product.seller.avatar }}
            style={styles.sellerAvatar}
            contentFit="cover"
          />
          <Text style={styles.sellerName} numberOfLines={1}>{product.seller.username}</Text>
        </View>
        
        <View style={styles.priceContainer}>
          {isOnSale ? (
            <>
              <Text style={styles.salePrice}>${product.salePrice?.toFixed(2)}</Text>
              <Text style={styles.originalPrice}>${product.price.toFixed(2)}</Text>
            </>
          ) : (
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          )}
        </View>
        
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>★ {product.rating}</Text>
          <Text style={styles.reviews}>({product.reviews})</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: Colors.light.shopCard,
    borderRadius: 12,
    marginBottom: 16,
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
    height: CARD_WIDTH,
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 6,
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
  featuredTag: {
    position: 'absolute',
    top: 40,
    right: 8,
    backgroundColor: Colors.light.shopAccent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sellerAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 4,
  },
  sellerName: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    flex: 1,
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
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: Colors.light.text,
    marginRight: 2,
  },
  reviews: {
    fontSize: 12,
    color: Colors.light.secondaryText,
  },
});