import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MessageCircle, ShoppingBag } from 'lucide-react-native';
import { ShoppingPost as ShoppingPostType } from '@/mocks/shoppingPosts';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

interface ShoppingPostProps {
  post: ShoppingPostType;
}

export default function ShoppingPost({ post }: ShoppingPostProps) {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const router = useRouter();

  const handleLike = () => {
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  const handleShopPress = () => {
    router.push(`/product/${post.productId}`);
  };

  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '…';
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentRow}>
        {/* Left: Image */}
        <View style={styles.imageSection}>
          <Image
            source={{ uri: post.images[0] }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.shopBadge}>
            <ShoppingBag size={14} color="white" />
          </View>
        </View>

        {/* Right: User Info & Caption */}
        <View style={styles.infoSection}>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: post.user.avatar }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.userTextContainer}>
              <Text style={styles.username}>{post.user.username}</Text>
              {post.location && (
                <Text style={styles.location}>{post.location}</Text>
              )}
            </View>
          </View>

          <Text style={styles.caption} numberOfLines={3}>
            {truncateText(post.caption)}
          </Text>

          <View style={styles.stats}>
            <TouchableOpacity style={styles.statItem} onPress={handleLike}>
              <Heart
                size={18}
                color={liked ? Colors.light.like : Colors.light.icon}
                fill={liked ? Colors.light.like : 'transparent'}
              />
              <Text style={styles.statText}>{likes}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statItem}>
              <MessageCircle size={18} color={Colors.light.icon} />
              <Text style={styles.statText}>{post.comments}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shopButton} onPress={handleShopPress}>
              <ShoppingBag size={16} color="white" />
              <Text style={styles.shopButtonText}>商品を見る</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.timestamp}>{post.timestamp}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  contentRow: {
    flexDirection: 'row',
  },
  imageSection: {
    width: '50%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 280,
  },
  shopBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.light.shopAccent,
    borderRadius: 12,
    padding: 4,
  },
  infoSection: {
    width: '50%',
    padding: 12,
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  userTextContainer: {
    flex: 1,
  },
  username: {
    color: Colors.light.text,
    fontWeight: '600',
    fontSize: 14,
  },
  location: {
    fontSize: 11,
    color: Colors.light.secondaryText,
    marginTop: 2,
  },
  caption: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statText: {
    color: Colors.light.text,
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.shopAccent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  shopButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.light.secondaryText,
  },
});