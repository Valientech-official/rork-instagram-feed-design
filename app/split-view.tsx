import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ChevronLeft, Heart, ShoppingBag } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { profilePosts } from '@/mocks/profilePosts';
import { useCartStore } from '@/store/cartStore';

const { width, height } = Dimensions.get('window');
const HALF_WIDTH = width / 2;

export default function SplitViewScreen() {
  const router = useRouter();
  const cartItems = useCartStore(state => state.items);
  
  const handleBack = () => {
    router.back();
  };

  const handleFavoritePress = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleCartItemPress = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: "Split View",
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={styles.container}>
        {/* Left Side - Favorites */}
        <View style={styles.halfContainer}>
          <View style={styles.headerContainer}>
            <Heart size={18} color={Colors.light.like} />
            <Text style={styles.headerText}>Favorites</Text>
          </View>
          
          <ScrollView 
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.gridContainer}>
              {profilePosts.map((post) => (
                <TouchableOpacity 
                  key={post.id} 
                  style={styles.itemContainer}
                  onPress={() => handleFavoritePress(post.id)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: post.imageUrl }}
                    style={styles.itemImage}
                    contentFit="cover"
                  />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemLikes}>{post.likes} likes</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
        
        {/* Divider */}
        <View style={styles.divider} />
        
        {/* Right Side - Cart Items */}
        <View style={styles.halfContainer}>
          <View style={styles.headerContainer}>
            <ShoppingBag size={18} color={Colors.light.shopAccent} />
            <Text style={styles.headerText}>Cart Items</Text>
          </View>
          
          <ScrollView 
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {cartItems.length > 0 ? (
              <View style={styles.cartContainer}>
                {cartItems.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.cartItem}
                    onPress={() => handleCartItemPress(item.productId)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: item.image }}
                      style={styles.cartItemImage}
                      contentFit="cover"
                    />
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.cartItemPrice}>${item.price.toFixed(2)}</Text>
                      <Text style={styles.cartItemQuantity}>Qty: {item.quantity}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <ShoppingBag size={48} color={Colors.light.secondaryText} />
                <Text style={styles.emptyText}>Your cart is empty</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
  },
  backButton: {
    padding: 8,
  },
  halfContainer: {
    width: HALF_WIDTH,
    height: '100%',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.light.border,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  gridContainer: {
    padding: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  itemContainer: {
    width: (HALF_WIDTH - 12) / 2,
    margin: 2,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.light.shopCard,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemImage: {
    width: '100%',
    aspectRatio: 1,
  },
  itemInfo: {
    padding: 4,
  },
  itemLikes: {
    fontSize: 10,
    color: Colors.light.text,
  },
  cartContainer: {
    padding: 8,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: Colors.light.shopCard,
    borderRadius: 8,
    marginBottom: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'space-between',
  },
  cartItemName: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
  },
  cartItemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.shopPrice,
  },
  cartItemQuantity: {
    fontSize: 10,
    color: Colors.light.secondaryText,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    marginTop: 12,
    textAlign: 'center',
  },
});