# UI Improvement Components - Quick Reference

Quick reference guide for the 4 new UI improvement components.

---

## File Paths

```
/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/
├── app/
│   ├── offline.tsx          # Offline/No Connection Screen
│   └── error.tsx            # Error Screen (route)
└── components/
    ├── EmptyState.tsx       # Empty State Component
    ├── LoadingSkeleton.tsx  # Loading Skeleton Components
    └── ErrorBoundary.tsx    # Error Boundary Component
```

---

## 1. Offline Screen

**Route:** `/offline`

**Navigate to:**
```tsx
router.push('/offline');
```

**Auto-detect network:**
```tsx
useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (!state.isConnected) router.push('/offline');
  });
  return () => unsubscribe();
}, []);
```

---

## 2. Empty State Component

**Import:**
```tsx
import EmptyState from '@/components/EmptyState';
```

**Basic Usage:**
```tsx
<EmptyState
  type="no-posts"
  actionButton={{ label: "Create Post", onPress: handleCreate }}
/>
```

**Available Types:**
- `no-posts`
- `no-followers`
- `no-following`
- `no-messages`
- `no-notifications`
- `no-results`
- `no-liked-posts`
- `no-saved-posts`
- `no-products`
- `no-live-streams`

**Props:**
```tsx
type: EmptyStateType          // Required
title?: string                // Optional override
message?: string              // Optional override
icon?: React.ComponentType    // Optional custom icon
actionButton?: {              // Optional CTA
  label: string;
  onPress: () => void;
}
illustration?: ReactNode      // Optional custom image
```

---

## 3. Loading Skeleton Components

**Import:**
```tsx
import {
  FeedSkeleton,
  PostSkeleton,
  UserListSkeleton,
  ProfileSkeleton,
  CommentSkeleton,
  GridSkeleton,
} from '@/components/LoadingSkeleton';
```

**Usage:**
```tsx
// Feed loading
{loading ? <FeedSkeleton count={5} /> : <PostList posts={posts} />}

// Profile loading
{loading ? <ProfileSkeleton /> : <ProfileView />}

// Grid loading
{loading ? <GridSkeleton count={9} /> : <ImageGrid />}

// User list loading
{loading ? <UserListSkeleton /> : <UserItem />}
```

**Available Components:**
- `FeedSkeleton` - Multiple post skeletons (configurable count)
- `PostSkeleton` - Single post card skeleton
- `UserListSkeleton` - User list item skeleton
- `ProfileSkeleton` - Profile header skeleton
- `CommentSkeleton` - Comment item skeleton
- `GridSkeleton` - 3-column image grid skeleton

---

## 4. Error Boundary Component

**Import:**
```tsx
import ErrorBoundary from '@/components/ErrorBoundary';
```

**Wrap App Root:**
```tsx
// In app/_layout.tsx
<ErrorBoundary>
  <SafeAreaProvider>
    <Stack>
      {/* Your screens */}
    </Stack>
  </SafeAreaProvider>
</ErrorBoundary>
```

**Wrap Specific Screen:**
```tsx
<ErrorBoundary>
  <ComplexComponent />
</ErrorBoundary>
```

**With Error Logging:**
```tsx
<ErrorBoundary
  onError={(error, errorInfo) => {
    console.error('Error:', error);
    // Send to analytics/monitoring
  }}
>
  <App />
</ErrorBoundary>
```

**Custom Fallback:**
```tsx
<ErrorBoundary
  fallback={(error, reset) => (
    <CustomErrorScreen error={error} onReset={reset} />
  )}
>
  <Component />
</ErrorBoundary>
```

---

## Common Patterns

### Pattern 1: Complete Loading Flow
```tsx
if (loading) return <FeedSkeleton count={5} />;
if (posts.length === 0) return <EmptyState type="no-posts" />;
return <PostList posts={posts} />;
```

### Pattern 2: Network Error Handling
```tsx
try {
  const response = await fetch(url);
  // ...
} catch (error) {
  if (error.message.includes('network')) {
    router.push('/offline');
  }
}
```

