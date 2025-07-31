import React, { useState } from 'react';
import { FlatList, StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
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
import Colors from '@/constants/colors';
import { ShoppingPost as ShoppingPostType } from '@/mocks/shoppingPosts';
import { Post as PostType } from '@/mocks/posts';
import RecommendationCard from '@/components/RecommendationCard';
import RecommendationsSlider from '@/components/RecommendationsSlider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const MAIN_CONTENT_WIDTH = (width * 5) / 6;
const SIDEBAR_WIDTH = (width * 1) / 6;
const CARD_WIDTH = (MAIN_CONTENT_WIDTH / 2) - 24;

// Define a union type for the combined posts
type CombinedPostType = PostType | ShoppingPostType;

export default function FeedScreen() {
  const [showFavorites, setShowFavorites] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items: cartItems, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  
  // Create a combined array of posts and shopping posts
  const combinedPosts: CombinedPostType[] = [...posts, ...shoppingPosts].sort(() => Math.random() - 0.5);
  const activeStreams = liveStreams.filter(stream => stream.isActive);
  
  // Create sidebar users with status (3x more users)
  const sidebarUsers = [
    ...users.slice(0, 12).map(user => ({ ...user, status: 'live' as const })),
    ...users.slice(0, 12).map(user => ({ ...user, status: 'new_post' as const, id: user.id + '_new' })),
    ...users.slice(0, 12).map(user => ({ ...user, status: 'online' as const, id: user.id + '_online' })),
  ];

  // Insert recommendation cards, room lives, and recommended users at specific positions
  const postsWithRecommendations = [...combinedPosts];
  
  // Insert various content types throughout the feed
  if (postsWithRecommendations.length > 1) {
    postsWithRecommendations.splice(1, 0, { id: 'rec1', isRecommendation: true } as any);
  }
  if (postsWithRecommendations.length > 3) {
    postsWithRecommendations.splice(3, 0, { id: 'room-live1', isRoomLive: true } as any);
  }
  if (postsWithRecommendations.length > 5) {
    postsWithRecommendations.splice(5, 0, { id: 'users1', isRecommendedUsers: true } as any);
  }
  if (postsWithRecommendations.length > 7) {
    postsWithRecommendations.splice(7, 0, { id: 'rec2', isRecommendationSlider: true } as any);
  }
  if (postsWithRecommendations.length > 9) {
    postsWithRecommendations.splice(9, 0, { id: 'rec3', isRecommendation: true } as any);
  }
  if (postsWithRecommendations.length > 11) {
    postsWithRecommendations.splice(11, 0, { id: 'room-live2', isRoomLive: true } as any);
  }
  if (postsWithRecommendations.length > 13) {
    postsWithRecommendations.splice(13, 0, { id: 'users2', isRecommendedUsers: true } as any);
  }
  if (postsWithRecommendations.length > 15) {
    postsWithRecommendations.splice(15, 0, { id: 'rec4', isRecommendationSlider: true } as any);
  }

  const handleFavoritesPress = () => {
    setShowFavorites(true);
  };

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
            <Trash2 size={16} color={Colors.light.shopSale} />
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
              <Minus size={16} color={Colors.light.icon} />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
            >
              <Plus size={16} color={Colors.light.icon} />
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

  const renderSidebarUser = ({ item }: { item: typeof sidebarUsers[0] }) => {
    const getStatusColor = () => {
      switch (item.status) {
        case 'live': return Colors.light.shopSale;
        case 'new_post': return Colors.light.shopAccent;
        case 'online': return '#4CAF50';
        default: return Colors.light.border;
      }
    };

    const getStatusText = () => {
      switch (item.status) {
        case 'live': return 'Live';
        case 'new_post': return '新規';
        case 'online': return '';
        default: return '';
      }
    };

    return (
      <TouchableOpacity style={styles.sidebarUserItem}>
        <View style={styles.sidebarUserContainer}>
          <View style={styles.sidebarAvatarContainer}>
            <Image
              source={{ uri: item.avatar }}
              style={styles.sidebarAvatar}
              contentFit="cover"
            />
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          </View>
          {getStatusText() && (
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FeedHeader 
        onFavoritesPress={handleFavoritesPress} 
        onCartPress={handleCartPress}
        onPhotoGalleryPress={handlePhotoGalleryPress}
      />
      
      {/* Full width Live Streams section */}
      {activeStreams.length > 0 && (
        <View style={styles.fullWidthLiveSection}>
          <LiveStreamsList streams={activeStreams} />
        </View>
      )}
      
      <View style={styles.splitContainer}>
        <View style={styles.mainContent}>
          <FlatList
            key="main-feed"
            data={postsWithRecommendations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              // Check if this is a recommendation card
              if ('isRecommendation' in item) {
                return <RecommendationCard />;
              }
              
              // Check if this is a recommendation slider
              if ('isRecommendationSlider' in item) {
                return <RecommendationsSlider />;
              }
              
              // Check if this is a room live section
              if ('isRoomLive' in item) {
                return <RoomLivesList />;
              }
              
              // Check if this is a recommended users section
              if ('isRecommendedUsers' in item) {
                return <RecommendedUsersSlider />;
              }
              
              // Check if the item is a ShoppingPost by checking if productId exists
              if ('productId' in item) {
                return <ShoppingPost post={item as ShoppingPostType} width={MAIN_CONTENT_WIDTH} />;
              } else {
                return <Post post={item as PostType} width={MAIN_CONTENT_WIDTH} />;
              }
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        </View>
        
        <View style={styles.sidebar}>
          <FlatList
            data={sidebarUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderSidebarUser}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sidebarContent}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    width: MAIN_CONTENT_WIDTH,
    flex: 1,
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: Colors.light.background,
    borderLeftWidth: 0.5,
    borderLeftColor: Colors.light.border,
  },
  sidebarContent: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  sidebarUserItem: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  sidebarUserContainer: {
    alignItems: 'center',
  },
  sidebarAvatarContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  sidebarAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 0,
  },
  fullWidthLiveSection: {
    width: '100%',
    backgroundColor: Colors.light.background,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  cartTitle: {
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
  cartContent: {
    paddingVertical: 16,
  },
  cartCard: {
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
    color: Colors.light.text,
    marginBottom: 4,
    lineHeight: 18,
  },
  cartPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.shopPrice,
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    backgroundColor: Colors.light.border,
    borderRadius: 16,
    padding: 6,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  totalContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.light.shopCard,
    borderRadius: 12,
    alignItems: 'center',
  },
  totalText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.shopPrice,
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