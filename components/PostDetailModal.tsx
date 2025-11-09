import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { X, Heart, MessageCircle, Send, Bookmark } from 'lucide-react-native';
import { Post as PostType } from '@/mocks/posts';
import { profileComments } from '@/mocks/profileComments';
import ImageCarousel from './ImageCarousel';
import DoubleTapLike from './DoubleTapLike';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

interface PostDetailModalProps {
  visible: boolean;
  post: PostType;
  onClose: () => void;
}

export default function PostDetailModal({ visible, post, onClose }: PostDetailModalProps) {
  const insets = useSafeAreaInsets();
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [commentText, setCommentText] = useState('');

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

  const handleSendComment = () => {
    if (commentText.trim()) {
      console.log('Send comment:', commentText);
      setCommentText('');
    }
  };

  // Get comments for this post
  const postComments = profileComments.slice(0, 5);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={28} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>投稿</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.breadcrumbContainer}>
            <Text style={styles.breadcrumbText}>ホーム</Text>
            <Text style={styles.breadcrumbSeparator}>›</Text>
            <Text style={styles.breadcrumbText}>{post.user.username}</Text>
            <Text style={styles.breadcrumbSeparator}>›</Text>
            <Text style={styles.breadcrumbCurrent}>投稿</Text>
          </View>
          {/* Image Carousel with Double Tap */}
          <View style={styles.imageContainer}>
            <ImageCarousel
              images={post.images}
              onDoubleTap={handleDoubleTap}
              width={screenWidth}
              aspectRatio="4:5"
            />
            <DoubleTapLike
              visible={showLikeAnimation}
              liked={liked}
              onAnimationComplete={handleLikeAnimationComplete}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <View style={styles.leftActions}>
              <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
                <Heart
                  size={28}
                  color={liked ? Colors.light.like : Colors.light.icon}
                  fill={liked ? Colors.light.like : 'transparent'}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MessageCircle size={28} color={Colors.light.icon} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Send size={28} color={Colors.light.icon} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.actionButton}>
              <Bookmark size={28} color={Colors.light.icon} />
            </TouchableOpacity>
          </View>

          {/* Likes Count */}
          <Text style={styles.likesCount}>
            {likes.toLocaleString()}件のいいね
          </Text>

          {/* User Info & Caption */}
          <View style={styles.userSection}>
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
              <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followButtonText}>フォロー</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.caption}>
              <Text style={styles.captionUsername}>{post.user.username}</Text>
              {' '}
              {post.caption}
            </Text>

            <Text style={styles.timestamp}>{post.timestamp}</Text>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsSectionTitle}>
              コメント {post.comments}件
            </Text>

            {postComments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <Image
                  source={{ uri: comment.avatar }}
                  style={styles.commentAvatar}
                  contentFit="cover"
                />
                <View style={styles.commentContent}>
                  <Text style={styles.commentText}>
                    <Text style={styles.commentUsername}>{comment.username}</Text>
                    {' '}
                    {comment.text}
                  </Text>
                  <View style={styles.commentMeta}>
                    <Text style={styles.commentTimestamp}>{comment.timestamp}</Text>
                    <TouchableOpacity>
                      <Text style={styles.commentReplyButton}>返信</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity style={styles.commentLikeButton}>
                  <Heart size={14} color={Colors.light.secondaryText} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={[styles.commentInputContainer, { paddingBottom: insets.bottom || 12 }]}>
          <Image
            source={{ uri: post.user.avatar }}
            style={styles.inputAvatar}
            contentFit="cover"
          />
          <TextInput
            style={styles.commentInput}
            placeholder="コメントを追加..."
            placeholderTextColor={Colors.light.secondaryText}
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity onPress={handleSendComment} disabled={!commentText.trim()}>
            <Text style={[
              styles.sendButton,
              commentText.trim() && styles.sendButtonActive
            ]}>
              投稿
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 4,
  },
  breadcrumbText: {
    fontSize: 13,
    color: Colors.light.secondaryText,
  },
  breadcrumbSeparator: {
    fontSize: 13,
    color: Colors.light.secondaryText,
  },
  breadcrumbCurrent: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
  },
  likesCount: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  userSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userTextContainer: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  location: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  caption: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  captionUsername: {
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 13,
    color: Colors.light.secondaryText,
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.light.border,
  },
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentUsername: {
    fontWeight: '600',
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentTimestamp: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    marginRight: 16,
  },
  commentReplyButton: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    fontWeight: '600',
  },
  commentLikeButton: {
    padding: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    fontSize: 15,
    color: Colors.light.secondaryText,
    fontWeight: '600',
    marginLeft: 12,
  },
  sendButtonActive: {
    color: Colors.light.primary,
  },
});
