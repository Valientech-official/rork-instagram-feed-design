import React, { useState, useRef, useCallback } from 'react';
import { FlatList, StyleSheet, View, Text, TouchableOpacity, Dimensions, ScrollView, Animated, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Minus, Plus, Trash2, Circle } from 'lucide-react-native';
import { posts } from '@/mocks/posts';
import { shoppingPosts } from '@/mocks/shoppingPosts';
import { liveStreams } from '@/mocks/liveStreams';
import { users } from '@/mocks/users';
import Post from '@/components/Post';
import ShoppingPost from '@/components/ShoppingPost';
import FeedHeader from '@/components/FeedHeader';
import LiveStreamsList from '@/components/LiveStreamsList';
import RoomLivesList from '@/components/RoomLivesList';
import RecommendedUsersSlider from '@/components/RecommendedUsersSlider';
import FavoritesGrid from '@/components/FavoritesGrid';
import PhotoGallery from '@/components/PhotoGallery';
import { useCartStore, CartItem } from '@/store/cartStore';
import { useThemeStore } from '@/store/themeStore';
import Colors from '@/constants/colors';
import { ShoppingPost as ShoppingPostType } from '@/mocks/shoppingPosts';
import { Post as PostType } from '@/mocks/posts';
import RecommendationCard from '@/components/RecommendationCard';
import RecommendationsSlider from '@/components/RecommendationsSlider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MenuDrawer from '@/components/MenuDrawer';
import TopStylists from '@/components/home/TopStylists';
import RecommendedGrid from '@/components/home/RecommendedGrid';
import DailyChallengeCard from '@/components/home/DailyChallengeCard';
import TrendingQA from '@/components/home/TrendingQA';
import ShopTheLook from '@/components/home/ShopTheLook';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width / 2) - 24;

export default function FeedScreen() {
  const [showFavorites, setShowFavorites] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items: cartItems, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const { theme } = useThemeStore();
  const colors = Colors[theme];

  // Header animation state
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const headerTranslateY = useRef(new Animated.Value(0)).current;

  const activeStreams = liveStreams.filter(stream => stream.isActive);


  const handleCloseFavorites = () => {
    setShowFavorites(false);
  };

  const handleCartPress = () => {
    setShowCart(true);
  };

  const handleCloseCart = () => {
    setShowCart(false);
  };

  const handlePhotoGalleryPress = () => {
    setShowPhotoGallery(true);
  };

  const handleClosePhotoGallery = () => {
    setShowPhotoGallery(false);
  };

  const handleMenuPress = () => {
    setIsMenuOpen(true);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  const handleProductPress = (productId: string) => {
    if (productId.startsWith('sample_')) {
      console.log('サンプル商品がクリックされました:', productId);
      return;
    }
    router.push(`/product/${productId}`);
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  // Handle scroll events for header animation
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const diff = currentScrollY - lastScrollY.current;

        // Only animate if scroll distance is significant enough
        if (Math.abs(diff) > 2) {
          if (diff > 0 && currentScrollY > 30) {
            // Scrolling down - hide header instantly
            headerTranslateY.setValue(-100);
          } else if (diff < 0) {
            // Scrolling up - show header instantly
            headerTranslateY.setValue(0);
          }
          lastScrollY.current = currentScrollY;
        }
      },
    }
  );

  // Create styles with current theme colors
  const styles = createStyles(colors);

  const renderCartItem = ({ item, index }: { item: CartItem; index: number }) => {
    return (
      <TouchableOpacity 
        style={[
          styles.cartCard, 
          { marginLeft: index % 2 === 0 ? 16 : 8, marginRight: index % 2 === 0 ? 8 : 16 }
        ]} 
        onPress={() => handleProductPress(item.productId)}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.cartImage}
            contentFit="cover"
            transition={200}
          />
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.id)}
          >
            <Trash2 size={16} color={colors.shopSale} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.cartInfo}>
          <Text style={styles.cartName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.cartPrice}>¥{item.price.toFixed(0)}</Text>
          
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
            >
              <Minus size={16} color={colors.icon} />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
            >
              <Plus size={16} color={colors.icon} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (showFavorites) {
    return (
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 0) }]}>
        <FavoritesGrid onClose={handleCloseFavorites} />
      </View>
    );
  }

  if (showPhotoGallery) {
    return (
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 0) }]}>
        <PhotoGallery onClose={handleClosePhotoGallery} />
      </View>
    );
  }

  if (showCart) {
    return (
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 0) }]}>
        <View style={styles.cartHeader}>
          <Text style={styles.cartTitle}>カート ({cartItems.length})</Text>
          <TouchableOpacity onPress={handleCloseCart} style={styles.closeButton}>
            <Text style={styles.closeText}>閉じる</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          key="cart-grid"
          data={cartItems}
          keyExtractor={(item) => item.id}
          renderItem={renderCartItem}
          numColumns={2}
          contentContainerStyle={styles.cartContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            cartItems.length > 0 ? (
              <View style={styles.totalContainer}>
                <Text style={styles.totalText}>合計: ¥{getTotalPrice().toFixed(0)}</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>カートは空です</Text>
              </View>
            )
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.headerContainer,
          {
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <FeedHeader onMenuPress={handleMenuPress} />
      </Animated.View>

      <Animated.ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: Math.max(insets.top + 8, 16) + 48 } // Header height + safe area
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Streams */}
        {activeStreams.length > 0 && (
          <View style={styles.fullWidthLiveSection}>
            <LiveStreamsList streams={activeStreams} />
          </View>
        )}

        {/* Top Stylists Section */}
        <TopStylists />

        {/* Shop the Look Section - 2x4 Grid */}
        <ShopTheLook />

        {/* Recommended Grid Section */}
        <RecommendedGrid />

        {/* Daily Challenge Section */}
        <DailyChallengeCard />

        {/* Trending Q&A Section */}
        <TrendingQA />

        {/* Room Lives Section */}
        <RoomLivesList />

        {/* Recommended Users Section */}
        <RecommendedUsersSlider />

        {/* Shopping Posts */}
        {shoppingPosts.slice(0, 3).map((post) => (
          <ShoppingPost key={post.id} post={post} />
        ))}

        {/* Recommendations Slider */}
        <RecommendationsSlider />

        {/* More Posts */}
        {posts.slice(0, 2).map((post) => (
          <Post key={post.id} post={post} />
        ))}
      </Animated.ScrollView>

      <MenuDrawer visible={isMenuOpen} onClose={handleMenuClose} />
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: 20,
  },
  fullWidthLiveSection: {
    width: '100%',
    backgroundColor: colors.background,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeText: {
    fontSize: 16,
    color: colors.shopAccent,
  },
  cartContent: {
    paddingVertical: 16,
  },
  cartCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.shopCard,
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
    height: CARD_WIDTH * 0.8,
  },
  cartImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 6,
  },
  cartInfo: {
    padding: 12,
  },
  cartName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
    lineHeight: 18,
  },
  cartPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.shopPrice,
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    backgroundColor: colors.border,
    borderRadius: 16,
    padding: 6,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  totalContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.shopCard,
    borderRadius: 12,
    alignItems: 'center',
  },
  totalText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.shopPrice,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.secondaryText,
  },
});