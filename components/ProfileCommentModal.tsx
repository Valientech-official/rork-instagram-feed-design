import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  PanResponder,
  ScrollView
} from 'react-native';
import { Image } from 'expo-image';
import { X, Send, UserCircle } from 'lucide-react-native';
import { ProfileComment, getCommentsForPost } from '@/mocks/profileComments';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.75;

interface ProfileCommentModalProps {
  visible: boolean;
  postId: string;
  onClose: () => void;
}

export default function ProfileCommentModal({ visible, postId, onClose }: ProfileCommentModalProps) {
  const [comments, setComments] = useState<ProfileComment[]>(() => getCommentsForPost(postId));
  const [newComment, setNewComment] = useState('');
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const translateY = useRef(new Animated.Value(MODAL_HEIGHT)).current;

  React.useEffect(() => {
    if (visible) {
      setComments(getCommentsForPost(postId));
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: MODAL_HEIGHT,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [visible, postId]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return gestureState.dy > 0 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        translateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100) {
        handleClose();
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const handleClose = () => {
    Animated.spring(translateY, {
      toValue: MODAL_HEIGHT,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      onClose();
    });
  };

  const handleSendComment = () => {
    if (newComment.trim()) {
      const comment: ProfileComment = {
        id: `comment_${Date.now()}`,
        postId,
        userId: 'current_user',
        username: 'あなた',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
        text: newComment.trim(),
        timestamp: 'たった今',
        createdAt: Date.now()
      };
      
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    }
  };

  const handleEmojiPress = (emoji: string) => {
    setNewComment(prev => prev + emoji);
  };

  const emojis = ['🔥', '👏', '💕', '😊', '😲', '😍', '😏', '😅'];

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    backdrop: {
      flex: 1,
    },
    modalContainer: {
      height: MODAL_HEIGHT,
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    dragHandle: {
      width: 40,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 8,
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    commentsList: {
      flex: 1,
    },
    commentsContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
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
    commentAvatarPlaceholder: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 12,
      backgroundColor: colors.shopBackground,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    commentContent: {
      flex: 1,
    },
    commentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    commentUsername: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginRight: 8,
    },
    commentTimestamp: {
      fontSize: 12,
      color: colors.secondaryText,
    },
    commentText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    inputContainer: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
      minHeight: 120,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    inputAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 12,
    },
    inputAvatarPlaceholder: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 12,
      backgroundColor: colors.shopBackground,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    textInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      fontSize: 14,
      color: colors.text,
      maxHeight: 100,
      marginRight: 8,
    },
    sendButton: {
      padding: 8,
    },
    emojiContainer: {
      backgroundColor: colors.background,
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    emojiContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    emojiButton: {
      paddingHorizontal: 6,
      paddingVertical: 6,
      backgroundColor: colors.shopCard,
      borderRadius: 16,
      minWidth: 36,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      marginHorizontal: 2,
    },
    emojiText: {
      fontSize: 20,
    },
  });

  const renderComment = ({ item }: { item: ProfileComment }) => (
    <View style={styles.commentItem}>
      {item.avatar ? (
        <Image
          source={{ uri: item.avatar }}
          style={styles.commentAvatar}
          contentFit="cover"
        />
      ) : (
        <View style={styles.commentAvatarPlaceholder}>
          <UserCircle size={32} color={colors.icon} />
        </View>
      )}
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUsername}>{item.username}</Text>
          <Text style={styles.commentTimestamp}>{item.timestamp}</Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY }],
              paddingBottom: insets.bottom,
            }
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.dragHandle} />
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>コメント</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            style={styles.commentsList}
            contentContainerStyle={styles.commentsContent}
            showsVerticalScrollIndicator={false}
            inverted
          />

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.inputContainer}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
          >
            <View style={styles.emojiContainer}>
              <View style={styles.emojiContent}>
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
            </View>
            
            <View style={styles.inputRow}>
              {user?.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.inputAvatar}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.inputAvatarPlaceholder}>
                  <UserCircle size={28} color={colors.icon} />
                </View>
              )}
              <TextInput
                style={styles.textInput}
                placeholder="コメントを追加..."
                placeholderTextColor={colors.secondaryText}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                onPress={handleSendComment}
                style={[
                  styles.sendButton,
                  { opacity: newComment.trim() ? 1 : 0.5 }
                ]}
                disabled={!newComment.trim()}
              >
                <Send size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}