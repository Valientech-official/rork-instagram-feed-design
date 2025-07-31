import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react-native';
import { useCartStore, CartItem } from '@/store/cartStore';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width / 2) - 24;

interface CartGridProps {
  onClose: () => void;
}

export default function CartGrid({ onClose }: CartGridProps) {
  const router = useRouter();
  const { items: cartItems, removeItem, updateQuantity, getTotalPrice } = useCartStore();

  const handleProductPress = (productId: string) => {
    // サンプル商品の場合は詳細ページに遷移しない
    if (productId.startsWith('sample_')) {
      console.log('サンプル商品がクリックされました:', productId);
      return;
    }
    router.push(`/product/${productId}`);
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    updateQuantity(itemId, newQuantity);
  };

  const handleCheckout = () => {
    onClose();
    router.push('/cart');
  };

  const renderCartItem = ({ item, index }: { item: CartItem; index: number }) => {
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
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.id)}
          >
            <Trash2 size={16} color={Colors.light.error} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          
          <Text style={styles.price}>¥{item.price.toFixed(0)}</Text>
          
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
            >
              <Minus size={12} color={Colors.light.text} />
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{item.quantity}</Text>
            
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
            >
              <Plus size={12} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <ShoppingCart size={64} color={Colors.light.secondaryText} />
      <Text style={styles.emptyTitle}>カートが空です</Text>
      <Text style={styles.emptyText}>商品をカートに追加してください</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>メイビー ({cartItems.length})</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>閉じる</Text>
        </TouchableOpacity>
      </View>
      
      {cartItems.length > 0 ? (
        <>
          <FlatList
            key="cart-grid"
            data={cartItems}
            keyExtractor={(item) => item.id}
            renderItem={renderCartItem}
            numColumns={2}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>合計: ¥{getTotalPrice().toFixed(0)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.checkoutButton}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutButtonText}>レジに進む</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        renderEmptyCart()
      )}
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
    paddingBottom: 100,
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
    height: CARD_WIDTH * 0.8,
  },
  productImage: {
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
    borderRadius: 12,
    padding: 4,
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
  price: {
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.shopBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    minWidth: 20,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.shopCard,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  totalContainer: {
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  checkoutButton: {
    backgroundColor: Colors.light.shopAccent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    textAlign: 'center',
  },
});