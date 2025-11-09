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
import {
  getFollowers,
  toggleFollow,
  removeFollower,
  type UserProfile,
} from '@/services/interactionService';

export default function FollowersScreen() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [filteredFollowers, setFilteredFollowers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Mock current user ID (replace with actual auth)
  const currentUserId = 'current-user-id';

  useEffect(() => {
    if (userId && typeof userId === 'string') {
      setIsOwnProfile(userId === currentUserId);
      loadFollowers();
    }
  }, [userId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = followers.filter(
        (follower) =>
          follower.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          follower.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFollowers(filtered);
    } else {
      setFilteredFollowers(followers);
    }
  }, [searchQuery, followers]);

  const loadFollowers = async (isRefresh: boolean = false) => {
    if (!userId || typeof userId !== 'string') return;

    try {
      if (isRefresh) {
        setRefreshing(true);
        setOffset(0);
      } else {
        setLoading(true);
      }

      const response = await getFollowers(userId, 50, isRefresh ? 0 : offset);

      if (isRefresh) {
        setFollowers(response.items);
      } else {
        setFollowers(prev => [...prev, ...response.items]);
      }

      setHasMore(response.has_more);
      setOffset(response.next_offset || response.items.length);
    } catch (error) {
      console.error('Failed to load followers:', error);
      Alert.alert('Error', 'Failed to load followers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadFollowers(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      loadFollowers(false).finally(() => setLoadingMore(false));
    }
  };

  const handleUserPress = (accountId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/profile/${accountId}`);
  };

  const handleFollowToggle = async (accountId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const result = await toggleFollow(accountId);

      setFollowers(prev =>
        prev.map(follower =>
          follower.account_id === accountId
            ? { ...follower, is_following: result.is_following }
            : follower
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

  const handleRemoveFollower = (accountId: string, username: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      'Remove Follower',
      `Remove ${username} from your followers?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFollower(accountId);
              setFollowers(prev => prev.filter(f => f.account_id !== accountId));

              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              console.error('Failed to remove follower:', error);
              Alert.alert('Error', 'Failed to remove follower. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderFollower = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      style={styles.followerItem}
      onPress={() => handleUserPress(item.account_id)}
    >
      <Image
        source={{ uri: item.avatar_url || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <View style={styles.nameContainer}>
          <Text style={styles.username}>{item.username}</Text>
          {item.is_verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          )}
          {item.is_mutual && (
            <View style={styles.mutualBadge}>
              <Text style={styles.mutualText}>Mutual</Text>
            </View>
          )}
        </View>
        {item.display_name && (
          <Text style={styles.displayName}>{item.display_name}</Text>
        )}
      </View>
      {isOwnProfile ? (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFollower(item.account_id, item.username)}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.followButton,
            item.is_following && styles.followingButton,
          ]}
          onPress={() => handleFollowToggle(item.account_id)}
        >
          <Text
            style={[
              styles.followButtonText,
              item.is_following && styles.followingButtonText,
            ]}
          >
            {item.is_following ? 'Following' : 'Follow Back'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Followers</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery ? 'No followers found matching your search' : 'No followers yet'}
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
          headerTitle: 'Followers',
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
            placeholder="Search followers..."
            placeholderTextColor={Colors.light.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        {loading && followers.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredFollowers}
            renderItem={renderFollower}
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
  followerItem: {
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
    flexWrap: 'wrap',
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
  mutualBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.light.separator,
  },
  mutualText: {
    fontSize: 11,
    color: Colors.light.secondaryText,
    fontWeight: '500',
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
  removeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.light.error,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.error,
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
