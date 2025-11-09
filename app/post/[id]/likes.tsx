import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ChevronLeft, Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import Colors from '@/constants/colors';
import { getPostLikes, toggleFollow, type PostLike } from '@/services/interactionService';

export default function PostLikesScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [likes, setLikes] = useState<PostLike[]>([]);
  const [filteredLikes, setFilteredLikes] = useState<PostLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadLikes();
    }
  }, [id]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = likes.filter(
        (like) =>
          like.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          like.user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLikes(filtered);
    } else {
      setFilteredLikes(likes);
    }
  }, [searchQuery, likes]);

  const loadLikes = async (isRefresh: boolean = false) => {
    if (!id || typeof id !== 'string') return;

    try {
      if (isRefresh) {
        setRefreshing(true);
        setOffset(0);
      } else {
        setLoading(true);
      }

      const response = await getPostLikes(id, 50, isRefresh ? 0 : offset);

      if (isRefresh) {
        setLikes(response.items);
      } else {
        setLikes(prev => [...prev, ...response.items]);
      }

      setHasMore(response.has_more);
      setOffset(response.next_offset || response.items.length);
    } catch (error) {
      console.error('Failed to load likes:', error);
      Alert.alert('Error', 'Failed to load likes. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadLikes(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      loadLikes(false).finally(() => setLoadingMore(false));
    }
  };

  const handleUserPress = (userId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/profile/${userId}`);
  };

  const handleFollowToggle = async (accountId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const result = await toggleFollow(accountId);

      setLikes(prev =>
        prev.map(like =>
          like.account_id === accountId
            ? { ...like, user: { ...like.user, is_following: result.is_following } }
            : like
        )
      );

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    }
  };

  const renderLike = ({ item }: { item: PostLike }) => (
    <TouchableOpacity
      style={styles.likeItem}
      onPress={() => handleUserPress(item.account_id)}
    >
      <Image
        source={{ uri: item.user.avatar_url || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <View style={styles.nameContainer}>
          <Text style={styles.username}>{item.user.username}</Text>
          {item.user.is_verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          )}
        </View>
        {item.user.display_name && (
          <Text style={styles.displayName}>{item.user.display_name}</Text>
        )}
      </View>
      <TouchableOpacity
        style={[
          styles.followButton,
          item.user.is_following && styles.followingButton,
        ]}
        onPress={() => handleFollowToggle(item.account_id)}
      >
        <Text
          style={[
            styles.followButtonText,
            item.user.is_following && styles.followingButtonText,
          ]}
        >
          {item.user.is_following ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Likes Yet</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery ? 'No users found matching your search' : 'Be the first to like this post'}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.light.primary} />
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Likes',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.light.secondaryText} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor={Colors.light.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        {loading && likes.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredLikes}
            renderItem={renderLike}
            keyExtractor={(item) => item.account_id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.light.primary}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  backButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.separator,
    borderRadius: 10,
    margin: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    paddingVertical: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 12,
  },
  likeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 10,
    color: Colors.light.background,
    fontWeight: 'bold',
  },
  displayName: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.background,
  },
  followingButtonText: {
    color: Colors.light.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
