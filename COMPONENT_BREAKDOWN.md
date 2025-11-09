# Trending Hashtags Screen - Component Breakdown

## Screen Hierarchy

```
TrendingHashtagsScreen
├── SafeAreaView (with insets)
│   ├── Header Section
│   │   ├── Back Button (ArrowLeft icon)
│   │   ├── Title Text ("Trending Hashtags")
│   │   └── Spacer
│   │
│   ├── Timeframe Filter Section
│   │   ├── "Today" Button
│   │   ├── "This Week" Button
│   │   └── "This Month" Button
│   │
│   ├── Updated At Banner (conditional)
│   │   └── Timestamp Text
│   │
│   └── FlatList
│       ├── Hashtag Cards (x50)
│       │   ├── Rank Badge (LinearGradient)
│       │   │   └── Rank Number (#1-50)
│       │   │
│       │   ├── Hashtag Info Column
│       │   │   ├── Header Row
│       │   │   │   ├── Hashtag Name (#tag)
│       │   │   │   └── Trend Badge
│       │   │   │       └── Trend Icon (↑/→/↓)
│       │   │   └── Stats Row
│       │   │       ├── Post Count
│       │   │       └── Growth Rate (%)
│       │   │
│       │   └── Preview Images Grid
│       │       ├── Image 1
│       │       ├── Image 2
│       │       ├── Image 3
│       │       └── Image 4 (with +N overlay)
│       │
│       ├── Pull-to-Refresh Control
│       └── Empty State (when no data)
```

## Component Details

### 1. Header Section
```
┌─────────────────────────────────────┐
│ ←   Trending Hashtags         [   ] │
└─────────────────────────────────────┘
```
- Fixed height: ~60px
- Border bottom: 0.5px solid
- Background: white

### 2. Timeframe Filter
```
┌─────────────────────────────────────┐
│ [ Today ] [ This Week ] [This Month]│
└─────────────────────────────────────┘
```
- 3 equal-width buttons
- Active button: blue background
- Inactive: gray background
- Border bottom: 0.5px solid

### 3. Hashtag Card Layout
```
┌─────────────────────────────────────┐
│ ┌──┐  #fashion          ↑  □ □ □ □  │
│ │#1│  1.2M posts  +45%     □ □ □ □  │
│ └──┘                       □ □ □ □  │
└─────────────────────────────────────┘
│←12→│←────flex:1────→│←4→│←─232─→│
```
- Card width: screen width - 32px (16px padding each side)
- Card height: auto
- Rank badge: 48x48px circle
- Preview images: 4x 56px squares

### 4. Rank Badge Gradients
```
Rank 1:  ●  Gold    (#FFD700 → #FFA500)
Rank 2:  ●  Silver  (#C0C0C0 → #A0A0A0)
Rank 3:  ●  Bronze  (#CD7F32 → #B8860B)
Rank 4-10: ●  Red   (#FF6B6B → #FF4757)
Rank 11-25: ● Teal  (#4ECDC4 → #44B7B1)
Rank 26-50: ● Gray  (#95A5A6 → #7F8C8D)
```

### 5. Trend Indicators
```
Rising:  ↗  Green  (#4BB543)
Stable:  →  Gray   (#8E8E8E)
Falling: ↘  Red    (#FF3B30)
```

## State Management

### Screen States
1. **Loading**: Initial data fetch
   - Shows: ActivityIndicator + "Loading trending hashtags..."
   - Duration: Until API responds

2. **Loaded**: Data displayed
   - Shows: Full hashtag list
   - Scrollable: Yes

3. **Refreshing**: Pull-to-refresh active
   - Shows: Refresh spinner at top
   - Data: Remains visible

4. **Empty**: No hashtags found
   - Shows: "No trending hashtags found" + "Pull to refresh"

### Data Flow
```
User Action → State Update → API Call → Response → UI Update

1. Screen Mount
   └→ setLoading(true)
   └→ fetchTrendingHashtags()
   └→ setHashtags(data)
   └→ setLoading(false)

2. Filter Change (Today/Week/Month)
   └→ setTimeframe(newValue)
   └→ useEffect trigger
   └→ fetchTrendingHashtags()

3. Pull to Refresh
   └→ setRefreshing(true)
   └→ fetchTrendingHashtags(true)
   └→ setRefreshing(false)

4. Card Tap
   └→ handleHashtagPress(tag)
   └→ router.push(/hashtag/[tag])
```

## Animation Breakdown

### Card Press Animation
```typescript
Timeline:
0ms:   scale = 1.0      (initial)
↓
150ms: scale = 0.95     (press in - spring)
↓
0ms:   scale = 0.95     (hold)
↓
200ms: scale = 1.0      (release - spring)
```

### Spring Configuration
- useNativeDriver: true (GPU accelerated)
- Animation type: Spring (natural bounce)
- Properties animated: scale transform

## Performance Optimizations

### 1. FlatList Optimizations
```typescript
- keyExtractor: Uses unique tag name
- renderItem: Memoized component
- getItemLayout: Not used (variable height)
- windowSize: Default (21)
- maxToRenderPerBatch: Default (10)
```

### 2. Image Loading
```typescript
- expo-image: Faster than React Native Image
- contentFit: "cover" (crop to fill)
- transition: 200ms fade-in
- Lazy loading: Automatic via FlatList
```

### 3. Re-render Prevention
```typescript
- useCallback: fetchTrendingHashtags, onRefresh
- useMemo: Not needed (simple data transformation)
- React.memo: Could be added to card component
```

## Accessibility Considerations

### Current Structure
- Tappable areas: 48px+ (follows guidelines)
- Text contrast: AAA compliant
- Touch targets: Well-spaced
- Visual hierarchy: Clear

### Recommended Additions
```typescript
// Header
accessibilityLabel="Back to discover"
accessibilityRole="button"

// Filter Buttons
accessibilityLabel="Show today's trending"
accessibilityState={{ selected: timeframe === 'day' }}
accessibilityRole="button"

// Hashtag Cards
accessibilityLabel={`Hashtag ${tag}, rank ${rank}, ${postCount} posts`}
accessibilityRole="button"
accessibilityHint="Tap to view posts"
```

## Error Scenarios

### 1. Network Error
```
Trigger: fetch() fails
Behavior: Catch error → Use mock data
User sees: Mock trending hashtags
```

### 2. Empty Response
```
Trigger: API returns { hashtags: [] }
Behavior: Show empty state
User sees: "No trending hashtags found"
```

### 3. Malformed Data
```
Trigger: Missing required fields
Behavior: Skip invalid items
User sees: Valid items only
```

## Platform Differences

### iOS
- Shadow: Uses shadowColor, shadowOffset, etc.
- Safe area: Automatic via insets
- Haptics: Available (could add)

### Android
- Shadow: Uses elevation property
- Safe area: Automatic via insets
- Haptics: Limited support

### Web
- Shadow: CSS box-shadow
- Safe area: Not applicable
- Haptics: Not available
- Touch: Works with mouse clicks
