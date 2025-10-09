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
        <View style={styles.contentRow}>
          {/* Left: Image */}
          <View style={styles.imageSection}>
            <View style={styles.imageWrapper}>
              <ImageCarousel
                images={post.images}
                onDoubleTap={handleDoubleTap}
                onPress={handleImagePress}
                width={screenWidth * 0.6}
                aspectRatio={post.aspectRatio}
              />
              <DoubleTapLike
                visible={showLikeAnimation}
                liked={liked}
                onAnimationComplete={handleLikeAnimationComplete}
              />
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

              <TouchableOpacity style={styles.statItem} onPress={handleImagePress}>
                <MessageCircle size={18} color={Colors.light.icon} />
                <Text style={styles.statText}>{post.comments}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.timestamp}>{post.timestamp}</Text>
          </View>
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
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  contentRow: {
    flexDirection: 'row',
    minHeight: 360,
  },
  imageSection: {
    width: '60%',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
  },
  infoSection: {
    width: '40%',
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
  timestamp: {
    fontSize: 11,
    color: Colors.light.secondaryText,
  },
});