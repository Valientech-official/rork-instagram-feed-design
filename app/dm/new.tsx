import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, X, UserPlus, MessageCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import {
  searchAccounts,
  toggleFollow,
  SearchAccountResult,
} from '@/services/accountService';
import { createConversation, getConversations } from '@/services/chatService';

interface RecentConversation {
  userId: string;
  username: string;
  avatar: string;
  conversationId: string;
}

export default function NewMessageScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchAccountResult[]>([]);
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  // Load recent conversations on mount
  useEffect(() => {
    loadRecentConversations();
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadRecentConversations = async () => {
    try {
      setIsLoadingRecent(true);
      setError(null);
      const conversations = await getConversations();

      // Transform conversations to recent format
      const recent: RecentConversation[] = conversations.slice(0, 5).map((conv) => ({
        userId: conv.participant_ids[0] || '',
        username: conv.participant_usernames?.[0] || 'Unknown',
        avatar: conv.participant_avatars?.[0] || 'https://via.placeholder.com/150',
        conversationId: conv.conversation_id,
      }));

      setRecentConversations(recent);
    } catch (err) {
      console.error('Failed to load recent conversations:', err);
      setError('Failed to load recent conversations');
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      const response = await searchAccounts({
        query: query.trim(),
        limit: 20,
        offset: 0,
      });

      setSearchResults(response.accounts);

      // Track following status
      const following = new Set<string>();
      response.accounts.forEach((account) => {
        if (account.is_following) {
          following.add(account.account_id);
        }
      });
      setFollowingUsers(following);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to search users');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = async (user: SearchAccountResult) => {
    try {
      // Show loading state
      setIsSearching(true);
      setError(null);

      // Create or get existing conversation
      const response = await createConversation({
        participant_id: user.account_id,
      });

      // Navigate to conversation
      router.push(`/dm/${response.conversation.conversation_id}`);
    } catch (err) {
      console.error('Failed to create conversation:', err);
      setError('Failed to start conversation');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectRecent = (recent: RecentConversation) => {
    router.push(`/dm/${recent.conversationId}`);
  };

  const handleToggleFollow = async (userId: string, event: any) => {
    // Prevent triggering user selection
    event.stopPropagation();

    try {
      const result = await toggleFollow(userId);

      // Update following state
      setFollowingUsers((prev) => {
        const newSet = new Set(prev);
        if (result.is_following) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });

      // Update search results
      setSearchResults((prev) =>
        prev.map((user) =>
          user.account_id === userId
            ? { ...user, is_following: result.is_following }
            : user
        )
      );
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const renderUserItem = useCallback(
    ({ item }: { item: SearchAccountResult }) => {
      const isFollowing = followingUsers.has(item.account_id);

      return (
        <TouchableOpacity
          style={styles.userItem}
          onPress={() => handleSelectUser(item)}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: item.avatar_url || 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />

          <View style={styles.userInfo}>
            <View style={styles.userHeader}>
              <Text style={styles.username} numberOfLines={1}>
                {item.username}
              </Text>
              {item.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓</Text>
                </View>
              )}
            </View>

            {item.display_name && (
              <Text style={styles.displayName} numberOfLines={1}>
                {item.display_name}
              </Text>
            )}

            {item.bio && (
              <Text style={styles.bio} numberOfLines={1}>
                {item.bio}
              </Text>
            )}

            {item.follower_count !== undefined && (
              <Text style={styles.followerCount}>
                {item.follower_count.toLocaleString()} followers
              </Text>
            )}
          </View>

          {!isFollowing && (
            <TouchableOpacity
              style={styles.followButton}
              onPress={(e) => handleToggleFollow(item.account_id, e)}
              activeOpacity={0.7}
            >
              <UserPlus size={16} color={Colors.light.background} />
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      );
    },
    [followingUsers]
  );

  const renderRecentItem = useCallback(
    ({ item }: { item: RecentConversation }) => (
      <TouchableOpacity
        style={styles.recentItem}
        onPress={() => handleSelectRecent(item)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.avatar }} style={styles.recentAvatar} />
        <View style={styles.recentInfo}>
          <Text style={styles.recentUsername} numberOfLines={1}>
            {item.username}
          </Text>
          <MessageCircle size={14} color={Colors.light.secondaryText} />
        </View>
      </TouchableOpacity>
    ),
    []
  );

  const showResults = searchQuery.trim().length > 0;
  const showEmpty = showResults && !isSearching && searchResults.length === 0;
  const showRecent = !showResults && recentConversations.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>

          <Text style={styles.title}>New Message</Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color={Colors.light.secondaryText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor={Colors.light.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <X size={18} color={Colors.light.secondaryText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Recent Conversations */}
        {showRecent && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent</Text>
            {isLoadingRecent ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
              </View>
            ) : (
              <FlatList
                data={recentConversations}
                renderItem={renderRecentItem}
                keyExtractor={(item) => item.conversationId}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentList}
              />
            )}
          </View>
        )}

        {/* Search Results / Loading */}
        {showResults && (
          <>
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : showEmpty ? (
              <View style={styles.emptyContainer}>
                <Search size={48} color={Colors.light.secondaryText} />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptyText}>
                  Try searching for a different username
                </Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.account_id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </>
        )}

        {/* Initial State */}
        {!showResults && !showRecent && !isLoadingRecent && (
          <View style={styles.emptyContainer}>
            <MessageCircle size={48} color={Colors.light.secondaryText} />
            <Text style={styles.emptyTitle}>Start a conversation</Text>
            <Text style={styles.emptyText}>
              Search for users to send them a message
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.separator,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.light.text,
  },
  clearButton: {
    padding: 4,
  },
  errorContainer: {
    backgroundColor: Colors.light.error + '20',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 14,
    textAlign: 'center',
  },
  recentSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  recentList: {
    paddingHorizontal: 12,
  },
  recentItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 80,
  },
  recentAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 6,
  },
  recentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recentUsername: {
    fontSize: 12,
    color: Colors.light.text,
    maxWidth: 60,
  },
  listContainer: {
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginRight: 6,
  },
  verifiedBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: Colors.light.background,
    fontSize: 10,
    fontWeight: 'bold',
  },
  displayName: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    marginBottom: 2,
  },
  bio: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    marginBottom: 2,
  },
  followerCount: {
    fontSize: 12,
    color: Colors.light.secondaryText,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  followButtonText: {
    color: Colors.light.background,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
  },
});
