/**
 * Example Integration File
 *
 * This file demonstrates how to integrate all 4 UI improvement components
 * into a real-world screen. Copy patterns from here into your actual screens.
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';

// Import the new components
import ErrorBoundary from '@/components/ErrorBoundary';
import EmptyState from '@/components/EmptyState';
import { FeedSkeleton, PostSkeleton } from '@/components/LoadingSkeleton';

// Import existing components
import Post from '@/components/Post';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

/**
 * Example 1: Complete Feed Screen with All Features
 *
 * This example shows:
 * - Network error detection → navigate to /offline
 * - Loading state with skeleton
 * - Empty state when no posts
 * - Error boundary for component errors
 * - Pull-to-refresh functionality
 */
export function ExampleFeedScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const colors = Colors[theme];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState<Error | null>(null);

  // Network listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        router.push('/offline');
      }
    });

    return () => unsubscribe();
  }, []);

  // Load posts on mount
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('https://api.example.com/posts');

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError(err as Error);

      // Check for network errors
      if ((err as Error).message.includes('network') ||
          (err as Error).message.includes('Failed to fetch')) {
        router.push('/offline');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const handleCreatePost = () => {
    router.push('/(tabs)/create');
  };

  // Show loading skeleton on initial load
  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <FeedSkeleton count={5} />
      </View>
    );
  }

  // Show empty state when no posts
  if (!loading && posts.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState
          type="no-posts"
          actionButton={{
            label: "Create Your First Post",
            onPress: handleCreatePost
          }}
        />
      </View>
    );
  }

  // Wrap content in ErrorBoundary to catch component errors
  return (
    <ErrorBoundary>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {posts.map((post) => (
          <Post key={post.id} post={post} />
        ))}

        {/* Show skeleton at bottom when refreshing */}
        {refreshing && <PostSkeleton />}
      </ScrollView>
    </ErrorBoundary>
  );
}

/**
 * Example 2: Search Screen with Dynamic Empty States
 *
 * This example shows:
 * - Different empty states based on search state
 * - Loading skeleton during search
 * - No results state with custom message
 */
export function ExampleSearchScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const colors = Colors[theme];

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);

      const response = await fetch(
        `https://api.example.com/search?q=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
      if ((err as Error).message.includes('network')) {
        router.push('/offline');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading skeleton during search
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <FeedSkeleton count={3} />
      </View>
    );
  }

  // Show "no results" if searched but nothing found
  if (hasSearched && results.length === 0) {
    return (
      <EmptyState
        type="no-results"
        message={`No results for "${query}"`}
        actionButton={{
          label: "Browse Trending",
          onPress: () => router.push('/discover/trending')
        }}
      />
    );
  }

  // Show "start searching" if haven't searched yet
  if (!hasSearched) {
    return (
      <EmptyState
        type="no-results"
        title="Start searching"
        message="Find styles, people, and trending posts"
      />
    );
  }

  // Show results
  return (
    <ErrorBoundary>
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        {results.map((post) => (
          <Post key={post.id} post={post} />
        ))}
      </ScrollView>
    </ErrorBoundary>
  );
}

/**
 * Example 3: Profile Screen with Multiple Loading States
 *
 * This example shows:
 * - Profile skeleton for header
 * - Grid skeleton for posts
 * - Empty state for no posts
 */
export function ExampleProfileScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const colors = Colors[theme];

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    loadProfile();
    loadPosts();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetch('https://api.example.com/profile');
      const data = await response.json();
      setProfile(data);
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadPosts = async () => {
    try {
      const response = await fetch('https://api.example.com/profile/posts');
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      console.error('Posts load error:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  return (
    <ErrorBoundary>
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Profile Header Skeleton */}
        {loadingProfile ? (
          <ProfileSkeleton />
        ) : (
          <ProfileHeader profile={profile} />
        )}

        {/* Posts Grid */}
        {loadingPosts ? (
          <GridSkeleton count={9} />
        ) : posts.length === 0 ? (
          <EmptyState
            type="no-posts"
            actionButton={{
              label: "Create Post",
              onPress: () => router.push('/(tabs)/create')
            }}
          />
        ) : (
          <PostsGrid posts={posts} />
        )}
      </ScrollView>
    </ErrorBoundary>
  );
}

/**
 * Example 4: Messages Screen with Error Boundary Per Section
 *
 * This example shows:
 * - Granular error boundaries (one per section)
 * - Empty state for no messages
 * - User list skeleton
 */
export function ExampleMessagesScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const colors = Colors[theme];

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch('https://api.example.com/messages');
      const data = await response.json();
      setConversations(data);
    } catch (err) {
      console.error('Messages load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <UserListSkeleton key={i} />
        ))}
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        type="no-messages"
        actionButton={{
          label: "Find People",
          onPress: () => router.push('/(tabs)/search')
        }}
      />
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      {conversations.map((conversation) => (
        <ErrorBoundary key={conversation.id}>
          <ConversationItem conversation={conversation} />
        </ErrorBoundary>
      ))}
    </ScrollView>
  );
}

/**
 * Example 5: Global Network Listener in App Layout
 *
 * Add this to your app/_layout.tsx to automatically detect offline state
 */
export function useNetworkListener() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        router.push('/offline');
      }
    });

    return () => unsubscribe();
  }, []);
}

/**
 * Example 6: API Fetch with Automatic Error Handling
 *
 * Reusable fetch wrapper that handles network errors
 */
export async function fetchWithErrorHandling(
  url: string,
  options?: RequestInit,
  router?: any
) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Resource not found');
      }
      if (response.status >= 500) {
        throw new Error('Server error');
      }
      throw new Error('Request failed');
    }

    return await response.json();
  } catch (error) {
    const err = error as Error;

    // Check for network errors
    if (
      err.message.includes('network') ||
      err.message.includes('Failed to fetch') ||
      err.name === 'TypeError'
    ) {
      if (router) {
        router.push('/offline');
      }
      throw new Error('Network error');
    }

    throw err;
  }
}

/**
 * Example 7: Usage with React Query / SWR
 *
 * If you're using a data fetching library
 */
export function ExampleWithReactQuery() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const colors = Colors[theme];

  // Example with useQuery (pseudo-code)
  const { data: posts, isLoading, isError, error } = useQuery(
    'posts',
    fetchPosts,
    {
      onError: (err: Error) => {
        if (err.message.includes('network')) {
          router.push('/offline');
        }
      }
    }
  );

  if (isLoading) {
    return <FeedSkeleton count={5} />;
  }

  if (isError) {
    // Let ErrorBoundary handle it or show error screen
    router.push('/error');
    return null;
  }

  if (!posts || posts.length === 0) {
    return (
      <EmptyState
        type="no-posts"
        actionButton={{
          label: "Create Post",
          onPress: () => router.push('/(tabs)/create')
        }}
      />
    );
  }

  return (
    <ErrorBoundary>
      <ScrollView>
        {posts.map(post => (
          <Post key={post.id} post={post} />
        ))}
      </ScrollView>
    </ErrorBoundary>
  );
}

// Placeholder components (replace with your actual components)
function ProfileHeader({ profile }: any) {
  return <View />;
}

function PostsGrid({ posts }: any) {
  return <View />;
}

function ConversationItem({ conversation }: any) {
  return <View />;
}

function ProfileSkeleton() {
  return <View />;
}

function UserListSkeleton() {
  return <View />;
}

function GridSkeleton({ count }: { count: number }) {
  return <View />;
}

async function fetchPosts() {
  return [];
}

interface Post {
  id: string;
  // ... other fields
}

// Re-export for use
export { fetchWithErrorHandling, useNetworkListener };
