# Trending Hashtags - Quick Start Guide

## File Location
```
/app/discover/trending.tsx
```

## How to Navigate to This Screen

### Option 1: Programmatic Navigation
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/discover/trending');
```

### Option 2: From Discover Tab
```
User Flow:
Discover Tab → Trending Section → Tap "View All" → This Screen
```

## API Endpoint Used
```
GET https://b6om6sz99f.execute-api.ap-northeast-1.amazonaws.com/dev/hashtag/trending
Query: ?timeframe=day&limit=50
```

## Key Features Checklist

✅ Ranked hashtags (1-50) with gradient badges
✅ Post count with formatted numbers (1K, 1M format)
✅ Growth rate percentage display
✅ Trend indicators (up/stable/down arrows)
✅ 3-4 preview images from recent posts
✅ Filter tabs: Today, This Week, This Month
✅ Pull-to-refresh functionality
✅ Loading states with ActivityIndicator
✅ Empty state handling
✅ Tap to navigate to hashtag detail
✅ Smooth animations on card press
✅ SafeAreaView for notched devices
✅ Mock data fallback for development

## Quick Test

### 1. Run the app
```bash
npm start
# or
yarn start
```

### 2. Navigate to screen
```typescript
// In any component
router.push('/discover/trending');
```

### 3. Expected Behavior
- Header shows "Trending Hashtags"
- 3 filter buttons at top (Today is selected)
- List of 50 hashtags with rank badges
- Each card shows: rank, hashtag name, post count, growth %, preview images
- Tap any card → navigates to /hashtag/[tag]
- Pull down → refreshes data

## Common Navigation Paths

### From Discover Tab
```
(tabs)/search.tsx 
  → Trending section
    → router.push('/discover/trending')
      → This screen
```

### From Trending Screen
```
/discover/trending
  → Tap hashtag card
    → router.push('/hashtag/fashion')
      → /hashtag/[tag].tsx
```

### From Hashtag Detail
```
/hashtag/[tag].tsx
  → Tap post
    → router.push('/post/123')
      → /post/[id].tsx
```

## Environment Variables
No additional environment setup needed. Uses existing AWS config from:
```
/config/aws-config.ts
```

## Dependencies (Already Installed)
- expo-image
- expo-router
- expo-linear-gradient
- lucide-react-native
- react-native-safe-area-context

## Troubleshooting

### Issue: Screen shows mock data
**Cause:** API endpoint not available or network error
**Solution:** Check API endpoint URL in /config/aws-config.ts

### Issue: Images not loading
**Cause:** Invalid image URLs from API
**Solution:** Check API response format matches expected schema

### Issue: Navigation not working
**Cause:** Routes not configured
**Solution:** Ensure /hashtag/[tag].tsx exists (already implemented)

### Issue: Filters not changing data
**Cause:** API not respecting timeframe parameter
**Solution:** Verify API endpoint supports timeframe query param

## Next Steps

### Integrate into Discover Tab
Add a "Trending" section to the search/discover screen:

```typescript
// In (tabs)/search.tsx or discover screen
<TouchableOpacity onPress={() => router.push('/discover/trending')}>
  <Text>View Trending Hashtags</Text>
</TouchableOpacity>
```

### Add Analytics
Track hashtag views:

```typescript
// In handleHashtagPress
analytics.logEvent('trending_hashtag_view', {
  hashtag: tag,
  rank: item.rank,
  timeframe: timeframe,
});
```

### Add Haptic Feedback
```typescript
import * as Haptics from 'expo-haptics';

// In handleHashtagPress
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
```

## File Structure Summary
```
app/
├── discover/
│   └── trending.tsx          ← NEW: Trending hashtags screen
├── hashtag/
│   └── [tag].tsx             ← Existing: Hashtag detail
└── post/
    └── [id].tsx              ← Existing: Post detail
```

## Code Snippet: Basic Usage
```typescript
import { useRouter } from 'expo-router';

function DiscoverScreen() {
  const router = useRouter();
  
  return (
    <View>
      <TouchableOpacity 
        onPress={() => router.push('/discover/trending')}
      >
        <Text>View Trending Hashtags</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Performance Notes
- FlatList handles 50 items efficiently
- Images lazy-load automatically
- Animations use native driver (GPU accelerated)
- No performance issues expected on low-end devices

## Design Tokens Used
```typescript
Colors.light.background     // #FFFFFF
Colors.light.text          // #262626
Colors.light.secondaryText // #8E8E8E
Colors.light.border        // #DBDBDB
Colors.light.primary       // #0095F6
```

## Contact/Support
For issues or questions about this implementation, refer to:
- Implementation doc: TRENDING_HASHTAGS_IMPLEMENTATION.md
- Component breakdown: COMPONENT_BREAKDOWN.md
