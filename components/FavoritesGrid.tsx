import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { useFavoritesStore, FavoriteItem } from '@/store/favoritesStore';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width / 2) - 24;

interface FavoritesGridProps {
  onClose: () => void;
}

export default function FavoritesGrid({ onClose }: FavoritesGridProps) {
  const router = useRouter();
  const { items: favoriteItems, removeFromFavorites } = useFavoritesStore();

  const handleProductPress = (productId: string) => {
    // サンプル商品の場合は詳細ページに遷移しない
    if (productId.startsWith('sample_')) {
      console.log('サンプル商品がクリックされました:', productId);
      return;
    }
    router.push(`/product/${productId}`);
  };

  const handleRemoveFavorite = (productId: string) => {
    removeFromFavorites(productId);
  };

  const renderFavoriteItem = ({ item, index }: { item: FavoriteItem; index: number }) => {
    const isOnSale = item.salePrice && item.salePrice < item.price;

    return (
      <TouchableOpacity 
        style={[
          styles.productCard, 
          { marginLeft: index % 2 === 0 ? 16 : 8, marginRight: index % 2 === 0 ? 8 : 16 }
        ]} 
        onPress={() => handleProductPress(item.productId)}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.productImage}
            contentFit="cover"
            transition={200}
          />
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => handleRemoveFavorite(item.productId)}
          >
            <Heart size={20} color={Colors.light.shopSale} fill={Colors.light.shopSale} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          
          <View style={styles.priceContainer}>
            {isOnSale ? (
              <>
                <Text style={styles.salePrice}>¥{item.salePrice?.toFixed(0)}</Text>
                <Text style={styles.originalPrice}>¥{item.price.toFixed(0)}</Text>
              </>
            ) : (
              <Text style={styles.price}>¥{item.price.toFixed(0)}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>お気に入り ({favoriteItems.length})</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>閉じる</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        key="favorites-grid"
        data={favoriteItems}
        keyExtractor={(item) => item.id}
        renderItem={renderFavoriteItem}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeText: {
    fontSize: 16,
    color: Colors.light.shopAccent,
  },
  gridContent: {
    paddingVertical: 16,
  },
  productCard: {
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
  productImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 6,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 6,
    lineHeight: 18,
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