# Frontend-Backend API Integration Roadmap

## Quick Reference Matrix

### Feature | Backend Status | Frontend Status | Integration % | Priority
```
Feed Timeline           | ✅ Complete  | ⚠️ Partial       | 40%  | P0 - Urgent
Like System            | ✅ Complete  | ✅ Buttons only  | 30%  | P0 - Urgent
Follow System          | ✅ Complete  | ✅ Buttons only  | 20%  | P0 - Urgent
Comments              | ✅ Complete  | ⚠️ None          | 25%  | P1 - High
Products              | ✅ Complete  | ⚠️ Partial       | 50%  | P1 - High
Notifications         | ✅ Complete  | ⚠️ Partial       | 30%  | P2 - Medium
Live Streaming        | ✅ Complete  | ❌ Mock only     | 10%  | P3 - Low
Direct Messages       | ✅ Complete  | ❌ Mock only     | 5%   | P3 - Low
Rooms/Community       | ✅ Complete  | ⚠️ Mock only     | 15%  | P4 - Future
Analytics             | ✅ Complete  | ❌ None          | 0%   | P4 - Future
Search/Hashtags       | ✅ Complete  | ❌ Mock only     | 5%   | P4 - Future
```

## Critical Path for MVP Integration

### Week 1: Authentication Foundation
**Status:** ✅ COMPLETE
- [x] Cognito integration (authStore.ts)
- [x] Sign up/login flow
- [x] Token storage and refresh
- [x] User profile fetch

### Week 2: Feed Timeline (GET /timeline)
**Current:** 40% → **Target:** 90%

**Files to Modify:**
- `app/(tabs)/index.tsx` - Replace mock `posts` array
- `store/postsStore.ts` - Create new store
- `lib/api/timeline.ts` - New API client

**Work Items:**
```typescript
// 1. Create API client (lib/api/timeline.ts)
export async function getTimeline(limit = 20, nextToken?: string) {
  const token = await getAuthToken()
  const response = await fetch(
    `${API_URL}/timeline?limit=${limit}&nextToken=${nextToken}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return response.json() as GetTimelineResponse
}

// 2. Create posts store (store/postsStore.ts)
export const usePostsStore = create((set, get) => ({
  posts: [],
  nextToken: null,
  loading: false,
  
  fetchTimeline: async (limit = 20) => {
    set({ loading: true })
    const data = await getTimeline(limit)
    set({ 
      posts: data.items,
      nextToken: data.nextToken,
      loading: false 
    })
  },
  
  loadMore: async () => {
    const { nextToken } = get()
    if (!nextToken) return
    const data = await getTimeline(20, nextToken)
    set(state => ({
      posts: [...state.posts, ...data.items],
      nextToken: data.nextToken
    }))
  }
}))

// 3. Update index.tsx
function FeedScreen() {
  const { posts, loading, nextToken, fetchTimeline, loadMore } = usePostsStore()
  
  useEffect(() => {
    fetchTimeline()
  }, [])
  
  return (
    <FlatList
      data={posts}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      // ... rest of config
    />
  )
}
```

**Estimated Time:** 2-3 days

### Week 2: Like System (POST/DELETE /post/{id}/like)
**Current:** 30% → **Target:** 95%

**Files to Modify:**
- `components/Post.tsx` - Connect like button
- `components/PostActions.tsx` - API calls
- `lib/api/likes.ts` - New API client

**Work Items:**
```typescript
// 1. API client (lib/api/likes.ts)
export async function likePost(postId: string) {
  const token = await getAuthToken()
  return fetch(`${API_URL}/post/${postId}/like`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json() as LikePostResponse)
}

export async function unlikePost(postId: string) {
  const token = await getAuthToken()
  return fetch(`${API_URL}/post/${postId}/like`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json())
}

// 2. Update Post component
const Post = ({ post }: Props) => {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.like_count)
  const [loading, setLoading] = useState(false)
  
  const handleLike = async () => {
    setLoading(true)
    try {
      if (liked) {
        await unlikePost(post.post_id)
        setLiked(false)
        setLikeCount(c => c - 1)
      } else {
        const res = await likePost(post.post_id)
        setLiked(true)
        setLikeCount(res.like_count)
      }
    } catch (error) {
      console.error('Like failed:', error)
      setLoading(false)
    }
  }
  
  return (
    <PostActions
      isLiked={liked}
      likeCount={likeCount}
      onLike={handleLike}
      loading={loading}
    />
  )
}
```

**Estimated Time:** 1 day

### Week 2: Follow System (POST/DELETE /account/{id}/follow)
**Current:** 20% → **Target:** 95%

**Work Items:**
- Similar pattern to likes
- Update in profile screen
- Update in user cards

**Estimated Time:** 1 day

### Week 3: Comments (POST /post/{id}/comment)
**Current:** 25% → **Target:** 90%

**Files to Modify:**
- `components/Post.tsx` - Add comment button
- `components/ProfileCommentModal.tsx` - Comment creation
- `lib/api/comments.ts` - New API client

**Work Items:**
```typescript
// 1. Comment submission
export async function createComment(
  postId: string,
  content: string,
  parentCommentId?: string
) {
  const token = await getAuthToken()
  return fetch(`${API_URL}/post/${postId}/comment`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content, parent_comment_id: parentCommentId })
  }).then(r => r.json() as CreateCommentResponse)
}

