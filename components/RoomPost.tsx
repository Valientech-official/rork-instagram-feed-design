import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MessageCircle, X, Hand } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { RoomPost as RoomPostType } from '@/mocks/roomPosts';
import { getFirstTwoCommentsForRoomPost, getCommentsForRoomPost, RoomComment } from '@/mocks/roomComments';

const { width } = Dimensions.get('window');

interface RoomPostProps {
  post: RoomPostType;
  onPress?: () => void;
}

export default function RoomPost({ post, onPress }: RoomPostProps) {
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [peaceCount, setPeaceCount] = useState(post.likes); // 仮でlikesを使用
  const [isPeaced, setIsPeaced] = useState(false);

  const firstTwoComments = getFirstTwoCommentsForRoomPost(post.id);
  const allComments = getCommentsForRoomPost(post.id);

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '…';
  };

  const handleCommentPress = () => {
    setShowCommentModal(true);
  };

  const handlePeacePress = () => {
    setIsPeaced(!isPeaced);
    setPeaceCount(prev => isPeaced ? prev - 1 : prev + 1);
  };

  const handleEmojiPress = (emoji: string) => {
    setNewComment(prev => prev + emoji);
  };

  const emojis = ['🔥', '👏', '💕', '😊', '😲', '😍', '😏', '😅'];

  const imageHeight = (width - 32) * 3 / 5; // 5/3比率
  const userInfoHeight = (width - 32) * 2 / 5; // 5/2比率

  return (
    <>
      <View style={styles.container}>
        <View style={styles.roomBadge}>
          <Text style={styles.roomName}>{post.roomName}</Text>
        </View>

        {/* 5/3サイズの画像 */}
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
          <Image
            source={{ uri: post.images[0] }}
            style={[styles.image, { height: imageHeight }]}
            contentFit="cover"
            transition={200}
          />
        </TouchableOpacity>

        {/* 5/2サイズのユーザー情報エリア */}
        <View style={[styles.userInfoArea, { minHeight: userInfoHeight }]}>
          <View style={styles.userHeader}>
            <Image
              source={{ uri: post.user.avatar }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.userDetails}>
              <Text style={styles.username}>{post.user.username}</Text>
              <Text style={styles.timestamp}>{post.timestamp}</Text>
            </View>
          </View>

          <Text style={styles.caption} numberOfLines={3}>
            {post.caption}
          </Text>

          {/* アクションエリア */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handlePeacePress}
            >
              <Hand
                size={20}
                color={isPeaced ? Colors.light.primary : Colors.light.text}
                fill={isPeaced ? Colors.light.primary : "transparent"}
              />
              <Text style={[styles.actionText, isPeaced && styles.actionTextActive]}>
                {peaceCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleCommentPress}
            >
              <MessageCircle size={20} color={Colors.light.text} />
              <Text style={styles.actionText}>{post.comments}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          {firstTwoComments.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <Text style={styles.commentText}>
                <Text style={styles.commentUsername}>{comment.username}</Text>
                {' '}
                {truncateText(comment.text)}
              </Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* Comment Modal */}
      <Modal
        visible={showCommentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCommentModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>コメント</Text>
            <TouchableOpacity onPress={() => setShowCommentModal(false)}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          {/* 1/4サイズの画像プレビュー */}
          <View style={styles.miniImageContainer}>
            <Image
              source={{ uri: post.images[0] }}
              style={styles.miniImage}
              contentFit="cover"
            />
          </View>

          <ScrollView style={styles.commentsContainer}>
            {/* いいね数順にソート */}
            {[...allComments]
              .sort((a, b) => (b.likes || 0) - (a.likes || 0))
              .map((comment) => (
              <View key={comment.id} style={styles.modalCommentItem}>
                <Image
                  source={{ uri: comment.avatar }}
                  style={styles.commentAvatar}
                  contentFit="cover"
                />
                <View style={styles.commentContent}>
                  <Text style={styles.modalCommentUsername}>{comment.username}</Text>
                  <Text style={styles.modalCommentText}>{comment.text}</Text>
                  <View style={styles.commentFooter}>
                    <Text style={styles.commentTimestamp}>{comment.timestamp}</Text>
                    {comment.likes && (
                      <View style={styles.commentLikes}>
                        <Heart size={12} color={Colors.light.like} fill={Colors.light.like} />
                        <Text style={styles.commentLikesText}>{comment.likes}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.inputContainer}>
            <View style={styles.emojiContainer}>
              {emojis.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.emojiButton}
                  onPress={() => handleEmojiPress(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="コメントを追加..."
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              <TouchableOpacity style={styles.sendButton}>
                <Text style={styles.sendButtonText}>投稿</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  image: {
    width: '100%',
  },
  roomBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  roomName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  userInfoArea: {
    padding: 12,
    backgroundColor: 'white',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontWeight: '600',
    fontSize: 14,
    color: Colors.light.text,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    marginTop: 2,
  },
  caption: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  actionTextActive: {
    color: Colors.light.primary,
  },
  commentsSection: {
    padding: 12,
    paddingTop: 8,
  },
  commentItem: {
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 18,
  },
  commentUsername: {
    fontWeight: '600',
    color: Colors.light.text,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  miniImageContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  miniImage: {
    width: width / 4,
    height: (width / 4) * 1.2,
    borderRadius: 8,
  },
  commentsContainer: {
    flex: 1,
    padding: 16,
  },
  modalCommentItem: {
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
  modalCommentUsername: {
    fontWeight: '600',
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 2,
  },
  modalCommentText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 6,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentTimestamp: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  commentLikes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentLikesText: {
    fontSize: 12,
    color: Colors.light.like,
    fontWeight: '600',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: 'white',
  },
  emojiContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  emojiButton: {
    padding: 4,
  },
  emojiText: {
    fontSize: 20,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});