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
        {/* User Info Header */}
        <View style={styles.header}>
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

        {/* Image Carousel with Double Tap */}
        <View style={styles.imageContainer}>
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

        {/* Actions & Info */}
        <View style={styles.footer}>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Heart
                size={24}
                color={liked ? Colors.light.like : Colors.light.icon}
                fill={liked ? Colors.light.like : 'transparent'}
              />
              <Text style={styles.actionText}>{likes}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleImagePress}>
              <MessageCircle size={24} color={Colors.light.icon} />
              <Text style={styles.actionText}>{post.comments}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.caption} numberOfLines={2}>
            <Text style={styles.captionUsername}>{post.user.username}</Text>
            {' '}
            {truncateText(post.caption)}
          </Text>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
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
  imageContainer: {
    position: 'relative',
  },
  footer: {
    padding: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    color: Colors.light.text,
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '500',
  },
  caption: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 6,
  },
  captionUsername: {
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: Colors.light.secondaryText,
  },
});