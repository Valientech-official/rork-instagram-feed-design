# UI Improvement Components - Usage Guide

This document provides comprehensive usage instructions for the 4 UI improvement screens and reusable components.

---

## 1. Offline/No Connection Screen

### File Location
`/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/offline.tsx`

### Features
- Full-screen offline indicator with WiFi off icon
- Clear messaging: "No internet connection"
- Retry button with loading state
- Auto-retry every 5 seconds
- Connection status badge (Online/Offline)
- Auto-redirect when connection restored
- Back navigation button

### Usage

#### Navigation to Offline Screen
```tsx
import { useRouter } from 'expo-router';

const YourComponent = () => {
  const router = useRouter();

  const handleNetworkError = () => {
    router.push('/offline');
  };

  return (
    // Your component
  );
};
```

#### Global Network Listener (Recommended)
Create a network listener hook in your app layout:

```tsx
// In app/_layout.tsx or custom hook
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (!state.isConnected) {
      router.push('/offline');
    }
  });

  return () => unsubscribe();
}, []);
```

#### API Error Handling
```tsx
const fetchData = async () => {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
  } catch (error) {
    if (error.message.includes('network')) {
      router.push('/offline');
    }
  }
};
```

---

## 2. Empty State Component

### File Location
`/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/components/EmptyState.tsx`

### Available Types
- `no-posts` - No posts yet
- `no-followers` - No followers yet
- `no-following` - Not following anyone
- `no-messages` - No messages yet
- `no-notifications` - No notifications
- `no-results` - No search results
- `no-liked-posts` - No liked posts
- `no-saved-posts` - No saved posts
- `no-products` - No products yet
- `no-live-streams` - No live streams

### Props API
```tsx
interface EmptyStateProps {
  type: EmptyStateType;           // Required: Type from available types
  title?: string;                 // Optional: Override default title
  message?: string;               // Optional: Override default message
  icon?: React.ComponentType;     // Optional: Custom icon component
  actionButton?: {                // Optional: CTA button
    label: string;
    onPress: () => void;
  };
  illustration?: React.ReactNode; // Optional: Custom illustration
}
```

### Usage Examples

#### Basic Usage (No Posts)
```tsx
import EmptyState from '@/components/EmptyState';

export default function PostsScreen() {
  const posts = [];

  if (posts.length === 0) {
    return (
      <EmptyState
        type="no-posts"
        actionButton={{
          label: "Create Post",
          onPress: () => router.push('/create')
        }}
      />
    );
  }

  return <PostList posts={posts} />;
}
```

#### Custom Title and Message
```tsx
<EmptyState
  type="no-results"
  title="No matching styles found"
  message="Try different keywords or browse trending styles"
  actionButton={{
    label: "Browse Trending",
    onPress: () => router.push('/discover/trending')
  }}
/>
```

#### Custom Icon
```tsx
import { Star } from 'lucide-react-native';

<EmptyState
  type="no-saved-posts"
  icon={Star}
  title="No favorites yet"
  message="Star your favorite posts to save them here"
/>
```

#### With Custom Illustration
```tsx
import { Image } from 'expo-image';

<EmptyState
  type="no-products"
  illustration={
    <Image
      source={require('@/assets/illustrations/empty-cart.png')}
      style={{ width: 120, height: 120 }}
    />
  }
/>
```

#### In Different Screens

**Followers/Following Screen:**
```tsx
export default function FollowersScreen() {
  const followers = [];

  return (
    <View style={{ flex: 1 }}>
      {followers.length === 0 ? (
        <EmptyState type="no-followers" />
      ) : (
        <UserList users={followers} />
      )}
    </View>
  );
}
```

**Messages Screen:**
```tsx
<EmptyState
  type="no-messages"
  actionButton={{
    label: "Find People",
    onPress: () => router.push('/search')
  }}
/>
```

**Search Results:**
```tsx
const searchResults = [];

{searchResults.length === 0 && searchQuery && (
  <EmptyState
    type="no-results"
    message={`No results for "${searchQuery}"`}
  />
)}
```

---

## 3. Loading Skeleton Component

### File Location
`/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/components/LoadingSkeleton.tsx`

### Available Components
- `PostSkeleton` - Mimics post card layout
- `UserListSkeleton` - Mimics user list item
- `ProfileSkeleton` - Mimics profile header
- `CommentSkeleton` - Mimics comment item
- `GridSkeleton` - Mimics 3-column grid
- `FeedSkeleton` - Multiple post skeletons

