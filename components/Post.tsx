import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MessageCircle } from 'lucide-react-native';
import { Post as PostType } from '@/mocks/posts';
import ImageCarousel from './ImageCarousel';
import DoubleTapLike from './DoubleTapLike';
import PostDetailModal from './PostDetailModal';
import Colors from '@/constants/colors';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 24; // 両端余白12px × 2

interface PostProps {
  post: PostType;
}

export default function Post({ post }: PostProps) {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  const handleDoubleTap = () => {
    if (!liked) {
      setLiked(true);
      setLikes(prev => prev + 1);
      setShowLikeAnimation(true);
    }
  };

  const handleLikeAnimationComplete = () => {
    setShowLikeAnimation(false);
  };

  const handleImagePress = () => {
    setShowDetailModal(true);
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '…';
  };

  return (
    <>
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
                  color={liked ? Colors.light.like : Colors.light.icon}
                  fill={liked ? Colors.light.like : 'transparent'}
                />
                <Text style={styles.statText}>{likes}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.statItem} onPress={handleImagePress}>
                <MessageCircle size={20} color={Colors.light.icon} />
                <Text style={styles.statText}>{post.comments}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.caption} numberOfLines={2}>
            {truncateText(post.caption, 120)}
          </Text>
        </View>

        {/* Row 2: Image */}
        <View style={styles.imageWrapper}>
          <ImageCarousel
            images={post.images}
            onDoubleTap={handleDoubleTap}
            onPress={handleImagePress}
            width={CARD_WIDTH}
            aspectRatio={post.aspectRatio}
          />
          <DoubleTapLike
            visible={showLikeAnimation}
            liked={liked}
            onAnimationComplete={handleLikeAnimationComplete}
          />
        </View>

        {/* Footer: Timestamp */}
        <View style={styles.footer}>
          <Text style={styles.timestamp}>{post.timestamp}</Text>
        </View>
      </View>

      <PostDetailModal
        visible={showDetailModal}
        post={{ ...post, liked, likes }}
        onClose={() => setShowDetailModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  headerRow: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
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
    color: Colors.light.text,
    fontWeight: '600',
    fontSize: 15,
  },
  location: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    marginTop: 2,
  },
  caption: {
    fontSize: 14,
    color: Colors.light.text,
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
    color: Colors.light.text,
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '500',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.light.secondaryText,
  },
});