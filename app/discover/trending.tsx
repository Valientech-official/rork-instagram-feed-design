import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

type TimeframeType = 'day' | 'week' | 'month';

type TrendDirection = 'up' | 'stable' | 'down';

interface RecentPost {
  post_id: string;
  image_url: string;
}

interface TrendingHashtag {
  tag: string;
  post_count: number;
  growth_rate: number;
  rank: number;
  trend_direction: TrendDirection;
  recent_posts: RecentPost[];
}

interface TrendingResponse {
  hashtags: TrendingHashtag[];
  updated_at: string;
}

const TIMEFRAME_LABELS = {
  day: 'Today',
  week: 'This Week',
  month: 'This Month',
};

export default function TrendingHashtagsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [timeframe, setTimeframe] = useState<TimeframeType>('day');
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string>('');

  // Fetch trending hashtags
  const fetchTrendingHashtags = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        `${awsConfig.apiUrl}hashtag/trending?timeframe=${timeframe}&limit=50`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch trending hashtags');
      }

      const data: TrendingResponse = await response.json();

      setHashtags(data.hashtags);
      setUpdatedAt(data.updated_at);
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
      // Fallback to mock data for development
      setHashtags(getMockHashtags());
      setUpdatedAt(new Date().toISOString());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeframe]);

  // Initial load
  useEffect(() => {
    fetchTrendingHashtags();
  }, [fetchTrendingHashtags]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    fetchTrendingHashtags(true);
  }, [fetchTrendingHashtags]);

  // Handle hashtag press
  const handleHashtagPress = (tag: string) => {
    // Remove # if present
    const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;
    router.push(`/hashtag/${cleanTag}`);
  };

  // Get rank badge colors
  const getRankGradient = (rank: number): [string, string] => {
    if (rank === 1) return ['#FFD700', '#FFA500']; // Gold
    if (rank === 2) return ['#C0C0C0', '#A0A0A0']; // Silver
    if (rank === 3) return ['#CD7F32', '#B8860B']; // Bronze
    if (rank <= 10) return ['#FF6B6B', '#FF4757']; // Red
    if (rank <= 25) return ['#4ECDC4', '#44B7B1']; // Teal
    return ['#95A5A6', '#7F8C8D']; // Gray
  };

  // Get trend icon and color
  const getTrendIndicator = (direction: TrendDirection) => {
    switch (direction) {
      case 'up':
        return { Icon: TrendingUp, color: '#4BB543', label: 'Rising' };
      case 'down':
        return { Icon: TrendingDown, color: '#FF3B30', label: 'Falling' };
      default:
        return { Icon: Minus, color: '#8E8E8E', label: 'Stable' };
    }
  };

  // Format number
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Render hashtag item
  const renderHashtagItem = ({ item, index }: { item: TrendingHashtag; index: number }) => {
    const gradient = getRankGradient(item.rank);
    const trendIndicator = getTrendIndicator(item.trend_direction);
    const scaleAnim = new Animated.Value(1);

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={styles.hashtagCard}
          onPress={() => handleHashtagPress(item.tag)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          {/* Rank Badge */}
          <LinearGradient
            colors={gradient}
            style={styles.rankBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.rankText}>#{item.rank}</Text>
          </LinearGradient>

          {/* Hashtag Info */}
          <View style={styles.hashtagInfo}>
            <View style={styles.hashtagHeader}>
              <Text style={styles.hashtagName}>#{item.tag}</Text>
              <View style={styles.trendBadge}>
                <trendIndicator.Icon size={12} color={trendIndicator.color} />
              </View>
            </View>

            <View style={styles.statsRow}>
              <Text style={styles.postCount}>
                {formatNumber(item.post_count)} posts
              </Text>
              {item.growth_rate > 0 && (
                <Text style={[styles.growthRate, { color: trendIndicator.color }]}>
                  {item.growth_rate > 0 ? '+' : ''}{item.growth_rate.toFixed(1)}%
                </Text>
              )}
            </View>
          </View>

          {/* Preview Images */}
          <View style={styles.previewImages}>
            {item.recent_posts.slice(0, 4).map((post, idx) => (
              <View
                key={post.post_id}
                style={[
                  styles.previewImageContainer,
                  idx === 3 && styles.lastPreviewImage,
                ]}
              >
                <Image
                  source={{ uri: post.image_url }}
                  style={styles.previewImage}
                  contentFit="cover"
                  transition={200}
                />
                {idx === 3 && item.recent_posts.length > 4 && (
                  <View style={styles.moreOverlay}>
                    <Text style={styles.moreText}>+{item.recent_posts.length - 4}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render timeframe filter
  const renderTimeframeFilter = () => (
    <View style={styles.filterContainer}>
      {(['day', 'week', 'month'] as TimeframeType[]).map((tf) => (
        <TouchableOpacity
          key={tf}
          style={[
            styles.filterButton,
            timeframe === tf && styles.filterButtonActive,
          ]}
          onPress={() => setTimeframe(tf)}
        >
          <Text
            style={[
              styles.filterButtonText,
              timeframe === tf && styles.filterButtonTextActive,
            ]}
          >
            {TIMEFRAME_LABELS[tf]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trending Hashtags</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading trending hashtags...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trending Hashtags</Text>
        <View style={styles.backButton} />
      </View>

      {/* Timeframe Filter */}
      {renderTimeframeFilter()}

      {/* Updated At */}
      {updatedAt && (
        <View style={styles.updatedContainer}>
          <Text style={styles.updatedText}>
            Updated {new Date(updatedAt).toLocaleString()}
          </Text>
        </View>
      )}

      {/* Hashtags List */}
      <FlatList
        data={hashtags}
        keyExtractor={(item) => item.tag}
        renderItem={renderHashtagItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No trending hashtags found</Text>
            <Text style={styles.emptyStateSubtext}>Pull to refresh</Text>
          </View>
        }
      />
    </View>
  );
}

// Mock data for development/fallback
function getMockHashtags(): TrendingHashtag[] {
  const mockTags = [
    'fashion', 'ootd', 'style', 'streetwear', 'vintage',
    'minimalist', 'casual', 'formal', 'summer', 'winter',
    'shoes', 'accessories', 'handbags', 'jewelry', 'watches',
    'mensfashion', 'womensfashion', 'unisex', 'sustainable', 'luxury',
  ];

  return mockTags.map((tag, index) => ({
    tag,
    post_count: Math.floor(Math.random() * 100000) + 1000,
    growth_rate: (Math.random() * 200) - 50, // -50% to +150%
    rank: index + 1,
    trend_direction: ['up', 'stable', 'down'][Math.floor(Math.random() * 3)] as TrendDirection,
    recent_posts: Array.from({ length: 6 }, (_, i) => ({
      post_id: `post_${index}_${i}`,
      image_url: `https://picsum.photos/200/200?random=${index * 10 + i}`,
    })),
  }));
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.light.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  updatedContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.light.primaryLight,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  updatedText: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 16,
  },
  hashtagCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hashtagInfo: {
    flex: 1,
    marginRight: 12,
  },
  hashtagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  hashtagName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginRight: 8,
  },
  trendBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postCount: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.secondaryText,
  },
  growthRate: {
    fontSize: 13,
    fontWeight: '600',
  },
  previewImages: {
    flexDirection: 'row',
    gap: 4,
  },
  previewImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  lastPreviewImage: {
    // Special styling for last image if needed
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  moreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
});
