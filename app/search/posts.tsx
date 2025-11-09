import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Search,
  X,
  SlidersHorizontal,
  Grid3x3,
  List,
  Heart,
  MessageCircle,
  Calendar,
  ShoppingBag,
  Clock,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Colors from '@/constants/colors';

const SEARCH_HISTORY_KEY = '@post_search_history';
const MAX_HISTORY_ITEMS = 10;
const DEBOUNCE_DELAY = 500;
const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 48) / 3;

type PostType = 'all' | 'image' | 'video' | 'text';
type SortType = 'relevance' | 'recent' | 'most_liked' | 'most_commented';
type ViewMode = 'grid' | 'list';
type DateRangeType = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

interface PostResult {
  id: string;
  image_url?: string;
  caption: string;
  post_type: 'image' | 'video' | 'text';
  like_count: number;
  comment_count: number;
  created_at: string;
  has_products: boolean;
  room_id?: string;
  room_name?: string;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
}

interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export default function PostSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const initialQuery = typeof params.q === 'string' ? params.q : '';

  const [searchText, setSearchText] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<PostResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filter states
  const [dateRange, setDateRange] = useState<DateRangeType>('all');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [roomId, setRoomId] = useState('');
  const [postType, setPostType] = useState<PostType>('all');
  const [hasProducts, setHasProducts] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<SortType>('relevance');

  useEffect(() => {
    loadSearchHistory();
    if (initialQuery) {
      searchPosts(initialQuery, 0, true);
    }
  }, []);

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

  const saveSearchHistory = async (query: string) => {
    try {
      const updatedHistory = searchHistory.filter((item) => item.query !== query);
      const newHistory: SearchHistoryItem[] = [
        { query, timestamp: Date.now() },
        ...updatedHistory,
      ].slice(0, MAX_HISTORY_ITEMS);

      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      setSearchHistory(newHistory);
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const clearSearchHistory = async () => {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
      setSearchHistory([]);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  const showDatePicker = (type: 'from' | 'to') => {
    const currentDate = type === 'from' ? dateFrom || new Date() : dateTo || new Date();

    DateTimePickerAndroid.open({
      value: currentDate,
      onChange: (event, selectedDate) => {
        if (event.type === 'set' && selectedDate) {
          if (type === 'from') {
            setDateFrom(selectedDate);
          } else {
            setDateTo(selectedDate);
          }
        }
      },
      mode: 'date',
      is24Hour: true,
    });
  };

  const handleDateRangeChange = (range: DateRangeType) => {
    setDateRange(range);

    const now = new Date();
    switch (range) {
      case 'today':
        setDateFrom(new Date(now.setHours(0, 0, 0, 0)));
        setDateTo(new Date());
        break;
      case 'week':
        setDateFrom(new Date(now.setDate(now.getDate() - 7)));
        setDateTo(new Date());
        break;
      case 'month':
        setDateFrom(new Date(now.setMonth(now.getMonth() - 1)));
        setDateTo(new Date());
        break;
      case 'year':
        setDateFrom(new Date(now.setFullYear(now.getFullYear() - 1)));
        setDateTo(new Date());
        break;
      case 'all':
        setDateFrom(null);
        setDateTo(null);
        break;
      case 'custom':
        // User will pick dates manually
        break;
    }
  };

  const searchPosts = useCallback(
    async (query: string, currentOffset: number = 0, isNewSearch: boolean = false) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`${API_URL}/search/posts`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     query,
        //     date_from: dateFrom?.toISOString(),
        //     date_to: dateTo?.toISOString(),
        //     room_id: roomId || undefined,
        //     post_type: postType !== 'all' ? postType : undefined,
        //     has_products: hasProducts,
        //     sort: sortBy,
        //     limit: 20,
        //     offset: currentOffset,
        //   }),
        // });
        // const data = await response.json();

        // Mock data
        const mockPosts: PostResult[] = [
          {
            id: '1',
            image_url: 'https://picsum.photos/400/400?random=1',
            caption: 'Summer outfit inspiration 🌸',
            post_type: 'image',
            like_count: 1542,
            comment_count: 89,
            created_at: new Date().toISOString(),
            has_products: true,
            room_name: 'Full Body',
            user: {
              id: '1',
              username: 'fashionista_tokyo',
              avatar: 'https://picsum.photos/200/200?random=1',
            },
          },
          {
            id: '2',
            image_url: 'https://picsum.photos/400/400?random=2',
            caption: 'Vintage vibes',
            post_type: 'image',
            like_count: 892,
            comment_count: 45,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            has_products: false,
            room_name: 'Situation',
            user: {
              id: '2',
              username: 'vintage_shop',
              avatar: 'https://picsum.photos/200/200?random=2',
            },
          },
          {
            id: '3',
            image_url: 'https://picsum.photos/400/400?random=3',
            caption: 'Street style essentials',
            post_type: 'image',
            like_count: 2314,
            comment_count: 156,
            created_at: new Date(Date.now() - 172800000).toISOString(),
            has_products: true,
            room_name: 'Next Trend',
            user: {
              id: '3',
              username: 'streetwear_king',
              avatar: 'https://picsum.photos/200/200?random=3',
            },
          },
          {
            id: '4',
            image_url: 'https://picsum.photos/400/400?random=4',
            caption: 'Minimalist wardrobe',
            post_type: 'image',
            like_count: 678,
            comment_count: 34,
            created_at: new Date(Date.now() - 259200000).toISOString(),
            has_products: false,
            room_name: 'Q&A',
            user: {
              id: '4',
              username: 'minimalist_closet',
              avatar: 'https://picsum.photos/200/200?random=4',
            },
          },
          {
            id: '5',
            image_url: 'https://picsum.photos/400/400?random=5',
            caption: 'New collection drop!',
            post_type: 'image',
            like_count: 3421,
            comment_count: 234,
            created_at: new Date(Date.now() - 345600000).toISOString(),
            has_products: true,
            room_name: 'Pair Look',
            user: {
              id: '5',
              username: 'boutique_harajuku',
              avatar: 'https://picsum.photos/200/200?random=5',
            },
          },
          {
            id: '6',
            image_url: 'https://picsum.photos/400/400?random=6',
            caption: 'Daily outfit inspo',
            post_type: 'image',
            like_count: 1123,
            comment_count: 67,
            created_at: new Date(Date.now() - 432000000).toISOString(),
            has_products: true,
            room_name: 'Full Body',
            user: {
              id: '1',
              username: 'fashionista_tokyo',
              avatar: 'https://picsum.photos/200/200?random=1',
            },
          },
        ];

        // Apply filters
        let filteredPosts = mockPosts;

        if (postType !== 'all') {
          filteredPosts = filteredPosts.filter((p) => p.post_type === postType);
        }

        if (hasProducts !== null) {
          filteredPosts = filteredPosts.filter((p) => p.has_products === hasProducts);
        }

        if (dateFrom || dateTo) {
          filteredPosts = filteredPosts.filter((p) => {
            const postDate = new Date(p.created_at);
            if (dateFrom && postDate < dateFrom) return false;
            if (dateTo && postDate > dateTo) return false;
            return true;
          });
        }

        // Apply sorting
        switch (sortBy) {
          case 'recent':
            filteredPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            break;
          case 'most_liked':
            filteredPosts.sort((a, b) => b.like_count - a.like_count);
            break;
          case 'most_commented':
            filteredPosts.sort((a, b) => b.comment_count - a.comment_count);
            break;
          case 'relevance':
          default:
            // Already sorted by relevance from API
            break;
        }

        if (isNewSearch) {
          setSearchResults(filteredPosts);
          setOffset(20);
        } else {
          setSearchResults((prev) => [...prev, ...filteredPosts]);
          setOffset((prev) => prev + 20);
        }

        setHasMore(filteredPosts.length === 20);

        if (isNewSearch) {
          saveSearchHistory(query);
        }
      } catch (error) {
        console.error('Error searching posts:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dateFrom, dateTo, roomId, postType, hasProducts, sortBy]
  );

  const handleSearchChange = (text: string) => {
    setSearchText(text);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      searchPosts(text, 0, true);
    }, DEBOUNCE_DELAY);

    setDebounceTimer(timer);
  };

  const handleClearSearch = () => {
    setSearchText('');
    setSearchResults([]);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    searchPosts(searchText, 0, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore && searchText) {
      searchPosts(searchText, offset, false);
    }
  };

  const handlePostPress = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleHistoryPress = (query: string) => {
    setSearchText(query);
    searchPosts(query, 0, true);
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const renderGridItem = ({ item }: { item: PostResult }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => handlePostPress(item.id)}
    >
      <Image
        source={{ uri: item.image_url || 'https://via.placeholder.com/400' }}
        style={styles.gridImage}
        contentFit="cover"
      />
      {item.has_products && (
        <View style={styles.productBadge}>
          <ShoppingBag size={12} color="white" />
        </View>
      )}
      <View style={styles.gridOverlay}>
        <View style={styles.gridStats}>
          <Heart size={14} color="white" fill="white" />
          <Text style={styles.gridStatText}>{formatCount(item.like_count)}</Text>
          <MessageCircle size={14} color="white" fill="white" style={styles.gridStatIcon} />
          <Text style={styles.gridStatText}>{formatCount(item.comment_count)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderListItem = ({ item }: { item: PostResult }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handlePostPress(item.id)}
    >
      <View style={styles.listHeader}>
        <Image
          source={{ uri: item.user.avatar }}
          style={styles.listAvatar}
          contentFit="cover"
        />
        <View style={styles.listUserInfo}>
          <Text style={styles.listUsername}>{item.user.username}</Text>
          <Text style={styles.listDate}>{formatDate(item.created_at)}</Text>
        </View>
      </View>

      {item.image_url && (
        <Image
          source={{ uri: item.image_url }}
          style={styles.listImage}
          contentFit="cover"
        />
      )}

      <View style={styles.listContent}>
        <Text style={styles.listCaption} numberOfLines={2}>
          {item.caption}
        </Text>

        {item.room_name && (
          <View style={styles.roomBadge}>
            <Text style={styles.roomBadgeText}>{item.room_name}</Text>
          </View>
        )}

        <View style={styles.listStats}>
          <View style={styles.listStat}>
            <Heart size={16} color={Colors.light.secondaryText} />
            <Text style={styles.listStatText}>{formatCount(item.like_count)}</Text>
          </View>
          <View style={styles.listStat}>
            <MessageCircle size={16} color={Colors.light.secondaryText} />
            <Text style={styles.listStatText}>{formatCount(item.comment_count)}</Text>
          </View>
          {item.has_products && (
            <View style={styles.listStat}>
              <ShoppingBag size={16} color={Colors.light.shopAccent} />
              <Text style={[styles.listStatText, { color: Colors.light.shopAccent }]}>
                Products
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: SearchHistoryItem }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleHistoryPress(item.query)}
    >
      <Clock size={18} color={Colors.light.secondaryText} />
      <Text style={styles.historyText}>{item.query}</Text>
    </TouchableOpacity>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Date Range */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Date Range</Text>
          <View style={styles.filterOptions}>
            {(['all', 'today', 'week', 'month', 'year', 'custom'] as DateRangeType[]).map((range) => (
              <TouchableOpacity
                key={range}
                style={[styles.filterChip, dateRange === range && styles.filterChipActive]}
                onPress={() => handleDateRangeChange(range)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    dateRange === range && styles.filterChipTextActive,
                  ]}
                >
                  {range === 'all' ? 'All Time' : range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : range === 'year' ? 'This Year' : range.charAt(0).toUpperCase() + range.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {dateRange === 'custom' && (
            <View style={styles.customDateContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => showDatePicker('from')}
              >
                <Calendar size={16} color={Colors.light.text} />
                <Text style={styles.dateButtonText}>
                  {dateFrom ? dateFrom.toLocaleDateString() : 'From Date'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => showDatePicker('to')}
              >
                <Calendar size={16} color={Colors.light.text} />
                <Text style={styles.dateButtonText}>
                  {dateTo ? dateTo.toLocaleDateString() : 'To Date'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Post Type */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Post Type</Text>
          <View style={styles.filterOptions}>
            {(['all', 'image', 'video', 'text'] as PostType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.filterChip, postType === type && styles.filterChipActive]}
                onPress={() => setPostType(type)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    postType === type && styles.filterChipTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Product Tags */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Product Tags</Text>
          <View style={styles.filterOptions}>
            <TouchableOpacity
              style={[styles.filterChip, hasProducts === null && styles.filterChipActive]}
              onPress={() => setHasProducts(null)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  hasProducts === null && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, hasProducts === true && styles.filterChipActive]}
              onPress={() => setHasProducts(true)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  hasProducts === true && styles.filterChipTextActive,
                ]}
              >
                With Products
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, hasProducts === false && styles.filterChipActive]}
              onPress={() => setHasProducts(false)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  hasProducts === false && styles.filterChipTextActive,
                ]}
              >
                No Products
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sort By */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Sort By</Text>
          <View style={styles.filterOptions}>
            {(['relevance', 'recent', 'most_liked', 'most_commented'] as SortType[]).map((sort) => (
              <TouchableOpacity
                key={sort}
                style={[styles.filterChip, sortBy === sort && styles.filterChipActive]}
                onPress={() => setSortBy(sort)}
              >
                <Text
                  style={[styles.filterChipText, sortBy === sort && styles.filterChipTextActive]}
                >
                  {sort === 'most_liked' ? 'Most Liked' : sort === 'most_commented' ? 'Most Commented' : sort.charAt(0).toUpperCase() + sort.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Apply Button */}
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => {
            setShowFilters(false);
            if (searchText) {
              searchPosts(searchText, 0, true);
            }
          }}
        >
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Posts</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <List size={22} color={Colors.light.text} />
            ) : (
              <Grid3x3 size={22} color={Colors.light.text} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={22} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color={Colors.light.secondaryText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts..."
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

      {/* Filters Panel */}
      {showFilters && renderFilters()}

      {/* Content */}
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
        numColumns={viewMode === 'grid' ? 3 : 1}
        key={viewMode}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          !searchText && searchHistory.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={clearSearchHistory}>
                  <Text style={styles.clearHistoryText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={searchHistory}
                keyExtractor={(item) => `${item.query}-${item.timestamp}`}
                renderItem={renderHistoryItem}
                scrollEnabled={false}
              />
            </View>
          ) : null
        }
        ListEmptyComponent={
          searchText && !loading ? (
            <View style={styles.emptyState}>
              <Search size={48} color={Colors.light.border} />
              <Text style={styles.emptyStateText}>No posts found</Text>
              <Text style={styles.emptyStateSubtext}>Try adjusting your search or filters</Text>
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
    </View>
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
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewToggle: {
    padding: 4,
  },
  filterButton: {
    padding: 4,
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
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  filtersContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    maxHeight: 450,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 10,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  filterChipTextActive: {
    color: 'white',
  },
  customDateContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateButtonText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  applyButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  listContent: {
    paddingBottom: 16,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  gridRow: {
    paddingHorizontal: 16,
    gap: 4,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    marginBottom: 4,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
  },
  gridStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  gridStatIcon: {
    marginLeft: 12,
  },
  productBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.light.shopAccent,
    borderRadius: 12,
    padding: 6,
  },
  listItem: {
    backgroundColor: Colors.light.background,
    marginBottom: 16,
    borderBottomWidth: 8,
    borderBottomColor: Colors.light.cardBackground,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  listAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  listUserInfo: {
    flex: 1,
  },
  listUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  listDate: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    marginTop: 2,
  },
  listImage: {
    width: '100%',
    height: width,
  },
  listContent: {
    padding: 12,
  },
  listCaption: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 8,
  },
  roomBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  roomBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  listStats: {
    flexDirection: 'row',
    gap: 16,
  },
  listStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listStatText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.secondaryText,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 64,
    alignItems: 'center',
    paddingHorizontal: 16,
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
    textAlign: 'center',
  },
});