// 2. Get comments
export async function getComments(
  postId: string,
  limit = 20,
  nextToken?: string
) {
  const token = await getAuthToken()
  return fetch(
    `${API_URL}/post/${postId}/comments?limit=${limit}&nextToken=${nextToken}`,
    { headers: { Authorization: `Bearer ${token}` } }
  ).then(r => r.json() as GetCommentsResponse)
}
```

**Estimated Time:** 2-3 days

### Week 3: Product Integration (GET /product, POST /product)
**Current:** 50% → **Target:** 90%

**Files to Modify:**
- `app/(tabs)/shop.tsx` - Replace mock products
- `components/ProductCard.tsx` - Track clicks
- `store/productStore.ts` - Create new store
- `lib/api/products.ts` - New API client

**Work Items:**
```typescript
// 1. Get products with filters
export async function getProducts(filters: {
  category?: string
  sellerAccountId?: string
  limit?: number
  nextToken?: string
}) {
  const token = await getAuthToken()
  const params = new URLSearchParams()
  if (filters.category) params.append('category', filters.category)
  if (filters.sellerAccountId) params.append('seller_account_id', filters.sellerAccountId)
  params.append('limit', String(filters.limit || 20))
  if (filters.nextToken) params.append('nextToken', filters.nextToken)
  
  return fetch(`${API_URL}/product?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json() as GetProductsResponse)
}

// 2. Track product clicks
export async function clickProduct(productId: string) {
  const token = await getAuthToken()
  return fetch(`${API_URL}/product/${productId}/click`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json())
}
```

**Estimated Time:** 2 days

### Week 4: Notifications (GET /notification)
**Current:** 30% → **Target:** 85%

**Files to Modify:**
- `app/(tabs)/activity.tsx` - Replace mock notifications
- `app/(tabs)/notification.tsx` - Real-time sync
- `store/notificationStore.ts` - Create new store

**Estimated Time:** 2 days

## Implementation Checklist

### Phase 1: Core Infrastructure (Week 1)
- [ ] Create `lib/api-client.ts` base class
- [ ] Implement error handling/retry logic
- [ ] Add request logging/debugging
- [ ] Setup response interceptors
- [ ] Test with real Cognito tokens

### Phase 2: Post Management (Weeks 2-3)
- [ ] Timeline integration
- [ ] Like system
- [ ] Follow system
- [ ] Comments system
- [ ] User posts endpoint

### Phase 3: Shopping (Week 3-4)
- [ ] Product listing
- [ ] Product filtering
- [ ] Click tracking
- [ ] Cart checkout flow

### Phase 4: Communication (Week 4+)
- [ ] Notification fetching
- [ ] Message retrieval
- [ ] WebSocket setup (if real-time needed)
- [ ] Live chat

### Phase 5: Advanced (Future)
- [ ] Analytics tracking
- [ ] Search implementation
- [ ] Room integration
- [ ] Hashtag trending

## API Endpoint Summary for Quick Reference

### Most Used (Implement First)
```
GET    /timeline                              # Feed
POST   /post/{id}/like, DELETE /post/{id}/like # Likes
POST   /account/{id}/follow, DELETE            # Follow
POST   /post/{id}/comment, GET /post/{id}/comments # Comments
GET    /product, GET /product/{id}            # Products
GET    /notification                          # Notifications
```

### Common Patterns
All endpoints expect:
```
Header: Authorization: Bearer {TOKEN}
Response: { success: true|false, data?: T, error?: { code, message } }
Pagination: ?limit=20&nextToken=base64string
```

## Testing Strategy

### Unit Tests Needed
```
tests/
├── api/
│   ├── timeline.test.ts
│   ├── likes.test.ts
│   ├── follows.test.ts
│   └── comments.test.ts
└── stores/
    ├── postsStore.test.ts
    └── productStore.test.ts
```

### Manual Testing Flow
1. Sign in with Cognito (or test account)
2. Navigate to feed
3. Verify timeline loads with real posts
4. Like a post → verify counter updates
5. Follow a user → verify button state changes
6. Write comment → verify in list
7. Browse shop → verify product list

---

**Last Updated:** November 9, 2025
**Next Review:** After Phase 1 completion
