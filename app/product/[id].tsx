import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Linking, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { ChevronLeft, Heart, Share2, Star, ShoppingBag, Plus, Minus, ExternalLink } from 'lucide-react-native';
import { useCartStore } from '@/store/cartStore';
import { getProduct, clickProduct } from '@/lib/api/products';
import { Product } from '@/types/api';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const addToCart = useCartStore(state => state.addItem);

  // 商品詳細を取得
  useEffect(() => {
    if (id) {
      fetchProduct(id as string);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);
      const response = await getProduct(productId);

      if (response.success && response.data) {
        setProduct(response.data);
        // 商品クリック追跡
        await clickProduct(productId);
      }
    } catch (error) {
      console.error('[ProductDetail] Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.shopAccent} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>商品が見つかりませんでした</Text>
      </View>
    );
  }

  const handleBack = () => {
    router.back();
  };

  const handleLike = () => {
    setLiked(!liked);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleShare = () => {
    // Share functionality would go here
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleGoToExternalSite = async () => {
    if (product.externalUrl) {
      try {
        const supported = await Linking.canOpenURL(product.externalUrl);
        if (supported) {
          await Linking.openURL(product.externalUrl);
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
      } catch (error) {
        console.error('Failed to open URL:', error);
      }
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const isOnSale = product.salePrice && product.salePrice < product.price;

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: '',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
                <Heart 
                  size={24} 
                  color={liked ? Colors.light.like : Colors.light.icon} 
                  fill={liked ? Colors.light.like : 'transparent'} 
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
                <Share2 size={24} color={Colors.light.icon} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageCarousel}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.floor(event.nativeEvent.contentOffset.x / width);
              setActiveImageIndex(newIndex);
            }}
          >
            {product.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.productImage}
                contentFit="cover"
                transition={300}
              />
            ))}
          </ScrollView>
          
          {/* Pagination Dots */}
          {product.images.length > 1 && (
            <View style={styles.pagination}>
              {product.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === activeImageIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
          
          {/* Sale Tag */}
          {isOnSale && (
            <View style={styles.saleTag}>
              <Text style={styles.saleTagText}>
                {Math.round(((product.price - (product.salePrice || 0)) / product.price) * 100)}% OFF
              </Text>
            </View>
          )}
        </View>
        
        {/* Product Info */}
        <View style={styles.infoContainer}>
          {/* Seller Info */}
          <View style={styles.sellerContainer}>
            <Image
              source={{ uri: product.seller.avatar }}
              style={styles.sellerAvatar}
              contentFit="cover"
            />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{product.seller.username}</Text>
              {product.seller.verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>Verified Seller</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Product Name and Price */}
          <Text style={styles.productName}>{product.name}</Text>
          
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  color={star <= Math.round(product.rating) ? Colors.light.warning : Colors.light.border}
                  fill={star <= Math.round(product.rating) ? Colors.light.warning : 'transparent'}
                />
              ))}
            </View>
            <Text style={styles.ratingText}>{product.rating} ({product.reviews} reviews)</Text>
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
          
          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          {/* Shop & Brand Info */}
          <View style={styles.shopBrandContainer}>
            <Text style={styles.sectionTitle}>ショップ・ブランド情報</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ショップ:</Text>
              <Text style={styles.infoValue}>{product.shopName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ブランド:</Text>
              <Text style={styles.infoValue}>{product.brand}</Text>
            </View>

            {/* External Site Button */}
            {product.isExternal && product.externalUrl && (
              <TouchableOpacity
                style={styles.externalLinkButton}
                onPress={handleGoToExternalSite}
              >
                <ExternalLink size={20} color="white" />
                <Text style={styles.externalLinkText}>ECサイトで購入する</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsList}>
              {product.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.quantitySelector}>
          <TouchableOpacity 
            style={styles.quantityButton} 
            onPress={decreaseQuantity}
            disabled={quantity <= 1}
          >
            <Minus size={20} color={quantity <= 1 ? Colors.light.secondaryText : Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity style={styles.quantityButton} onPress={increaseQuantity}>
            <Plus size={20} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
          <ShoppingBag size={20} color="white" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  imageCarousel: {
    width: width,
    height: width,
    position: 'relative',
  },
  productImage: {
    width: width,
    height: width,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: Colors.light.shopAccent,
  },
  saleTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: Colors.light.shopSale,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  saleTagText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  infoContainer: {
    padding: 16,
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  verifiedBadge: {
    backgroundColor: Colors.light.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  productName: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.shopPrice,
  },
  salePrice: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.shopSale,
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 18,
    color: Colors.light.secondaryText,
    textDecorationLine: 'line-through',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.text,
  },
  shopBrandContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: Colors.light.shopBackground,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondaryText,
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  externalLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.shopAccent,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  externalLinkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tagsContainer: {
    marginBottom: 20,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: Colors.light.shopBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    marginRight: 16,
  },
  quantityButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    width: 30,
    textAlign: 'center',
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.shopAccent,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addToCartText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});