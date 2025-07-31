import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Hand, MessageCircle, Send, ShoppingBag, Bookmark } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

interface ShoppingPostActionsProps {
  liked: boolean;
  productId?: string;
  onLikePress: () => void;
}

export default function ShoppingPostActions({ 
  liked, 
  productId,
  onLikePress 
}: ShoppingPostActionsProps) {
  const router = useRouter();

  const handleShopPress = () => {
    if (productId) {
      router.push(`/product/${productId}`);
    } else {
      router.push('/shop');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onLikePress} style={styles.actionButton}>
        <Hand 
          size={24} 
          color={liked ? Colors.light.like : Colors.light.icon} 
          fill={liked ? Colors.light.like : 'transparent'} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.actionButton}>
        <MessageCircle size={24} color={Colors.light.icon} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.actionButton}>
        <Send size={24} color={Colors.light.icon} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.shopButton} onPress={handleShopPress}>
        <ShoppingBag size={24} color="white" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.actionButton}>
        <Bookmark size={24} color={Colors.light.icon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 12,
    bottom: 20, // Moved lower on the screen (was 80)
    alignItems: 'center',
    zIndex: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.shopAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});