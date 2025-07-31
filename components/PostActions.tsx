import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Hand, MessageCircle, Send, Heart, ShoppingBag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

interface PostActionsProps {
  liked: boolean;
  onLikePress: () => void;
  onCommentPress: () => void;
}

export default function PostActions({ liked, onLikePress, onCommentPress }: PostActionsProps) {
  const router = useRouter();
  
  const handleShopPress = () => {
    router.push('/shop');
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
      
      <TouchableOpacity style={styles.actionButton} onPress={onCommentPress}>
        <MessageCircle size={24} color={Colors.light.icon} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.actionButton}>
        <Send size={24} color={Colors.light.icon} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.actionButton} onPress={handleShopPress}>
        <ShoppingBag size={24} color={Colors.light.icon} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.actionButton}>
        <Heart size={24} color={Colors.light.icon} />
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
});