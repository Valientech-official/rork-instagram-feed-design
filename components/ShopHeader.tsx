import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Search, ShoppingCart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useCartStore } from '@/store/cartStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ShopHeader() {
  const router = useRouter();
  const cartItemCount = useCartStore(state => state.items.length);
  const insets = useSafeAreaInsets();

  const handleCartPress = () => {
    router.push('/cart');
  };

  const handleSearchPress = () => {
    router.push('/shop/search');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.logo}>Shop</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconButton} onPress={handleSearchPress}>
          <Search size={24} color={Colors.light.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cartButton} onPress={handleCartPress}>
          <ShoppingCart size={24} color={Colors.light.icon} />
          {cartItemCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartItemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  logo: {
    fontWeight: '600',
    fontSize: 22,
    color: Colors.light.shopAccent,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 4,
    marginRight: 16,
  },
  cartButton: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.light.shopAccent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
});