### Pattern 3: Search Results
```tsx
{loading && <FeedSkeleton />}
{!loading && hasSearched && results.length === 0 && (
  <EmptyState
    type="no-results"
    message={`No results for "${query}"`}
  />
)}
```

### Pattern 4: Pull-to-Refresh
```tsx
<ScrollView
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
>
  {posts.map(post => <Post key={post.id} post={post} />)}
  {refreshing && <PostSkeleton />}
</ScrollView>
```

### Pattern 5: Granular Error Boundaries
```tsx
<View>
  <ErrorBoundary><Header /></ErrorBoundary>
  <ErrorBoundary><Feed /></ErrorBoundary>
  <ErrorBoundary><Sidebar /></ErrorBoundary>
</View>
```

---

## Integration Checklist

### For Every Screen:

- [ ] Wrap in `<ErrorBoundary>` for error catching
- [ ] Add loading state with appropriate skeleton
- [ ] Add empty state when data.length === 0
- [ ] Handle network errors → redirect to `/offline`
- [ ] Add pull-to-refresh with skeleton indicator

### For App Root (_layout.tsx):

- [ ] Add `<ErrorBoundary>` wrapper
- [ ] Register `/offline` and `/error` routes
- [ ] Add global network listener (optional)

### For API Calls:

- [ ] Wrap in try/catch
- [ ] Check for network errors
- [ ] Navigate to `/offline` on network failure
- [ ] Show error screen on other errors

---

## Styling

All components use `@/constants/colors` and support:
- Light/Dark mode (automatic via `useThemeStore`)
- Consistent design system
- Accessible color contrast (WCAG AA)
- Professional animations (60fps)

**To customize colors:**
Edit `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/constants/Colors.ts`

---

## Testing

### Test Offline Screen
```tsx
// Force offline
NetInfo.configure({
  reachabilityUrl: 'https://invalid.test',
  reachabilityTest: async () => Promise.resolve(false),
});
```

### Test Error Boundary
```tsx
const BrokenComponent = () => {
  throw new Error('Test error');
};

<ErrorBoundary><BrokenComponent /></ErrorBoundary>
```

### Test Empty States
```tsx
const posts = [];
{posts.length === 0 && <EmptyState type="no-posts" />}
```

### Test Skeletons
```tsx
const [loading, setLoading] = useState(true);
useEffect(() => {
  setTimeout(() => setLoading(false), 2000);
}, []);
```

---

## Accessibility Features

All components include:
- Screen reader support
- Keyboard navigation
- Proper ARIA labels
- Touch target size (minimum 44x44)
- Color contrast (WCAG AA)
- Dark mode support

---

## Performance

- **LoadingSkeleton**: 60fps animations via `react-native-reanimated`
- **EmptyState**: Lightweight, minimal re-renders
- **ErrorBoundary**: Zero overhead when no errors
- **Offline Screen**: Auto-retry throttled to 5 seconds

---

## Dependencies

Required packages (already installed):
- `@react-native-community/netinfo` - Network detection
- `react-native-reanimated` - Smooth animations
- `expo-linear-gradient` - Shimmer effect
- `lucide-react-native` - Icons
- `expo-router` - Navigation

---

## Troubleshooting

**Offline screen not showing:**
- Check NetInfo is installed
- Verify navigation route is registered
- Check network listener is active

**Skeleton not animating:**
- Verify react-native-reanimated is configured
- Check Babel plugin is installed
- Ensure expo-linear-gradient is available

**Error boundary not catching:**
- Only catches errors in child components
- Doesn't catch event handler errors
- Async errors need manual try/catch

**Empty state icon missing:**
- Verify lucide-react-native is installed
- Check icon name is correct
- Confirm icon is exported from lucide-react-native

---

## Next Steps

1. **Update existing screens** to use new components
2. **Add global network listener** in app/_layout.tsx
3. **Wrap app in ErrorBoundary** for crash protection
4. **Replace manual loading states** with skeletons
5. **Replace manual empty states** with EmptyState component

---

## Documentation

For detailed documentation, see:
- `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/claudedocs/ui-improvement-components-usage.md`
- `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/claudedocs/example-integration.tsx`
