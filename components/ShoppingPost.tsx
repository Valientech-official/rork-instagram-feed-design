import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MessageCircle, ShoppingBag } from 'lucide-react-native';
import { ShoppingPost as ShoppingPostType } from '@/mocks/shoppingPosts';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.shopCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  userTextContainer: {
    flex: 1,
  },
  username: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  location: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  caption: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 19,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  statText: {
    color: colors.text,
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '500',
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.shopAccent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 16,
  },
  shopButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  imageSection: {
    position: 'relative',
    width: '100%',
  },
  image: {
    width: '100%',
    height: 360,
  },
  shopBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.shopAccent,
    borderRadius: 12,
    padding: 4,
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timestamp: {
    fontSize: 12,
    color: colors.secondaryText,
  },
});

interface ShoppingPostProps {
  post: ShoppingPostType;
}

export default function ShoppingPost({ post }: ShoppingPostProps) {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const router = useRouter();
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const styles = createStyles(colors);

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
      {/* Row 1: User Info, Caption & Actions */}
      <View style={styles.headerRow}>
        <View style={styles.topLine}>
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

          <View style={styles.stats}>
            <TouchableOpacity style={styles.statItem} onPress={handleLike}>
              <Heart
                size={20}
                color={liked ? colors.like : colors.icon}
                fill={liked ? colors.like : 'transparent'}
              />
              <Text style={styles.statText}>{likes}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statItem}>
              <MessageCircle size={20} color={colors.icon} />
              <Text style={styles.statText}>{post.comments}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shopButton} onPress={handleShopPress}>
              <ShoppingBag size={16} color="white" />
              <Text style={styles.shopButtonText}>商品</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.caption} numberOfLines={2}>
          {truncateText(post.caption, 120)}
        </Text>
      </View>

      {/* Row 2: Image */}
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

      {/* Footer: Timestamp */}
      <View style={styles.footer}>
        <Text style={styles.timestamp}>{post.timestamp}</Text>
      </View>
    </View>
  );
}