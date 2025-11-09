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
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Search,
  X,
  SlidersHorizontal,
  MapPin,
  Users,
  Check,
  Clock,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';

const SEARCH_HISTORY_KEY = '@user_search_history';
const MAX_HISTORY_ITEMS = 10;
const DEBOUNCE_DELAY = 500;

type AccountType = 'all' | 'user' | 'shop' | 'verified';
type FollowerRange = 'all' | '0-100' | '100-1K' | '1K-10K' | '10K+';
type SortType = 'relevance' | 'followers' | 'recent';

interface UserResult {
  id: string;
  username: string;
  display_name: string;
  avatar: string;
  bio?: string;
  follower_count: number;
  account_type: 'user' | 'shop';
  verified: boolean;
  location?: string;
}

interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export default function UserSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const initialQuery = typeof params.q === 'string' ? params.q : '';

  const [searchText, setSearchText] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Filter states
  const [accountType, setAccountType] = useState<AccountType>('all');
  const [location, setLocation] = useState('');
  const [followerRange, setFollowerRange] = useState<FollowerRange>('all');
  const [sortBy, setSortBy] = useState<SortType>('relevance');

  useEffect(() => {
    loadSearchHistory();
    if (initialQuery) {
      searchUsers(initialQuery, 0, true);
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

  const searchUsers = useCallback(
    async (query: string, currentOffset: number = 0, isNewSearch: boolean = false) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        // Calculate follower range values
        let followerMin: number | undefined;
        let followerMax: number | undefined;

        switch (followerRange) {
          case '0-100':
            followerMin = 0;
            followerMax = 100;
            break;
          case '100-1K':
            followerMin = 100;
            followerMax = 1000;
            break;
          case '1K-10K':
            followerMin = 1000;
            followerMax = 10000;
            break;
          case '10K+':
            followerMin = 10000;
            break;
        }

        // TODO: Replace with actual API call
        // const response = await fetch(`${API_URL}/search/users`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     query,
        //     account_type: accountType !== 'all' ? accountType : undefined,
        //     location: location || undefined,
        //     follower_min: followerMin,
        //     follower_max: followerMax,
        //     sort: sortBy,
        //     limit: 20,
        //     offset: currentOffset,
        //   }),
        // });
        // const data = await response.json();

        // Mock data
        const mockUsers: UserResult[] = [
          {
            id: '1',
            username: 'fashionista_tokyo',
            display_name: 'Tokyo Fashion',
            avatar: 'https://picsum.photos/200/200?random=1',
            bio: 'Fashion enthusiast from Tokyo. Street style & minimalism lover.',
            follower_count: 15420,
            account_type: 'user',
            verified: true,
            location: 'Tokyo, Japan',
          },
          {
            id: '2',
            username: 'vintage_shop',
            display_name: 'Vintage Shop Tokyo',
            avatar: 'https://picsum.photos/200/200?random=2',
            bio: 'Curated vintage clothing from the 80s & 90s. DM for inquiries.',
            follower_count: 8932,
            account_type: 'shop',
            verified: true,
            location: 'Shibuya, Tokyo',
          },
          {
            id: '3',
            username: 'streetwear_king',
            display_name: 'Streetwear King',
            avatar: 'https://picsum.photos/200/200?random=3',
            bio: 'Daily streetwear inspo. Sneakerhead.',
            follower_count: 23145,
            account_type: 'user',
            verified: false,
            location: 'Osaka, Japan',
          },
          {
            id: '4',
            username: 'minimalist_closet',
            display_name: 'Minimalist Closet',
            avatar: 'https://picsum.photos/200/200?random=4',
            bio: 'Less is more. Capsule wardrobe advocate.',
            follower_count: 6781,
            account_type: 'user',
            verified: false,
            location: 'Kyoto, Japan',
          },
          {
            id: '5',
            username: 'boutique_harajuku',
            display_name: 'Harajuku Boutique',
            avatar: 'https://picsum.photos/200/200?random=5',
            bio: 'Trendy clothes & accessories. Visit us in Harajuku!',
            follower_count: 12567,
            account_type: 'shop',
            verified: true,
            location: 'Harajuku, Tokyo',
          },
        ];

        // Apply filters
        let filteredUsers = mockUsers;

        if (accountType !== 'all') {
          if (accountType === 'verified') {
            filteredUsers = filteredUsers.filter((u) => u.verified);
          } else {
            filteredUsers = filteredUsers.filter((u) => u.account_type === accountType);
          }
        }

        if (location) {
          filteredUsers = filteredUsers.filter(
            (u) => u.location?.toLowerCase().includes(location.toLowerCase())
          );
        }

        if (followerMin !== undefined || followerMax !== undefined) {
          filteredUsers = filteredUsers.filter((u) => {
            if (followerMin !== undefined && u.follower_count < followerMin) return false;
            if (followerMax !== undefined && u.follower_count > followerMax) return false;
            return true;
          });
        }

        // Apply sorting
        switch (sortBy) {
          case 'followers':
            filteredUsers.sort((a, b) => b.follower_count - a.follower_count);
            break;
          case 'recent':
            // In real implementation, sort by recent activity
            break;
          case 'relevance':
          default:
            // Already sorted by relevance from API
            break;
        }

        if (isNewSearch) {
          setSearchResults(filteredUsers);
          setOffset(20);
        } else {
          setSearchResults((prev) => [...prev, ...filteredUsers]);
          setOffset((prev) => prev + 20);
        }

        setHasMore(filteredUsers.length === 20);

        if (isNewSearch) {
          saveSearchHistory(query);
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accountType, location, followerRange, sortBy]
  );

  const handleSearchChange = (text: string) => {
    setSearchText(text);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      searchUsers(text, 0, true);
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
    searchUsers(searchText, 0, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore && searchText) {
      searchUsers(searchText, offset, false);
    }
  };

  const handleUserPress = (userId: string) => {
    router.push('/(tabs)/profile');
  };

  const handleFollowPress = (userId: string) => {
    console.log('Follow user:', userId);
  };

  const handleHistoryPress = (query: string) => {
    setSearchText(query);
    searchUsers(query, 0, true);
  };

  const formatFollowerCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const renderUserItem = ({ item }: { item: UserResult }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => handleUserPress(item.id)}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} contentFit="cover" />
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.username}>{item.username}</Text>
          {item.verified && (
            <View style={styles.verifiedBadge}>
              <Check size={12} color="white" />
            </View>
          )}
          {item.account_type === 'shop' && (
            <View style={styles.shopBadge}>
              <Text style={styles.shopBadgeText}>SHOP</Text>
            </View>
          )}
        </View>
        <Text style={styles.displayName}>{item.display_name}</Text>
        {item.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {item.bio}
          </Text>
        )}
        <View style={styles.userStats}>
          <Users size={14} color={Colors.light.secondaryText} />
          <Text style={styles.followerCount}>
            {formatFollowerCount(item.follower_count)} followers
          </Text>
          {item.location && (
            <>
              <MapPin size={14} color={Colors.light.secondaryText} style={styles.locationIcon} />
              <Text style={styles.location}>{item.location}</Text>
            </>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.followButton}
        onPress={() => handleFollowPress(item.id)}
      >
        <Text style={styles.followButtonText}>Follow</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: SearchHistoryItem }) => (
    <TouchableOpacity style={styles.historyItem} onPress={() => handleHistoryPress(item.query)}>
      <Clock size={18} color={Colors.light.secondaryText} />
      <Text style={styles.historyText}>{item.query}</Text>
    </TouchableOpacity>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Account Type */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Account Type</Text>
          <View style={styles.filterOptions}>
            {(['all', 'user', 'shop', 'verified'] as AccountType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.filterChip, accountType === type && styles.filterChipActive]}
                onPress={() => setAccountType(type)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    accountType === type && styles.filterChipTextActive,
                  ]}
                >
                  {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Location</Text>
          <View style={styles.locationInputContainer}>
            <MapPin size={18} color={Colors.light.secondaryText} />
            <TextInput
              style={styles.locationInput}
              placeholder="Enter city or location"
              placeholderTextColor={Colors.light.secondaryText}
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>

        {/* Follower Range */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Follower Count</Text>
          <View style={styles.filterOptions}>
            {(['all', '0-100', '100-1K', '1K-10K', '10K+'] as FollowerRange[]).map((range) => (
              <TouchableOpacity
                key={range}
                style={[styles.filterChip, followerRange === range && styles.filterChipActive]}
                onPress={() => setFollowerRange(range)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    followerRange === range && styles.filterChipTextActive,
                  ]}
                >
                  {range === 'all' ? 'All' : range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sort By */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Sort By</Text>
          <View style={styles.filterOptions}>
            {(['relevance', 'followers', 'recent'] as SortType[]).map((sort) => (
              <TouchableOpacity
                key={sort}
                style={[styles.filterChip, sortBy === sort && styles.filterChipActive]}
                onPress={() => setSortBy(sort)}
              >
                <Text
                  style={[styles.filterChipText, sortBy === sort && styles.filterChipTextActive]}
                >
                  {sort === 'followers' ? 'Most Followers' : sort.charAt(0).toUpperCase() + sort.slice(1)}
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
              searchUsers(searchText, 0, true);
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
        <Text style={styles.headerTitle}>Search Users</Text>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color={Colors.light.secondaryText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
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
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
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
              <Users size={48} color={Colors.light.border} />
              <Text style={styles.emptyStateText}>No users found</Text>
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
    maxHeight: 400,
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
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  locationInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
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
  userItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginRight: 6,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  shopBadge: {
    backgroundColor: Colors.light.shopAccent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shopBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  displayName: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 6,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followerCount: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    marginLeft: 4,
  },
  locationIcon: {
    marginLeft: 12,
  },
  location: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    marginLeft: 4,
  },
  followButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
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
