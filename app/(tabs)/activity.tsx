import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { LayoutGrid, Rows, Heart, ShoppingCart } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { profilePosts, ProfilePost } from '@/mocks/profilePosts';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { products, Product } from '@/mocks/products';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ClothingCategories from '@/components/ClothingCategories';

type ViewMode = 'horizontal' | 'vertical';

export default function ActivityScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('vertical');
  const { items: cartItems, addItem, getTotalItems } = useCartStore();
  const { items: favoriteItems, posts: favoritePosts } = useFavoritesStore();
  const insets = useSafeAreaInsets();
  
  // Calculate total favorites count (products + posts)
  const totalFavoritesCount = favoriteItems.length + favoritePosts.length;
  
  // Calculate total cart items count
  const totalCartItemsCount = getTotalItems();

  // If cart is empty, add some sample items for display
  React.useEffect(() => {
    if (cartItems.length === 0) {
      // Add some sample products to the cart for demonstration
      const sampleProducts = products.slice(0, 5);
      sampleProducts.forEach((product: Product) => {
        addItem(product, Math.floor(Math.random() * 3) + 1);
      });
    }
  }, []);

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
  };

  const renderFavoriteItem = ({ item }: { item: ProfilePost }) => (
    <View style={[
      styles.favoriteItem,
      viewMode === 'horizontal' ? styles.favoriteItemHorizontal : {}
    ]}>
      <Image 
        source={{ uri: item.imageUrl }} 
        style={[
          styles.favoriteImage,
          viewMode === 'horizontal' ? styles.favoriteImageHorizontal : {}
        ]} 
        resizeMode="cover"
      />
      <View style={styles.favoriteStats}>
        <Text style={styles.statsText}>❤️ {item.likes}</Text>
        <Text style={styles.statsText}>💬 {item.comments}</Text>
      </View>
    </View>
  );

  const renderCartItem = ({ item }: { item: typeof cartItems[0] }) => (
    <TouchableOpacity 
      style={[
        styles.cartItem,
        viewMode === 'horizontal' ? styles.cartItemHorizontal : {}
      ]} 
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: item.image }} 
        style={[
          styles.favoriteImage, // Using the same style as favorite images
          viewMode === 'horizontal' ? styles.cartImageHorizontal : {}
        ]} 
        resizeMode="cover"
      />
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.cartItemDetails}>
          <Text style={styles.cartItemPrice}>¥{item.price.toLocaleString()}</Text>
          <Text style={styles.cartItemQuantity}>×{item.quantity}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Toggle View Mode Button */}
      <TouchableOpacity 
        style={[styles.toggleButton, { top: 10 + insets.top }]}
        onPress={toggleViewMode}
        activeOpacity={0.7}
      >
        {viewMode === 'horizontal' ? (
          <Rows size={22} color={Colors.light.text} />
        ) : (
          <LayoutGrid size={22} color={Colors.light.text} />
        )}
      </TouchableOpacity>

      <View style={[
        styles.contentContainer, 
        viewMode === 'horizontal' 
          ? styles.horizontalLayout 
          : styles.verticalLayout
      ]}>
        {/* Favorites Section */}
        <View style={[
          styles.section,
          viewMode === 'horizontal' ? styles.halfHeight : styles.halfWidth
        ]}>
          <View style={[
            styles.sectionHeader,
            viewMode === 'horizontal' ? styles.sectionHeaderHorizontal : {}
          ]}>
            <View style={styles.titleWithCategories}>
              <View style={styles.titleWithIcon}>
                <Text style={[
                  styles.sectionTitle,
                  viewMode === 'horizontal' ? styles.sectionTitleHorizontal : {}
                ]}>お気に入り</Text>
                <View style={styles.favoriteIconContainer}>
                  <Heart 
                    size={viewMode === 'horizontal' ? 14 : 18} 
                    color={Colors.light.primary} 
                    fill={Colors.light.primary}
                  />
                  <Text style={[
                    styles.favoriteCount,
                    viewMode === 'horizontal' ? styles.favoriteCountHorizontal : {}
                  ]}>{totalFavoritesCount}</Text>
                </View>
              </View>
              {viewMode === 'horizontal' && (
                <View style={styles.horizontalCategoriesWrapper}>
                  <ClothingCategories title="アイテムを選択" compact collapsible horizontal />
                </View>
              )}
            </View>
          </View>
          
          {/* Clothing Categories for Favorites in Vertical Mode */}
          {viewMode === 'vertical' && (
            <View style={styles.categoriesWrapper}>
              <ClothingCategories title="アイテムを選択" compact collapsible />
            </View>
          )}
          
          <FlatList
            key={`favorites-${viewMode}`}
            data={profilePosts}
            renderItem={renderFavoriteItem}
            keyExtractor={item => item.id}
            horizontal={viewMode === 'horizontal'}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.favoritesList,
              viewMode === 'horizontal' ? styles.horizontalList : {}
            ]}
            ListEmptyComponent={
              <View style={styles.emptyListContainer}>
                <Text style={styles.emptyListText}>該当するアイテムがありません</Text>
              </View>
            }
          />
        </View>
        
        {/* Cart Items Section */}
        <View style={[
          styles.section,
          viewMode === 'horizontal' ? styles.halfHeight : styles.halfWidth
        ]}>
          <View style={[
            styles.sectionHeader,
            viewMode === 'horizontal' ? styles.sectionHeaderHorizontal : {}
          ]}>
            <View style={styles.titleWithCategories}>
              <View style={styles.titleWithIcon}>
                <Text style={[
                  styles.sectionTitle,
                  viewMode === 'horizontal' ? styles.sectionTitleHorizontal : {}
                ]}>メイビー</Text>
                <View style={styles.cartIconContainer}>
                  <ShoppingCart 
                    size={viewMode === 'horizontal' ? 14 : 18} 
                    color={Colors.light.shopAccent} 
                  />
                  <Text style={[
                    styles.cartCount,
                    viewMode === 'horizontal' ? styles.cartCountHorizontal : {}
                  ]}>{totalCartItemsCount}</Text>
                </View>
              </View>
              {viewMode === 'horizontal' && (
                <View style={styles.horizontalCategoriesWrapper}>
                  <ClothingCategories title="アイテムを選択" compact collapsible horizontal />
                </View>
              )}
            </View>
          </View>
          
          {/* Clothing Categories for Cart in Vertical Mode */}
          {viewMode === 'vertical' && (
            <View style={styles.categoriesWrapper}>
              <ClothingCategories title="アイテムを選択" compact collapsible />
            </View>
          )}
          
          {cartItems.length > 0 ? (
            <FlatList
              key={`cart-${viewMode}`}
              data={cartItems}
              renderItem={renderCartItem}
              keyExtractor={item => item.id}
              horizontal={viewMode === 'horizontal'}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.cartList,
                viewMode === 'horizontal' ? styles.horizontalList : {}
              ]}
              ListEmptyComponent={
                <View style={styles.emptyListContainer}>
                  <Text style={styles.emptyListText}>該当するアイテムがありません</Text>
                </View>
              }
            />
          ) : (
            <View style={styles.emptyCartContainer}>
              <Text style={styles.emptyCartText}>カートに商品がありません</Text>
            </View>
          )}
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
  toggleButton: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    backgroundColor: Colors.light.shopCard,
    padding: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contentContainer: {
    flex: 1,
  },
  horizontalLayout: {
    flexDirection: 'column',
  },
  verticalLayout: {
    flexDirection: 'row',
  },
  section: {
    borderColor: Colors.light.border,
  },
  halfWidth: {
    width: '50%',
    borderRightWidth: 1,
  },
  halfHeight: {
    height: '50%',
    borderBottomWidth: 1,
    width: '100%',
  },
  text: {
    fontSize: 18,
    color: Colors.light.text,
  },
  sectionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  sectionHeaderHorizontal: {
    padding: 4,
    paddingHorizontal: 8,
  },
  titleWithCategories: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  favoriteCount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  favoriteCountHorizontal: {
    fontSize: 12,
  },
  cartIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cartCount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.shopAccent,
  },
  cartCountHorizontal: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  sectionTitleHorizontal: {
    fontSize: 16,
  },
  categoriesWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 5,
  },
  horizontalCategoriesWrapper: {
    width: 200,
    zIndex: 10,
  },
  favoritesList: {
    padding: 8,
  },
  cartList: {
    padding: 8,
  },
  horizontalList: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  favoriteItem: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.light.shopCard,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteItemHorizontal: {
    marginBottom: 0,
    marginRight: 8,
    width: 280,
  },
  cartItem: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.light.shopCard,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cartItemHorizontal: {
    marginBottom: 0,
    marginRight: 8,
    width: 280,
  },
  favoriteImage: {
    width: '100%',
    height: 180,
  },
  favoriteImageHorizontal: {
    width: 280,
    height: 220,
  },
  cartImageHorizontal: {
    width: 280,
    height: 220,
  },
  favoriteStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: Colors.light.shopCard,
  },
  statsText: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },
  cartItemInfo: {
    padding: 12,
    flex: 1,
    justifyContent: 'center',
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  cartItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  cartItemQuantity: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCartText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    textAlign: 'center',
  },
  emptyListContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    textAlign: 'center',
  }
});