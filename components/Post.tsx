import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Post as PostType } from '@/mocks/posts';
import PostHeader from './PostHeader';
import ImageCarousel from './ImageCarousel';
import PostFooter from './PostFooter';
import PostActions from './PostActions';
import DoubleTapLike from './DoubleTapLike';
import ProfileCommentModal from './ProfileCommentModal';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');
const MAIN_CONTENT_WIDTH = (width * 5) / 6;

interface PostProps {
  post: PostType;
  width?: number;
}

export default function Post({ post, width: containerWidth = MAIN_CONTENT_WIDTH }: PostProps) {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);

  const handleLike = useCallback(() => {
    if (!liked) {
      setLiked(true);
      setLikes(prev => prev + 1);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      setLiked(false);
      setLikes(prev => prev - 1);
    }
  }, [liked]);

  const handleDoubleTap = useCallback(() => {
    // Toggle like status on double tap
    if (!liked) {
      setLiked(true);
      setLikes(prev => prev + 1);
      setShowLikeAnimation(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } else {
      setLiked(false);
      setLikes(prev => prev - 1);
      setShowLikeAnimation(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [liked]);

  const handleAnimationComplete = useCallback(() => {
    setShowLikeAnimation(false);
  }, []);

  const handleCommentPress = useCallback(() => {
    setShowCommentModal(true);
  }, []);

  const handleCloseCommentModal = useCallback(() => {
    setShowCommentModal(false);
  }, []);

  return (
    <View style={styles.container}>
      <PostHeader 
        username={post.user.username} 
        avatar={post.user.avatar} 
        location={post.location}
      />
      
      <View style={styles.imageContainer}>
        <ImageCarousel 
          images={post.images} 
          onDoubleTap={handleDoubleTap}
          width={containerWidth}
        />
        <DoubleTapLike 
          visible={showLikeAnimation} 
          liked={liked}
          onAnimationComplete={handleAnimationComplete}
        />
        <PostActions 
          liked={liked}
          onLikePress={handleLike}
          onCommentPress={handleCommentPress}
        />
      </View>
      
      <PostFooter 
        username={post.user.username}
        caption={post.caption}
        likes={likes}
        comments={post.comments}
        timestamp={post.timestamp}
      />

      <ProfileCommentModal
        visible={showCommentModal}
        postId={post.id}
        onClose={handleCloseCommentModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginHorizontal: 0,
  },
  imageContainer: {
    position: 'relative',
  },
});