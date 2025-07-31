import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MessageCircle, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { RoomPost as RoomPostType } from '@/mocks/roomPosts';
import { getFirstTwoCommentsForRoomPost, getCommentsForRoomPost, RoomComment } from '@/mocks/roomComments';

interface RoomPostProps {
  post: RoomPostType;
  onPress?: () => void;
}

export default function RoomPost({ post, onPress }: RoomPostProps) {
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  const firstTwoComments = getFirstTwoCommentsForRoomPost(post.id);
  const allComments = getCommentsForRoomPost(post.id);
  
  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '…';
  };
  
  const handleCommentPress = () => {
    setShowCommentModal(true);
  };
  
  const handleEmojiPress = (emoji: string) => {
    setNewComment(prev => prev + emoji);
  };
  
  const emojis = ['🔥', '👏', '💕', '😊', '😲', '😍', '😏', '😅'];
  
  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
          <View style={styles.roomBadge}>
            <Text style={styles.roomName}>{post.roomName}</Text>
          </View>
          
          <Image
            source={{ uri: post.images[0] }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          
          <View style={styles.overlay}>
            <View style={styles.userInfo}>
              <Image
                source={{ uri: post.user.avatar }}
                style={styles.avatar}
                contentFit="cover"
              />
              <Text style={styles.username}>{post.user.username}</Text>
            </View>
            
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Heart size={16} color="white" fill={post.liked ? "white" : "transparent"} />
                <Text style={styles.statText}>{post.likes}</Text>
              </View>
              <TouchableOpacity style={styles.statItem} onPress={handleCommentPress}>
                <MessageCircle size={16} color="white" />
                <Text style={styles.statText}>{post.comments}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
        
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
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>コメント</Text>
            <TouchableOpacity onPress={() => setShowCommentModal(false)}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.commentsContainer}>
            {allComments.map((comment) => (
              <View key={comment.id} style={styles.modalCommentItem}>
                <Image
                  source={{ uri: comment.avatar }}
                  style={styles.commentAvatar}
                  contentFit="cover"
                />
                <View style={styles.commentContent}>
                  <Text style={styles.modalCommentUsername}>{comment.username}</Text>
                  <Text style={styles.modalCommentText}>{comment.text}</Text>
                  <Text style={styles.commentTimestamp}>{comment.timestamp}</Text>
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
    height: 200,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'white',
  },
  username: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  statText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
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
    marginBottom: 4,
  },
  commentTimestamp: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
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