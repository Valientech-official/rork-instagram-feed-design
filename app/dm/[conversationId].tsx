import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Linking,
  RefreshControl,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Image as ImageIcon, Link as LinkIcon, Check, CheckCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ChatMessage {
  message_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
  is_read: boolean;
  message_type?: 'text' | 'image' | 'link';
  image_url?: string;
  link_url?: string;
}

interface ConversationUser {
  userId: string;
  username: string;
  avatar: string;
  isOnline: boolean;
}

// Mock conversation user data
const mockConversationUsers: Record<string, ConversationUser> = {
  'u1': {
    userId: 'u1',
    username: 'fashion_lover',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    isOnline: true,
  },
  'u2': {
    userId: 'u2',
    username: 'style_master',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    isOnline: true,
  },
  'u3': {
    userId: 'u3',
    username: 'trendy_tokyo',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    isOnline: false,
  },
};

// Mock messages
const mockMessages: ChatMessage[] = [
  {
    message_id: 'm1',
    sender_id: 'u1',
    receiver_id: 'current_user',
    content: 'その服どこで買ったの？すごく可愛い！',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    is_read: true,
    message_type: 'text',
  },
  {
    message_id: 'm2',
    sender_id: 'current_user',
    receiver_id: 'u1',
    content: 'ありがとう！ZARAで買ったよ',
    timestamp: new Date(Date.now() - 3300000).toISOString(),
    is_read: true,
    message_type: 'text',
  },
  {
    message_id: 'm3',
    sender_id: 'u1',
    receiver_id: 'current_user',
    content: 'https://www.zara.com/product/12345',
    timestamp: new Date(Date.now() - 3000000).toISOString(),
    is_read: true,
    message_type: 'link',
    link_url: 'https://www.zara.com/product/12345',
  },
  {
    message_id: 'm4',
    sender_id: 'current_user',
    receiver_id: 'u1',
    content: '',
    timestamp: new Date(Date.now() - 2700000).toISOString(),
    is_read: true,
    message_type: 'image',
    image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop',
  },
  {
    message_id: 'm5',
    sender_id: 'u1',
    receiver_id: 'current_user',
    content: 'かわいい！これも欲しいなぁ',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    is_read: false,
    message_type: 'text',
  },
];

export default function ConversationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { user: currentUser } = useAuthStore();

  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Get conversation user info
  const conversationUser = mockConversationUsers[conversationId || 'u1'] || mockConversationUsers['u1'];

  // Scroll to bottom on mount and when messages change
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    markMessagesAsRead();
  }, [conversationId]);

  const markMessagesAsRead = async () => {
    // Update local state immediately
    setMessages(prev =>
      prev.map(msg =>
        msg.sender_id === conversationUser.userId ? { ...msg, is_read: true } : msg
      )
    );

    // TODO: Call backend API to mark messages as read
    // await fetch(`/chat/conversation/${conversationId}/read`, { method: 'POST' });
  };

  const loadOlderMessages = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      // TODO: Call backend API to load older messages
      // const response = await fetch(`/chat/conversation/${conversationId}/messages?before=${messages[0]?.message_id}`);
      // const olderMessages = await response.json();
      // setMessages(prev => [...olderMessages, ...prev]);

      console.log('Loading older messages...');
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to load older messages:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    const messageContent = inputText.trim();
    setInputText('');
    setIsSending(true);

    // Create optimistic message
    const optimisticMessage: ChatMessage = {
      message_id: `temp_${Date.now()}`,
      sender_id: currentUser?.userId || 'current_user',
      receiver_id: conversationUser.userId,
      content: messageContent,
      timestamp: new Date().toISOString(),
      is_read: false,
      message_type: 'text',
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // TODO: Call backend API to send message
      // const response = await fetch('/chat/message/send', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     receiver_id: conversationUser.userId,
      //     content: messageContent,
      //     message_type: 'text',
      //   }),
      // });
      // const savedMessage = await response.json();
      // Replace optimistic message with server response
      // setMessages(prev => prev.map(msg => msg.message_id === optimisticMessage.message_id ? savedMessage : msg));

      console.log('Message sent:', messageContent);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.message_id !== optimisticMessage.message_id));
    } finally {
      setIsSending(false);
    }
  };

  const handleLinkPress = (url: string) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      }
    });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'たった今';
    if (diffInMinutes < 60) return `${diffInMinutes}分前`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}時間前`;

    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isOwnMessage = item.sender_id === currentUser?.userId || item.sender_id === 'current_user';
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showTimestamp = !previousMessage ||
      new Date(item.timestamp).getTime() - new Date(previousMessage.timestamp).getTime() > 300000; // 5 minutes

    return (
      <View style={styles.messageWrapper}>
        {showTimestamp && (
          <Text style={styles.timestampText}>{formatTimestamp(item.timestamp)}</Text>
        )}

        <View style={[styles.messageRow, isOwnMessage && styles.ownMessageRow]}>
          {!isOwnMessage && (
            <Image
              source={{ uri: conversationUser.avatar }}
              style={styles.messageAvatar}
            />
          )}

          <View style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
          ]}>
            {item.message_type === 'image' && item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                style={styles.messageImage}
                contentFit="cover"
              />
            ) : item.message_type === 'link' && item.link_url ? (
              <TouchableOpacity onPress={() => handleLinkPress(item.link_url!)}>
                <View style={styles.linkContainer}>
                  <LinkIcon size={16} color={Colors.light.primary} />
                  <Text style={styles.linkText} numberOfLines={1}>
                    {item.content || item.link_url}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <Text style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              ]}>
                {item.content}
              </Text>
            )}

            {isOwnMessage && (
              <View style={styles.readStatusContainer}>
                {item.is_read ? (
                  <CheckCheck size={14} color={Colors.light.primary} />
                ) : (
                  <Check size={14} color={Colors.light.secondaryText} />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerUserInfo} activeOpacity={0.7}>
            <Image
              source={{ uri: conversationUser.avatar }}
              style={styles.headerAvatar}
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerUsername}>{conversationUser.username}</Text>
              {conversationUser.isOnline && (
                <Text style={styles.onlineStatus}>オンライン</Text>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.headerRight} />
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.message_id}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={loadOlderMessages}
              tintColor={Colors.light.primary}
            />
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input Area */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="メッセージを入力..."
              placeholderTextColor={Colors.light.secondaryText}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />

            <View style={styles.inputActions}>
              <TouchableOpacity style={styles.inputActionButton} disabled>
                <ImageIcon size={24} color={Colors.light.secondaryText} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isSending) && styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={Colors.light.background} />
                ) : (
                  <Send size={20} color={Colors.light.background} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  backButton: {
    padding: 8,
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  headerUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  onlineStatus: {
    fontSize: 12,
    color: Colors.light.primary,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageWrapper: {
    marginBottom: 12,
  },
  timestampText: {
    fontSize: 11,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    marginVertical: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  ownMessageRow: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: 'relative',
  },
  ownMessageBubble: {
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: Colors.light.separator,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: Colors.light.background,
  },
  otherMessageText: {
    color: Colors.light.text,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkText: {
    fontSize: 14,
    color: Colors.light.primary,
    textDecorationLine: 'underline',
    flex: 1,
  },
  readStatusContainer: {
    position: 'absolute',
    bottom: 4,
    right: 8,
  },
  inputContainer: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.light.separator,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.light.text,
    maxHeight: 100,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputActionButton: {
    padding: 8,
  },
  sendButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.light.border,
    opacity: 0.5,
  },
});