### Features
- Smooth shimmer animation (1.5s duration)
- Dark mode support
- Configurable count
- Reanimated-powered performance

### Usage Examples

#### Feed Loading
```tsx
import { FeedSkeleton } from '@/components/LoadingSkeleton';

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);

  if (loading) {
    return <FeedSkeleton count={5} />;
  }

  return <PostList posts={posts} />;
}
```

#### User List Loading
```tsx
import { UserListSkeleton } from '@/components/LoadingSkeleton';

const FollowersScreen = () => {
  if (loading) {
    return (
      <View>
        {Array.from({ length: 10 }).map((_, i) => (
          <UserListSkeleton key={i} />
        ))}
      </View>
    );
  }

  return <UserList users={users} />;
};
```

#### Profile Loading
```tsx
import { ProfileSkeleton } from '@/components/LoadingSkeleton';

const ProfileScreen = () => {
  if (loading) {
    return <ProfileSkeleton />;
  }

  return <ProfileView profile={profile} />;
};
```

#### Grid Loading (Image Gallery)
```tsx
import { GridSkeleton } from '@/components/LoadingSkeleton';

const GalleryScreen = () => {
  if (loading) {
    return <GridSkeleton count={12} />;
  }

  return <ImageGrid images={images} />;
};
```

#### Comments Loading
```tsx
import { CommentSkeleton } from '@/components/LoadingSkeleton';

const CommentsSection = () => {
  if (loadingComments) {
    return (
      <View>
        {Array.from({ length: 5 }).map((_, i) => (
          <CommentSkeleton key={i} />
        ))}
      </View>
    );
  }

  return <CommentList comments={comments} />;
};
```

#### Conditional Rendering Pattern
```tsx
import { FeedSkeleton, PostSkeleton } from '@/components/LoadingSkeleton';

const FeedScreen = () => {
  const { data: posts, isLoading, isFetching } = useQuery('posts', fetchPosts);

  return (
    <ScrollView>
      {isLoading && <FeedSkeleton count={3} />}

      {posts?.map(post => (
        <Post key={post.id} post={post} />
      ))}

      {isFetching && !isLoading && <PostSkeleton />}
    </ScrollView>
  );
};
```

---

## 4. Error Boundary Component

### File Locations
- Component: `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/components/ErrorBoundary.tsx`
- Screen: `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/error.tsx`

### Features
- Catches JavaScript errors in component tree
- User-friendly error messages
- Expandable error details (dev mode only)
- Try Again and Go Home actions
- Optional custom fallback UI
- Error logging callback

### Usage

#### Wrap App Root
```tsx
// In app/_layout.tsx
import ErrorBoundary from '@/components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <Stack>
          {/* Your app screens */}
        </Stack>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
```

#### Wrap Specific Screens
```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

export default function ComplexFeatureScreen() {
  return (
    <ErrorBoundary>
      <ComplexComponent />
    </ErrorBoundary>
  );
}
```

#### With Error Logging
```tsx
import ErrorBoundary from '@/components/ErrorBoundary';
import * as Sentry from '@sentry/react-native'; // Example

export default function App() {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Log to error tracking service
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    // Log to analytics
    console.error('App Error:', error);
  };

  return (
    <ErrorBoundary onError={handleError}>
      <AppContent />
    </ErrorBoundary>
  );
}
```

#### Custom Fallback UI
```tsx
<ErrorBoundary
  fallback={(error, reset) => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Custom Error Screen</Text>
      <Button title="Reset" onPress={reset} />
    </View>
  )}
>
  <YourComponent />
</ErrorBoundary>
```

#### Multiple Error Boundaries (Granular)
```tsx
export default function HomeScreen() {
  return (
    <View>
      <ErrorBoundary>
        <Header />
      </ErrorBoundary>

      <ErrorBoundary>
        <Feed />
      </ErrorBoundary>

      <ErrorBoundary>
        <Recommendations />
      </ErrorBoundary>
    </View>
  );
}
```

---

## Integration Examples

### Complete Feed Screen with All Components
```tsx
import React, { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import ErrorBoundary from '@/components/ErrorBoundary';
import EmptyState from '@/components/EmptyState';
import { FeedSkeleton } from '@/components/LoadingSkeleton';
import Post from '@/components/Post';
import NetInfo from '@react-native-community/netinfo';

export default function FeedScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPosts();

    // Network listener
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        router.push('/offline');
      }
    });

    return () => unsubscribe();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.example.com/posts');

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError(err);
      if (err.message.includes('network')) {
        router.push('/offline');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <FeedSkeleton count={5} />;
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        type="no-posts"
        actionButton={{
          label: "Create Your First Post",
          onPress: () => router.push('/create')
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
```

