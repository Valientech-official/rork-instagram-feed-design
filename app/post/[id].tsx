import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { ChevronLeft, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2 } from 'lucide-react-native';
import { profilePosts } from '@/mocks/profilePosts';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import {
  getComments,
  addComment,
  deleteComment,
  likeComment,
  organizeCommentsIntoThreads,
  type Comment,
} from '@/services/commentService';

const { width, height } = Dimensions.get('window');

// Comment Item Component
interface CommentItemProps {
  comment: Comment;
  level: number;
  onReply: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
  onLongPress: (comment: Comment) => void;
  currentUserId?: string;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  level,
  onReply,
  onDelete,
  onLike,
  onLongPress,
  currentUserId,
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.liked_by_current_user || false);
  const [likesCount, setLikesCount] = useState(comment.likes_count);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLikePress = async () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount(newLikedState ? likesCount + 1 : likesCount - 1);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await onLike(comment.comment_id);
    } catch (error) {
      setIsLiked(!newLikedState);
      setLikesCount(newLikedState ? likesCount - 1 : likesCount + 1);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - commentTime.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  const isOwnComment = comment.user_id === currentUserId;
  const hasReplies = (comment.replies?.length || 0) > 0;
  const maxLevel = 2;
  const canNest = level < maxLevel;

  return (
    <View style={[styles.commentItem, level > 0 && styles.nestedComment]}>
      <Image
        source={{ uri: comment.user?.avatar_url || 'https://via.placeholder.com/32' }}
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <TouchableOpacity
          onLongPress={() => onLongPress(comment)}
          delayLongPress={500}
        >
          <View style={styles.commentHeader}>
            <Text style={styles.commentUsername}>{comment.user?.username || 'User'}</Text>
            <Text style={styles.commentTime}>{formatTimeAgo(comment.created_at)}</Text>
          </View>
          <Text style={styles.commentText}>{comment.content}</Text>
        </TouchableOpacity>

        <View style={styles.commentActions}>
          {canNest && (
            <TouchableOpacity onPress={() => onReply(comment)} style={styles.commentActionButton}>
              <Text style={styles.commentActionText}>Reply</Text>
            </TouchableOpacity>
          )}
          {likesCount > 0 && (
            <Text style={styles.commentLikesCount}>
              {likesCount} {likesCount === 1 ? 'like' : 'likes'}
            </Text>
          )}
        </View>

        {hasReplies && (
          <TouchableOpacity
            onPress={() => setShowReplies(!showReplies)}
            style={styles.viewRepliesButton}
          >
            <View style={styles.replyLine} />
            <Text style={styles.viewRepliesText}>
              {showReplies ? 'Hide' : 'View'} {comment.replies_count}{' '}
              {comment.replies_count === 1 ? 'reply' : 'replies'}
            </Text>
          </TouchableOpacity>
        )}

        {showReplies && comment.replies && (
          <View style={styles.repliesContainer}>
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.comment_id}
                comment={reply}
                level={level + 1}
                onReply={onReply}
                onDelete={onDelete}
                onLike={onLike}
                onLongPress={onLongPress}
                currentUserId={currentUserId}
              />
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity onPress={handleLikePress} style={styles.commentLikeButton}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Heart
            size={12}
            color={isLiked ? Colors.light.like : Colors.light.secondaryText}
            fill={isLiked ? Colors.light.like : 'transparent'}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const post = profilePosts.find(p => p.id === id);
  const [liked, setLiked] = useState(false);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Mock current user ID (replace with actual auth)
  const currentUserId = 'current-user-id';

  useEffect(() => {
    loadComments();
  }, [id]);

  const loadComments = async () => {
    if (!id || typeof id !== 'string') return;

    try {
      setLoading(true);
      const fetchedComments = await getComments(id);
      const organizedComments = organizeCommentsIntoThreads(fetchedComments);
      setComments(organizedComments);
    } catch (error) {
      console.error('Failed to load comments:', error);
      Alert.alert('Error', 'Failed to load comments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadComments();
    setRefreshing(false);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !id || typeof id !== 'string') return;

    try {
      setSubmitting(true);

      const newComment = await addComment({
        post_id: id,
        content: commentText.trim(),
        parent_comment_id: replyingTo?.comment_id,
      });

      // Optimistic update
      if (replyingTo) {
        // Add reply to parent comment
        setComments(prevComments => {
          const updatedComments = [...prevComments];
          const updateReplies = (commentsList: Comment[]): Comment[] => {
            return commentsList.map(comment => {
              if (comment.comment_id === replyingTo.comment_id) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), newComment],
                  replies_count: (comment.replies_count || 0) + 1,
                };
              }
              if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: updateReplies(comment.replies),
                };
              }
              return comment;
            });
          };
          return updateReplies(updatedComments);
        });
      } else {
        // Add top-level comment
        setComments(prevComments => [newComment, ...prevComments]);
      }

      setCommentText('');
      setReplyingTo(null);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
    inputRef.current?.focus();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setCommentText('');
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(commentId);

            // Remove from local state
            setComments(prevComments => {
              const removeComment = (commentsList: Comment[]): Comment[] => {
                return commentsList
                  .filter(comment => comment.comment_id !== commentId)
                  .map(comment => ({
                    ...comment,
                    replies: comment.replies ? removeComment(comment.replies) : [],
                  }));
              };
              return removeComment(prevComments);
            });

            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          } catch (error) {
            console.error('Failed to delete comment:', error);
            Alert.alert('Error', 'Failed to delete comment. Please try again.');
          }
        },
      },
    ]);
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await likeComment(commentId);
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleLongPress = (comment: Comment) => {
    setSelectedComment(comment);
    setShowActionSheet(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleActionSheetAction = (action: 'reply' | 'delete' | 'report') => {
    setShowActionSheet(false);

    setTimeout(() => {
      if (!selectedComment) return;

      switch (action) {
        case 'reply':
          handleReply(selectedComment);
          break;
        case 'delete':
          handleDeleteComment(selectedComment.comment_id);
          break;
        case 'report':
          Alert.alert('Report', 'Report functionality coming soon');
          break;
      }
      setSelectedComment(null);
    }, 300);
  };

  if (!post) {
    return (
      <View style={styles.notFound}>
        <Text>Post not found</Text>
      </View>
    );
  }

  const handleBack = () => {
    router.back();
  };

  const handleLike = () => {
    setLiked(!liked);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Post',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.postHeader}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80',
              }}
              style={styles.avatar}
            />
            <View style={styles.headerInfo}>
              <Text style={styles.username}>username</Text>
              <Text style={styles.location}>Location</Text>
            </View>
          </View>

          <Image
            source={{ uri: post.imageUrl }}
            style={styles.postImage}
            contentFit="cover"
          />

          <View style={styles.actionsContainer}>
            <View style={styles.leftActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                <Heart
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
            </View>

            <TouchableOpacity style={styles.actionButton}>
              <Bookmark size={24} color={Colors.light.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.postInfo}>
            <Text style={styles.likes}>{post.likes} likes</Text>
            <View style={styles.captionContainer}>
              <Text style={styles.captionUsername}>username</Text>
              <Text style={styles.caption}>
                This is a sample caption for this post. #hashtag #sample
              </Text>
            </View>
          </View>

          <View style={styles.commentsSection}>
            <View style={styles.commentsSectionHeader}>
              <Text style={styles.commentsSectionTitle}>
                Comments ({comments.length})
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.emptyCommentsContainer}>
                <Text style={styles.emptyCommentsText}>No comments yet</Text>
                <Text style={styles.emptyCommentsSubtext}>Be the first to comment</Text>
              </View>
            ) : (
              <View style={styles.commentsContainer}>
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.comment_id}
                    comment={comment}
                    level={0}
                    onReply={handleReply}
                    onDelete={handleDeleteComment}
                    onLike={handleLikeComment}
                    onLongPress={handleLongPress}
                    currentUserId={currentUserId}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.commentInputContainer}>
          {replyingTo && (
            <View style={styles.replyingToContainer}>
              <Text style={styles.replyingToText}>
                Replying to {replyingTo.user?.username}
              </Text>
              <TouchableOpacity onPress={handleCancelReply}>
                <Text style={styles.cancelReplyText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80',
              }}
              style={styles.inputAvatar}
            />
            <TextInput
              ref={inputRef}
              style={styles.commentInput}
              placeholder={replyingTo ? 'Add a reply...' : 'Add a comment...'}
              placeholderTextColor={Colors.light.secondaryText}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleAddComment}
              disabled={!commentText.trim() || submitting}
              style={[
                styles.sendButton,
                (!commentText.trim() || submitting) && styles.sendButtonDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={Colors.light.primary} />
              ) : (
                <Text
                  style={[
                    styles.sendButtonText,
                    !commentText.trim() && styles.sendButtonTextDisabled,
                  ]}
                >
                  Post
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={showActionSheet}
          transparent
          animationType="fade"
          onRequestClose={() => setShowActionSheet(false)}
        >
          <TouchableOpacity
            style={styles.actionSheetOverlay}
            activeOpacity={1}
            onPress={() => setShowActionSheet(false)}
          >
            <View style={styles.actionSheet}>
              <TouchableOpacity
                style={styles.actionSheetButton}
                onPress={() => handleActionSheetAction('reply')}
              >
                <MessageCircle size={20} color={Colors.light.text} />
                <Text style={styles.actionSheetButtonText}>Reply</Text>
              </TouchableOpacity>

              {selectedComment?.user_id === currentUserId && (
                <TouchableOpacity
                  style={[styles.actionSheetButton, styles.actionSheetButtonDanger]}
                  onPress={() => handleActionSheetAction('delete')}
                >
                  <Trash2 size={20} color={Colors.light.error} />
                  <Text style={styles.actionSheetButtonTextDanger}>Delete</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.actionSheetButton}
                onPress={() => handleActionSheetAction('report')}
              >
                <MoreHorizontal size={20} color={Colors.light.text} />
                <Text style={styles.actionSheetButtonText}>Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionSheetButton, styles.actionSheetButtonCancel]}
                onPress={() => setShowActionSheet(false)}
              >
                <Text style={styles.actionSheetButtonTextBold}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerInfo: {
    marginLeft: 10,
  },
  username: {
    fontWeight: '600',
    fontSize: 14,
    color: Colors.light.text,
  },
  location: {
    fontSize: 12,
    color: Colors.light.secondaryText,
  },
  postImage: {
    width: width,
    height: width,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  leftActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginRight: 16,
  },
  postInfo: {
    paddingHorizontal: 12,
  },
  likes: {
    fontWeight: '600',
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 6,
  },
  captionContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  captionUsername: {
    fontWeight: '600',
    fontSize: 14,
    color: Colors.light.text,
    marginRight: 4,
  },
  caption: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  // Comments Section
  commentsSection: {
    marginTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  commentsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.separator,
  },
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCommentsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  commentsContainer: {
    gap: 16,
  },
  // Comment Item
  commentItem: {
    flexDirection: 'row',
    gap: 10,
    position: 'relative',
  },
  nestedComment: {
    marginLeft: 32,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  commentTime: {
    fontSize: 12,
    color: Colors.light.secondaryText,
  },
  commentText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 18,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  commentActionButton: {
    paddingVertical: 4,
  },
  commentActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.secondaryText,
  },
  commentLikesCount: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.secondaryText,
  },
  commentLikeButton: {
    padding: 4,
  },
  viewRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    marginTop: 4,
  },
  replyLine: {
    width: 24,
    height: 1,
    backgroundColor: Colors.light.separator,
  },
  viewRepliesText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.secondaryText,
  },
  repliesContainer: {
    marginTop: 8,
    gap: 12,
  },
  // Comment Input
  commentInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.separator,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.primaryLight,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 13,
    color: Colors.light.text,
  },
  cancelReplyText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.separator,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 80,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  sendButtonTextDisabled: {
    color: Colors.light.secondaryText,
  },
  // Action Sheet
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  actionSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.separator,
  },
  actionSheetButtonDanger: {
    borderBottomColor: Colors.light.separator,
  },
  actionSheetButtonCancel: {
    borderBottomWidth: 0,
    justifyContent: 'center',
    marginTop: 8,
  },
  actionSheetButtonText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  actionSheetButtonTextDanger: {
    fontSize: 16,
    color: Colors.light.error,
  },
  actionSheetButtonTextBold: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
});