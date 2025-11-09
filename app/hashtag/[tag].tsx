import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import {
  getHashtagInfo,
  getHashtagPosts,
  followHashtag,
  type Post,
  type HashtagInfo,
} from '@/services/hashtagService';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 6) / 3; // 3 columns with 2px gaps

type SortType = 'top' | 'recent';

export default function HashtagPostsScreen() {
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State
  const [hashtagInfo, setHashtagInfo] = useState<HashtagInfo | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortType, setSortType] = useState<SortType>('top');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Load hashtag info and initial posts
  useEffect(() => {
    if (tag) {
      loadHashtagData();
    }
  }, [tag, sortType]);

  const loadHashtagData = async () => {
    try {
      setLoading(true);
      const [info, postsData] = await Promise.all([
        getHashtagInfo(tag),
        getHashtagPosts({ tag, sort: sortType, limit: 30, offset: 0 }),
      ]);

      setHashtagInfo(info);
      setIsFollowing(info.is_following);
      setPosts(postsData.posts);
      setHasMore(postsData.has_more);
    } catch (error) {
      console.error('Failed to load hashtag data:', error);
      Alert.alert('Error', 'Failed to load hashtag. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const [info, postsData] = await Promise.all([
        getHashtagInfo(tag),
        getHashtagPosts({ tag, sort: sortType, limit: 30, offset: 0 }),
      ]);

      setHashtagInfo(info);
      setIsFollowing(info.is_following);
      setPosts(postsData.posts);
      setHasMore(postsData.has_more);
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const postsData = await getHashtagPosts({
        tag,
        sort: sortType,
        limit: 30,
        offset: posts.length,
      });

      setPosts((prevPosts) => [...prevPosts, ...postsData.posts]);
      setHasMore(postsData.has_more);
    } catch (error) {
      console.error('Failed to load more:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFollowPress = async () => {
    try {
      setFollowLoading(true);

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const result = await followHashtag(tag);
      setIsFollowing(result.is_following);

      // Update post count optimistically
      if (hashtagInfo) {
        setHashtagInfo({
          ...hashtagInfo,
          is_following: result.is_following,
        });
      }
    } catch (error) {
      console.error('Failed to follow hashtag:', error);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSortChange = (newSort: SortType) => {
    if (newSort !== sortType) {
      setSortType(newSort);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handlePostPress = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleBack = () => {
    router.back();
  };

  const renderGridItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => handlePostPress(item.post_id)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.media_urls[0] }}
        style={styles.gridImage}
        contentFit="cover"
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        transition={200}
      />
      {item.media_urls.length > 1 && (
        <View style={styles.multipleIndicator}>
          <View style={styles.multipleIcon} />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.infoSection}>
        <Text style={styles.hashtagName}>#{tag}</Text>
        <Text style={styles.postCount}>
          {hashtagInfo?.post_count?.toLocaleString() || 0} posts
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.followButton, isFollowing && styles.followingButton]}
        onPress={handleFollowPress}
        disabled={followLoading}
      >
        {followLoading ? (
          <ActivityIndicator size="small" color={isFollowing ? Colors.light.text : '#fff'} />
        ) : (
          <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sortButton, sortType === 'top' && styles.sortButtonActive]}
          onPress={() => handleSortChange('top')}
        >
          <Text style={[styles.sortButtonText, sortType === 'top' && styles.sortButtonTextActive]}>
            Top
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortType === 'recent' && styles.sortButtonActive]}
          onPress={() => handleSortChange('recent')}
        >
          <Text
            style={[styles.sortButtonText, sortType === 'recent' && styles.sortButtonTextActive]}
          >
            Recent
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No posts yet</Text>
      <Text style={styles.emptyStateText}>
        There are no posts with #{tag} yet.{'\n'}Be the first to use this hashtag!
      </Text>
    </View>
  );

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
          headerTitle: '',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: Colors.light.background,
          },
        }}
      />

      <View style={[styles.container, { paddingTop: 0 }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        ) : (
          <FlatList
            data={posts}
            renderItem={renderGridItem}
            keyExtractor={(item) => item.post_id}
            numColumns={3}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderFooter}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.light.primary}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    paddingBottom: 20,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.separator,
  },
  infoSection: {
    marginBottom: 16,
  },
  hashtagName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  postCount: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },
  followButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 40,
  },
  followingButton: {
    backgroundColor: Colors.light.separator,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: Colors.light.text,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortButtonActive: {
    backgroundColor: Colors.light.text,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  sortButtonTextActive: {
    color: Colors.light.background,
  },
  gridRow: {
    gap: 2,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.light.separator,
  },
  multipleIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  multipleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 2,
    borderColor: '#fff',
  },
  emptyState: {
    paddingVertical: 60,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