### Search Screen with Empty States
```tsx
import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import EmptyState from '@/components/EmptyState';
import { FeedSkeleton } from '@/components/LoadingSkeleton';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    setLoading(true);
    setHasSearched(true);
    // Perform search
    // ...
    setLoading(false);
  };

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => handleSearch(query)}
        placeholder="Search styles..."
      />

      {loading && <FeedSkeleton count={3} />}

      {!loading && hasSearched && results.length === 0 && (
        <EmptyState
          type="no-results"
          message={`No results for "${query}"`}
          actionButton={{
            label: "Browse Trending",
            onPress: () => router.push('/discover/trending')
          }}
        />
      )}

      {!loading && !hasSearched && (
        <EmptyState
          type="no-results"
          title="Start searching"
          message="Find styles, people, and products"
        />
      )}

      {/* Render results */}
    </View>
  );
}
```

---

## Accessibility Features

All components include:

1. **Screen Reader Support**
   - Descriptive labels for icons
   - Proper heading hierarchy
   - Accessible touch targets (minimum 44x44)

2. **Keyboard Navigation**
   - All interactive elements are focusable
   - Proper tab order
   - Enter/Space key support

3. **Color Contrast**
   - WCAG AA compliant color ratios
   - Dark mode support
   - Sufficient text contrast

---

## Performance Considerations

1. **LoadingSkeleton**
   - Uses `react-native-reanimated` for 60fps animations
   - Shimmer effect runs on UI thread
   - Minimal re-renders

2. **EmptyState**
   - Lightweight component
   - Icons loaded on-demand
   - No heavy animations

3. **ErrorBoundary**
   - Minimal performance impact
   - Only active when errors occur
   - Expandable details prevent initial render overhead

4. **Offline Screen**
   - Auto-retry throttled to 5 seconds
   - Network listener cleaned up properly
   - Minimal battery impact

---

## Testing Recommendations

### Test Offline Screen
```tsx
// Force offline mode
import NetInfo from '@react-native-community/netinfo';

// In test or dev mode
NetInfo.configure({
  reachabilityUrl: 'https://invalid-url.test',
  reachabilityTest: async () => Promise.resolve(false),
});
```

### Test Error Boundary
```tsx
// Create a component that throws error
const BrokenComponent = () => {
  throw new Error('Test error');
  return null;
};

// Wrap in ErrorBoundary
<ErrorBoundary>
  <BrokenComponent />
</ErrorBoundary>
```

### Test Empty States
```tsx
// Simply render with empty data
const posts = [];

{posts.length === 0 && <EmptyState type="no-posts" />}
```

### Test Loading Skeletons
```tsx
// Delay data loading to see skeleton
const [loading, setLoading] = useState(true);

useEffect(() => {
  setTimeout(() => setLoading(false), 2000); // 2 second delay
}, []);
```

---

## Styling Customization

All components use the centralized color system from `@/constants/colors`:

```tsx
// To customize, update Colors.ts
export default {
  light: {
    primary: "#0095F6",
    error: "#FF3B30",
    success: "#4BB543",
    // ...
  },
  dark: {
    // ...
  }
}
```

Components automatically adapt to light/dark theme via `useThemeStore()`.

---

## Troubleshooting

### Offline screen not showing
- Ensure `@react-native-community/netinfo` is installed
- Check network listener is set up in app layout
- Verify navigation to `/offline` route

### Loading skeleton not animating
- Ensure `react-native-reanimated` is properly configured
- Check Babel plugin is installed
- Verify `expo-linear-gradient` is available

### Error boundary not catching errors
- Error boundaries only catch errors in child components
- They don't catch errors in event handlers
- Async errors need manual try/catch

### Empty state icon not showing
- Ensure `lucide-react-native` is installed
- Check icon import is correct
- Verify icon name matches available icons

---

## Migration from Existing Screens

### Replace manual offline handling:
```tsx
// Before
{!isOnline && <Text>No connection</Text>}

// After
router.push('/offline');
```

### Replace manual empty states:
```tsx
// Before
{posts.length === 0 && (
  <View>
    <Text>No posts</Text>
    <Button title="Create" />
  </View>
)}

// After
<EmptyState
  type="no-posts"
  actionButton={{ label: "Create Post", onPress: handleCreate }}
/>
```

### Replace loading indicators:
```tsx
// Before
{loading && <ActivityIndicator />}

// After
{loading && <FeedSkeleton count={3} />}
```
