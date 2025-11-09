import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, X, TrendingUp, Clock, Hash } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';

const SEARCH_HISTORY_KEY = '@hashtag_search_history';
const MAX_HISTORY_ITEMS = 10;
const DEBOUNCE_DELAY = 500;

interface HashtagItem {
  tag: string;
  post_count: number;
  recent_posts?: Array<{
    id: string;
    image_url: string;
  }>;
  growth_rate?: number;
}

interface SearchHistoryItem {
  tag: string;
  timestamp: number;
}

export default function HashtagSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<HashtagItem[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<HashtagItem[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Load search history and trending hashtags on mount
  useEffect(() => {
    loadSearchHistory();
    loadTrendingHashtags();
  }, []);

  // Load search history from AsyncStorage
  const loadSearchHistory = async () => {
    try {
      const historyJson = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (historyJson) {
        const history: SearchHistoryItem[] = JSON.parse(historyJson);
        setSearchHistory(history);
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  // Save search history to AsyncStorage
  const saveSearchHistory = async (tag: string) => {
    try {
      // Remove existing entry if it exists
      const updatedHistory = searchHistory.filter(item => item.tag !== tag);

      // Add new entry at the beginning
      const newHistory: SearchHistoryItem[] = [
        { tag, timestamp: Date.now() },
        ...updatedHistory,
      ].slice(0, MAX_HISTORY_ITEMS);

      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      setSearchHistory(newHistory);
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  // Clear all search history
  const clearSearchHistory = async () => {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
      setSearchHistory([]);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  // Load trending hashtags
  const loadTrendingHashtags = async () => {
    setTrendingLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${API_URL}/hashtag/trending`);
      // const data = await response.json();
      // setTrendingHashtags(data.hashtags);

      // Mock data for now
      const mockTrending: HashtagItem[] = [
        {
          tag: 'fashion',
          post_count: 15420,
          growth_rate: 25.5,
          recent_posts: [
            { id: '1', image_url: 'https://picsum.photos/200/200?random=1' },
            { id: '2', image_url: 'https://picsum.photos/200/200?random=2' },
            { id: '3', image_url: 'https://picsum.photos/200/200?random=3' },
          ],
        },
        {
          tag: 'streetwear',
          post_count: 8932,
          growth_rate: 18.3,
          recent_posts: [
            { id: '4', image_url: 'https://picsum.photos/200/200?random=4' },
            { id: '5', image_url: 'https://picsum.photos/200/200?random=5' },
            { id: '6', image_url: 'https://picsum.photos/200/200?random=6' },
          ],
        },
        {
          tag: 'ootd',
          post_count: 23145,
          growth_rate: 32.1,
          recent_posts: [
            { id: '7', image_url: 'https://picsum.photos/200/200?random=7' },
            { id: '8', image_url: 'https://picsum.photos/200/200?random=8' },
            { id: '9', image_url: 'https://picsum.photos/200/200?random=9' },
          ],
        },
        {
          tag: 'minimalist',
          post_count: 6781,
          growth_rate: 15.7,
          recent_posts: [
            { id: '10', image_url: 'https://picsum.photos/200/200?random=10' },
            { id: '11', image_url: 'https://picsum.photos/200/200?random=11' },
            { id: '12', image_url: 'https://picsum.photos/200/200?random=12' },
          ],
        },
      ];
      setTrendingHashtags(mockTrending);
    } catch (error) {
      console.error('Error loading trending hashtags:', error);
    } finally {
      setTrendingLoading(false);
    }
  };

  // Search hashtags with debounce
  const searchHashtags = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      // Remove # prefix if user typed it
      const cleanQuery = query.replace(/^#+/, '');

      // TODO: Replace with actual API call
      // const response = await fetch(`${API_URL}/hashtag/search?query=${cleanQuery}&limit=20`);
      // const data = await response.json();
      // setSearchResults(data.hashtags);

      // Mock search results
      const mockResults: HashtagItem[] = [
        {
          tag: `${cleanQuery}style`,
          post_count: 1234,
          recent_posts: [
            { id: '1', image_url: 'https://picsum.photos/200/200?random=13' },
            { id: '2', image_url: 'https://picsum.photos/200/200?random=14' },
            { id: '3', image_url: 'https://picsum.photos/200/200?random=15' },
          ],
        },
        {
          tag: `${cleanQuery}fashion`,
          post_count: 5678,
          recent_posts: [
            { id: '4', image_url: 'https://picsum.photos/200/200?random=16' },
            { id: '5', image_url: 'https://picsum.photos/200/200?random=17' },
            { id: '6', image_url: 'https://picsum.photos/200/200?random=18' },
          ],
        },
        {
          tag: cleanQuery,
          post_count: 9012,
          recent_posts: [
            { id: '7', image_url: 'https://picsum.photos/200/200?random=19' },
            { id: '8', image_url: 'https://picsum.photos/200/200?random=20' },
            { id: '9', image_url: 'https://picsum.photos/200/200?random=21' },
          ],
        },
      ];
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Error searching hashtags:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle search text change with debounce
  const handleSearchChange = (text: string) => {
    setSearchText(text);

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new debounce timer
    const timer = setTimeout(() => {
      searchHashtags(text);
    }, DEBOUNCE_DELAY);

    setDebounceTimer(timer);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchText('');
    setSearchResults([]);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  };

  // Navigate to hashtag posts
  const handleHashtagPress = (tag: string) => {
    saveSearchHistory(tag);
    router.push(`/hashtag/${tag}`);
  };

  // Navigate to hashtag from history
  const handleHistoryPress = (tag: string) => {
    handleHashtagPress(tag);
  };

  // Navigate back
  const handleBack = () => {
    router.back();
  };

  // Format post count
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Render hashtag item
  const renderHashtagItem = ({ item }: { item: HashtagItem }) => (
    <TouchableOpacity
      style={styles.hashtagItem}
      onPress={() => handleHashtagPress(item.tag)}
    >
      <View style={styles.hashtagInfo}>
        <View style={styles.hashtagHeader}>
          <Hash size={16} color={Colors.light.primary} />
          <Text style={styles.hashtagName}>#{item.tag}</Text>
        </View>
        <Text style={styles.postCount}>{formatCount(item.post_count)} posts</Text>
      </View>

      {item.recent_posts && item.recent_posts.length > 0 && (
        <View style={styles.previewImages}>
          {item.recent_posts.slice(0, 3).map((post, index) => (
            <Image
              key={post.id}
              source={{ uri: post.image_url }}
              style={[
                styles.previewImage,
                index > 0 && styles.previewImageOverlap,
              ]}
              contentFit="cover"
            />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  // Render search history item
  const renderHistoryItem = ({ item }: { item: SearchHistoryItem }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleHistoryPress(item.tag)}
    >
      <Clock size={18} color={Colors.light.secondaryText} />
      <Text style={styles.historyText}>#{item.tag}</Text>
    </TouchableOpacity>
  );

  // Render trending item (larger cards in 2 columns)
  const renderTrendingItem = ({ item }: { item: HashtagItem }) => (
    <TouchableOpacity
      style={styles.trendingItem}
      onPress={() => handleHashtagPress(item.tag)}
    >
      <View style={styles.trendingPreview}>
        {item.recent_posts && item.recent_posts.length > 0 && (
          <>
            <Image
              source={{ uri: item.recent_posts[0]?.image_url }}
              style={styles.trendingMainImage}
              contentFit="cover"
            />
            {item.recent_posts.length > 1 && (
              <View style={styles.trendingSubImages}>
                {item.recent_posts.slice(1, 3).map((post) => (
                  <Image
                    key={post.id}
                    source={{ uri: post.image_url }}
                    style={styles.trendingSubImage}
                    contentFit="cover"
                  />
                ))}
              </View>
            )}
          </>
        )}
        {item.growth_rate && (
          <View style={styles.trendingBadge}>
            <TrendingUp size={12} color="white" />
            <Text style={styles.trendingBadgeText}>+{item.growth_rate.toFixed(0)}%</Text>
          </View>
        )}
      </View>
      <View style={styles.trendingInfo}>
        <Text style={styles.trendingName}>#{item.tag}</Text>
        <Text style={styles.trendingCount}>{formatCount(item.post_count)} posts</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Hashtags</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color={Colors.light.secondaryText} style={styles.searchIcon} />
        <Text style={styles.hashPrefix}>#</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search hashtags..."
          placeholderTextColor={Colors.light.secondaryText}
          value={searchText}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
            <X size={18} color={Colors.light.secondaryText} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <FlatList
        data={searchText ? searchResults : []}
        keyExtractor={(item) => item.tag}
        renderItem={renderHashtagItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Search History */}
            {!searchText && searchHistory.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  <TouchableOpacity onPress={clearSearchHistory}>
                    <Text style={styles.clearHistoryText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={searchHistory}
                  keyExtractor={(item) => `${item.tag}-${item.timestamp}`}
                  renderItem={renderHistoryItem}
                  scrollEnabled={false}
                />
              </View>
            )}

            {/* Trending Hashtags */}
            {!searchText && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <TrendingUp size={20} color={Colors.light.primary} />
                    <Text style={styles.sectionTitle}>Trending</Text>
                  </View>
                </View>
                {trendingLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                  </View>
                ) : (
                  <FlatList
                    data={trendingHashtags}
                    keyExtractor={(item) => item.tag}
                    renderItem={renderTrendingItem}
                    numColumns={2}
                    columnWrapperStyle={styles.trendingRow}
                    scrollEnabled={false}
                  />
                )}
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          searchText && !loading ? (
            <View style={styles.emptyState}>
              <Hash size={48} color={Colors.light.border} />
              <Text style={styles.emptyStateText}>No hashtags found</Text>
              <Text style={styles.emptyStateSubtext}>Try searching for something else</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
          ) : null
        }
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  headerRight: {
    width: 36,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    margin: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  hashPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  clearHistoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.primary,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  historyText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  hashtagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    marginBottom: 12,
  },
  hashtagInfo: {
    flex: 1,
  },
  hashtagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  hashtagName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  postCount: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  previewImages: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  previewImageOverlap: {
    marginLeft: -16,
  },
  trendingRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  trendingItem: {
    width: '48%',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  trendingPreview: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  trendingMainImage: {
    width: '100%',
    height: '100%',
  },
  trendingSubImages: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  trendingSubImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.background,
  },
  trendingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendingBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  trendingInfo: {
    padding: 12,
  },
  trendingName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  trendingCount: {
    fontSize: 13,
    color: Colors.light.secondaryText,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    marginTop: 8,
  },
});
