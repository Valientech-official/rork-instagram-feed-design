import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, PanResponder, Animated, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { Search, Plus, Circle, Check, CheckCheck, ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  isRead: boolean;
  isTyping?: boolean;
}

// Mock data for messages
const mockMessages: Message[] = [
  {
    id: '1',
    userId: 'u1',
    username: 'fashion_lover',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    lastMessage: 'その服どこで買ったの？すごく可愛い！',
    timestamp: '2分前',
    unreadCount: 2,
    isOnline: true,
    isRead: false,
  },
  {
    id: '2',
    userId: 'u2',
    username: 'style_master',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    lastMessage: '了解です！後で連絡します',
    timestamp: '15分前',
    unreadCount: 0,
    isOnline: true,
    isRead: true,
  },
  {
    id: '3',
    userId: 'u3',
    username: 'trendy_tokyo',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    lastMessage: '写真送りました〜',
    timestamp: '1時間前',
    unreadCount: 0,
    isOnline: false,
    isRead: true,
    isTyping: false,
  },
  {
    id: '4',
    userId: 'u4',
    username: 'vintage_collector',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop',
    lastMessage: 'そのバッグ、まだ販売してますか？',
    timestamp: '3時間前',
    unreadCount: 1,
    isOnline: false,
    isRead: false,
  },
  {
    id: '5',
    userId: 'u5',
    username: 'minimal_style',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
    lastMessage: 'ありがとうございます！',
    timestamp: '昨日',
    unreadCount: 0,
    isOnline: true,
    isRead: true,
  },
  {
    id: '6',
    userId: 'u6',
    username: 'streetwear_jp',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    lastMessage: '新作入荷しました！チェックしてみてください',
    timestamp: '昨日',
    unreadCount: 3,
    isOnline: false,
    isRead: false,
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DMScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [messages, setMessages] = useState<Message[]>(mockMessages);

  const translateX = useRef(new Animated.Value(0)).current;

  // Reset translateX when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      translateX.setValue(0);
    }, [translateX])
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        return evt.nativeEvent.pageX < 30 && gestureState.dx > 0;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return evt.nativeEvent.pageX < 30 && gestureState.dx > 5;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx > 0) {
          translateX.setValue(Math.min(gestureState.dx, SCREEN_WIDTH));
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 100) {
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            router.back();
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleMessagePress = (message: Message) => {
    // Navigate to individual chat screen
    router.push(`/dm/${message.userId}`);

    // Mark as read
    setMessages(prev =>
      prev.map(m =>
        m.id === message.id ? { ...m, unreadCount: 0, isRead: true } : m
      )
    );
  };

  const handleNewMessage = () => {
    router.push('/dm/new');
  };

  const filteredMessages = messages.filter(m =>
    m.username.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderMessage = ({ item }: { item: Message }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() => handleMessagePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={[styles.username, !item.isRead && styles.unreadUsername]}>
            {item.username}
          </Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>

        {item.isTyping ? (
          <Text style={styles.typingIndicator}>入力中...</Text>
        ) : (
          <View style={styles.lastMessageContainer}>
            <Text
              style={[styles.lastMessage, !item.isRead && styles.unreadMessage]}
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
            {item.isRead && (
              <CheckCheck size={14} color={Colors.light.primary} style={styles.readIcon} />
            )}
          </View>
        )}
      </View>

      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            transform: [{ translateX }]
          }
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.title}>メッセージ</Text>
          <TouchableOpacity onPress={handleNewMessage}>
            <Plus size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={18} color={Colors.light.secondaryText} />
          <TextInput
            style={styles.searchInput}
            placeholder="検索"
            placeholderTextColor={Colors.light.secondaryText}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={styles.statusContainer}>
          <TouchableOpacity style={styles.statusChip}>
            <Circle size={8} color="#4CAF50" fill="#4CAF50" />
            <Text style={styles.statusText}>オンライン ({messages.filter(m => m.isOnline).length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statusChip}>
            <Text style={styles.statusText}>
              未読 ({messages.filter(m => !m.isRead).length})
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    flex: 1,
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.light.text,
  },
  statusContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    color: Colors.light.text,
  },
  listContainer: {
    paddingBottom: 20,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: Colors.light.text,
  },
  unreadUsername: {
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: Colors.light.secondaryText,
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    flex: 1,
  },
  unreadMessage: {
    color: Colors.light.text,
    fontWeight: '500',
  },
  readIcon: {
    marginLeft: 4,
  },
  typingIndicator: {
    fontSize: 14,
    color: Colors.light.primary,
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: Colors.light.background,
    fontSize: 12,
    fontWeight: '600',
  },
});