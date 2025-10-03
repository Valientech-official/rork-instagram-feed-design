import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, PanResponder, Animated, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Heart, MessageCircle, UserPlus, ShoppingBag, Video, Users } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NotificationType = 'like' | 'comment' | 'follow' | 'purchase' | 'live' | 'room';

interface Notification {
  id: string;
  type: NotificationType;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  isRead: boolean;
  postImage?: string;
  productImage?: string;
}

// Mock notification data
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'like',
    user: {
      id: 'u1',
      username: 'fashion_lover',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    },
    content: 'があなたの投稿にいいねしました',
    timestamp: '2分前',
    isRead: false,
    postImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100&h=100&fit=crop',
  },
  {
    id: '2',
    type: 'follow',
    user: {
      id: 'u2',
      username: 'style_master',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    },
    content: 'があなたをフォローし始めました',
    timestamp: '5分前',
    isRead: false,
  },
  {
    id: '3',
    type: 'comment',
    user: {
      id: 'u3',
      username: 'trendy_tokyo',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    },
    content: 'がコメントしました: 「素敵なコーデですね！」',
    timestamp: '10分前',
    isRead: true,
    postImage: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100&h=100&fit=crop',
  },
  {
    id: '4',
    type: 'live',
    user: {
      id: 'u4',
      username: 'live_streamer',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop',
    },
    content: 'がライブ配信を開始しました',
    timestamp: '15分前',
    isRead: true,
  },
  {
    id: '5',
    type: 'room',
    user: {
      id: 'u5',
      username: 'room_host',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
    },
    content: 'があなたをルームに招待しました',
    timestamp: '30分前',
    isRead: true,
  },
  {
    id: '6',
    type: 'purchase',
    user: {
      id: 'u6',
      username: 'buyer123',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    },
    content: 'があなたの商品を購入しました',
    timestamp: '1時間前',
    isRead: true,
    productImage: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=100&h=100&fit=crop',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function NotificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const translateX = useRef(new Animated.Value(0)).current;

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

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'like':
        return <Heart size={20} color={Colors.light.shopSale} fill={Colors.light.shopSale} />;
      case 'comment':
        return <MessageCircle size={20} color={Colors.light.primary} />;
      case 'follow':
        return <UserPlus size={20} color={Colors.light.primary} />;
      case 'purchase':
        return <ShoppingBag size={20} color="#4CAF50" />;
      case 'live':
        return <Video size={20} color="#FF5722" />;
      case 'room':
        return <Users size={20} color="#9C27B0" />;
      default:
        return null;
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);
    // Navigate based on notification type
    switch (notification.type) {
      case 'like':
      case 'comment':
        // Navigate to post
        console.log('Navigate to post');
        break;
      case 'follow':
        // Navigate to user profile
        console.log('Navigate to user profile:', notification.user.id);
        break;
      case 'purchase':
        // Navigate to order details
        console.log('Navigate to order');
        break;
      case 'live':
        router.push('/live');
        break;
      case 'room':
        router.push('/room');
        break;
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
        <View style={styles.iconBadge}>
          {getNotificationIcon(item.type)}
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.notificationText}>
          <Text style={styles.username}>{item.user.username}</Text>
          <Text style={styles.content}>{item.content}</Text>
        </Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>

      {(item.postImage || item.productImage) && (
        <Image
          source={{ uri: item.postImage || item.productImage }}
          style={styles.mediaThumb}
        />
      )}
    </TouchableOpacity>
  );

  return (
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
        <Text style={styles.title}>通知</Text>
        <TouchableOpacity onPress={() => setNotifications([])}>
          <Text style={styles.clearButton}>すべて削除</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            すべて
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'unread' && styles.filterChipActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
            未読 ({notifications.filter(n => !n.isRead).length})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {filter === 'unread' ? '未読の通知はありません' : '通知はありません'}
            </Text>
          </View>
        }
      />
    </Animated.View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  clearButton: {
    fontSize: 14,
    color: Colors.light.primary,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 60,
  },
  filterChip: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterChipActive: {
    backgroundColor: Colors.light.text,
    borderColor: Colors.light.text,
  },
  filterText: {
    color: Colors.light.text,
    fontSize: 14,
  },
  filterTextActive: {
    color: Colors.light.background,
  },
  listContainer: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
  },
  unreadItem: {
    backgroundColor: '#f0f8ff',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 2,
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  contentContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 4,
  },
  username: {
    fontWeight: '600',
  },
  content: {
    fontWeight: '400',
  },
  timestamp: {
    fontSize: 12,
    color: Colors.light.secondaryText,
  },
  mediaThumb: {
    width: 44,
    height: 44,
    borderRadius: 4,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
  },
});