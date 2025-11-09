# Rork Instagram Feed Design - Comprehensive Codebase Analysis

**Generated:** November 9, 2025
**Project Type:** React Native + Expo (Mobile) + AWS Lambda (Backend)
**Status:** Stage 2B-2C - Core features implemented, APIs partially deployed

---

## Executive Summary

This is a **full-stack social media platform** (similar to Instagram) with fashion/style focus. The project has:
- **Frontend:** React Native/Expo app with 13+ main screens
- **Backend:** AWS Lambda functions with DynamoDB (81 API endpoints)
- **Architecture:** REST API with Cognito authentication
- **State Management:** Zustand stores (minimal, mostly mock data)
- **Current Issue:** Frontend uses mock data extensively; backend APIs exist but frontend integration is limited

---

## 1. BACKEND API STRUCTURE

### 1.1 Infrastructure Setup
- **AWS Services Used:**
  - Lambda (compute)
  - DynamoDB (NoSQL database)
  - API Gateway (REST API)
  - Cognito (authentication)
  - S3 (image storage)
  - Mux (video streaming for live)
  - WebSocket (real-time chat)

- **Database Tables:** DynamoDB with GSI (Global Secondary Indexes)
  - ACCOUNT: User profiles
  - POST: Social posts
  - COMMENT: Post comments
  - LIKE: Like tracking
  - FOLLOW: Follow relationships
  - ROOM: Community rooms
  - MESSAGE/CONVERSATION: DM functionality
  - PRODUCT: Shop products
  - NOTIFICATION: User notifications
  - SESSION: Session management

### 1.2 Available Lambda Endpoints (81 Total)

#### Authentication & Accounts (4)
```
POST   /account/createAccount       - Register new account
GET    /account/{account_id}        - Get user profile
PUT    /account/{account_id}        - Update profile
POST   /cognito/postConfirmation    - Email confirmation trigger
```

#### Posts Management (10)
```
POST   /post                         - Create post
GET    /post/{post_id}              - Get post details
PUT    /post/{post_id}              - Update post
DELETE /post/{post_id}              - Delete post
GET    /timeline                    - Get follower timeline
GET    /post/user/{account_id}      - Get user's posts
GET    /discovery                   - Get discovery feed
GET    /room/{room_id}/posts        - Get room posts
POST   /post/{post_id}/update       - Update post visibility
```

#### Like System (4)
```
POST   /post/{post_id}/like         - Like a post
DELETE /post/{post_id}/like         - Unlike a post
GET    /post/{post_id}/likes        - Get likes list
GET    /account/{account_id}/likes  - Get user's likes
```

#### Comments (3)
```
POST   /post/{post_id}/comment      - Create comment
DELETE /comment/{comment_id}        - Delete comment
GET    /post/{post_id}/comments     - Get comments
```

#### Follow System (4)
```
POST   /account/{account_id}/follow         - Follow user
DELETE /account/{account_id}/follow         - Unfollow user
GET    /account/{account_id}/followers      - Get followers list
GET    /account/{account_id}/following      - Get following list
```

#### Room/Community (6)
```
POST   /room                        - Create room
GET    /room/{room_id}              - Get room details
PUT    /room/{room_id}              - Update room
GET    /room/{room_id}/members      - Get room members
POST   /room/{room_id}/join         - Join room
DELETE /room/{room_id}/leave        - Leave room
```

#### Messages/DM (4)
```
POST   /conversation                - Create conversation
GET    /conversation                - List conversations
POST   /conversation/{conv_id}/msg  - Send message
GET    /conversation/{conv_id}/msg  - Get messages
```

#### Live Streaming (12)
```
POST   /live                        - Create live stream
GET    /live                        - Get active streams
GET    /live/{stream_id}            - Get stream details
DELETE /live/{stream_id}            - End live stream
POST   /live/{stream_id}/join       - Join stream
DELETE /live/{stream_id}/leave      - Leave stream
POST   /live/{stream_id}/chat       - Send live chat
GET    /live/{stream_id}/chats      - Get live chats
POST   /live/{stream_id}/gift       - Send gift
POST   /live/{stream_id}/moderator  - Add moderator
POST   /live/{stream_id}/ban        - Ban user
POST   /live/webhook/mux            - Mux video webhook
```

#### Products/Shop (8)
```
POST   /product                     - Create product
GET    /product                     - List products (with filters)
GET    /product/{product_id}        - Get product details
PUT    /product/{product_id}        - Update product
DELETE /product/{product_id}        - Delete product
POST   /post/{post_id}/product      - Tag product on post
GET    /post/{post_id}/products     - Get tagged products
POST   /product/{product_id}/click   - Track product click
```

#### Notifications (5)
```
GET    /notification                - List notifications
POST   /notification/{notif_id}/read - Mark as read
POST   /notification/read-all       - Mark all as read
GET    /notification/settings       - Get notification settings
PUT    /notification/settings       - Update notification settings
```

#### Analytics (4)
```
POST   /analytics/event             - Track event
GET    /analytics/post/{post_id}    - Get post analytics
GET    /analytics/account           - Get account analytics
GET    /analytics/dashboard         - Get dashboard data
```

#### Additional Features (14)
```
POST   /block/{account_id}          - Block user
DELETE /block/{account_id}          - Unblock user
GET    /block                       - Get blocked users list

POST   /mute/{account_id}           - Mute user
DELETE /mute/{account_id}           - Unmute user
GET    /mute                        - Get muted users list

POST   /repost/{post_id}            - Create repost
DELETE /repost/{repost_id}          - Delete repost
GET    /post/{post_id}/reposts      - Get reposts list
GET    /account/{account_id}/reposts - Get user's reposts

POST   /report                      - Report content
GET    /report                      - Get reports (admin)

POST   /session                     - Create session
GET    /session                     - List account sessions
DELETE /session/{device_id}         - Logout session

GET    /hashtag/trending            - Get trending hashtags
GET    /hashtag/search              - Search by hashtag
```

### 1.3 Type Definitions Available
**File:** `/backend/src/types/api.ts` (1190 lines)

**Main Response Structures:**
- `ApiResponse<T>` - Generic response wrapper
- `PaginatedResponse<T>` - For list endpoints with pagination
- `AccountSummary` - User profile summary
- `PostItem` - Post data structure
- `ProductItem` - Product data structure
- `NotificationItem` - Notification data structure
- `RoomItem` - Room/community data structure

**Request/Response Pairs:**
- Authentication: SignUp, Login, ConfirmSignUp
- Posts: CreatePost, UpdatePost, GetTimeline, GetUserPosts
- Products: CreateProduct, UpdateProduct, TagProductOnPost, ClickProduct
- Live: CreateLiveStream, JoinLiveStream, SendLiveChat, SendGift
- Messaging: CreateConversation, SendMessage, GetMessages
- Analytics: TrackEvent, GetPostAnalytics, GetAccountAnalytics, GetDashboard

---

## 2. FRONTEND ARCHITECTURE

### 2.1 Project Structure
```
app/
├── (tabs)/                  # Main app screens
│   ├── index.tsx           # Feed (Home) - MAIN ENTRY
│   ├── shop.tsx            # Shop/Products
│   ├── live-tab.tsx        # Live Streaming
│   ├── room.tsx            # Rooms/Communities
│   ├── create.tsx          # Create post/product
│   ├── dm.tsx              # Direct Messages
│   ├── profile.tsx         # User Profile
│   ├── search.tsx          # Search
│   ├── activity.tsx        # Notifications/Activity
│   ├── user_search.tsx     # User Discovery
│   ├── dressup.tsx         # AI Dress-up
│   └── notification.tsx    # Notification Center

components/                 # 60+ Reusable components
├── Post.tsx               # Post card
├── ShoppingPost.tsx       # Shopping-enabled post
├── LiveStreamsList.tsx    # Live stream list
├── FavoritesGrid.tsx      # Favorites display
├── ProductCard.tsx        # Product card
├── ProfileHeader.tsx      # Profile section
├── PostCreationFlow.tsx   # Create post flow
├── AIDressUpModal.tsx     # AI dress-up feature
├── ImageCarousel.tsx      # Image gallery
└── ... (50+ more)

store/                     # Zustand state management
├── authStore.ts          # Authentication (Cognito integrated)
├── cartStore.ts          # Shopping cart (basic)
├── themeStore.ts         # Theme/dark mode
├── photoGalleryStore.ts  # Photo selection
└── favoritesStore.ts     # Favorites list

mocks/                     # Mock data (extensive)
├── posts.ts              # Sample posts
├── users.ts              # Sample users
├── products.ts           # Sample products
├── liveStreams.ts        # Sample live streams
├── shoppingPosts.ts      # Sample shopping posts
└── ... (10+ more files)

config/
└── aws-config.ts         # AWS Amplify configuration

constants/
├── colors.ts             # Theme colors
└── ... (other constants)
```

### 2.2 Screen Features Matrix

| Screen | Main Features | API Integration | Mock Data |
|--------|--------------|-----------------|-----------|
| **Feed (index)** | Timeline, posts, shopping, live streams | Minimal (getTimeline) | 80% mock |
| **Shop** | Browse products, filter, cart | 20% (getProducts) | 80% mock |
| **Live** | Watch/create live streams, chat, gifts | Partial (Mux webhook) | 70% mock |
| **Room** | Community posts, members, rules | Minimal (joinRoom) | 85% mock |
| **Create** | Post/product creation wizard | 30% (createPost, createProduct) | 70% mock |
| **DM** | Messages, conversations | 10% (mockMessages) | 95% mock |
| **Profile** | User profile, posts, stats, edit | 40% (getProfile, updateProfile) | 60% mock |
| **Search** | Find users, posts, hashtags | 5% (searchByHashtag) | 95% mock |
| **Activity** | Notifications, follows, comments | 20% (getNotifications) | 80% mock |
| **User Search** | Discover users, recommendations | 0% | 100% mock |
| **Dressup** | AI outfit generator | 0% (Google Generative AI only) | 100% mock |
| **Notification** | Notification list | 30% (getNotifications) | 70% mock |

### 2.3 Authentication Integration Status
**File:** `/store/authStore.ts` (563 lines)

**Currently Implemented:**
- ✅ Cognito User Pool integration (AWS Amplify v6)
- ✅ Sign up with email verification
- ✅ Sign in with username/password
- ✅ Password reset flow
- ✅ User profile refresh
- ✅ Onboarding state management
- ✅ Session persistence with AsyncStorage
- ✅ Web platform mock auth (development)

**Cognito Configuration:**
- User Pool ID: `ap-northeast-1_LKhwTdez4`
- Client ID: `4dvma3506cs34sfs1c59he8i2l`
- Region: `ap-northeast-1`
- API Endpoint: `https://b6om6sz99f.execute-api.ap-northeast-1.amazonaws.com/dev/`

---

## 3. INTEGRATION STATUS BY FEATURE

### 3.1 Core Social Features

#### Posting (40% integrated)
```
Backend Ready:      ✅ createPost, getPost, updatePost, deletePost
                   ✅ getTimeline, getUserPosts, getDiscoveryFeed
Frontend Status:    ⚠️ Components exist but use mock data
Storage:            ✅ DynamoDB with proper schemas
Expected Flow:      Create post → Call createPost → Update FlatList
Current Flow:       Create post → Update local state with mock data
```

#### Likes (30% integrated)
```
Backend Ready:      ✅ likePost, unlikePost, getPostLikes, getUserLikes
Frontend Status:    ✅ Like button in Post component (local state only)
Storage:            ✅ DynamoDB tracking with timestamps
Expected Flow:      Tap like → likePost API → Update UI counter
Current Flow:       Tap like → Update local component state
```

#### Comments (25% integrated)
```
Backend Ready:      ✅ createComment, deleteComment, getComments
Frontend Status:    ⚠️ Basic UI exists, no API integration
Storage:            ✅ DynamoDB with hierarchical structure
Expected Flow:      Write comment → createComment API → Refresh list
Current Flow:       No functional comment creation
```

#### Follow System (20% integrated)
```
Backend Ready:      ✅ followUser, unfollowUser, getFollowers, getFollowing
Frontend Status:    ⚠️ Follow button exists (visual only)
Storage:            ✅ DynamoDB with bi-directional indexes
Expected Flow:      Tap follow → followUser API → Update button state
Current Flow:       Visual toggle with no API call
```

### 3.2 Shopping Features (50% integrated)

#### Product Management (70% integrated)
```
Backend Ready:      ✅ createProduct, getProduct, updateProduct, deleteProduct
                   ✅ getProducts (with category/seller filters)
                   ✅ tagProductOnPost, getPostProducts
Frontend Status:    ✅ Shopping posts component
                   ✅ Product cards with images
                   ⚠️ No product creation UI yet
Storage:            ✅ DynamoDB with GSI for category/seller filtering
Expected Flow:      Shop view → getProducts → Display filtered list
Current Flow:       Shop view → Display mock product data
```

#### Cart Management (100% implemented - local)
```
Frontend Status:    ✅ Complete Zustand store
                   ✅ Add/remove items, quantity management
                   ✅ Persistent with AsyncStorage
Backend Status:     ❌ No cart service (expected)
Current Flow:       Cart actions → Local state → AsyncStorage
```

#### Product Clicks/Tracking (30% integrated)
```
Backend Ready:      ✅ clickProduct (increments counter)
Frontend Status:    ⚠️ No click tracking implemented
Storage:            ✅ DynamoDB counter table
Expected Flow:      User taps external link → clickProduct API
Current Flow:       No tracking
```

### 3.3 Live Streaming (10% integrated)
```
Backend Ready:      ✅ Full live service (Mux integration)
                   ✅ Stream CRUD, chat, gifts, moderation
Frontend Status:    ⚠️ LiveStreamsList component (mock data only)
                   ❌ No chat functionality
                   ❌ No gift sending
Storage:            ✅ DynamoDB + Mux service
Expected Flow:      Browse streams → getActiveLiveStreams → Join → WebSocket chat
Current Flow:       Browse mock live data → No interaction possible
```

### 3.4 DM/Messaging (5% integrated)
```
Backend Ready:      ✅ Full conversation service
                   ✅ Message CRUD, conversation management
Frontend Status:    ❌ Mock data list only (dm.tsx)
                   ❌ No real message sending
Storage:            ✅ DynamoDB with WebSocket support
Expected Flow:      Start DM → createConversation → sendMessage → WebSocket sync
Current Flow:       View mock message list → No functionality
```

### 3.5 Notifications (30% integrated)
```
Backend Ready:      ✅ Full notification service
                   ✅ Settings management, real-time events
Frontend Status:    ⚠️ Components exist but show mock data
                   ✅ Settings component
Storage:            ✅ DynamoDB with user preferences
Expected Flow:      Action happens → Backend fires event → getNotifications → Update UI
Current Flow:       Show mock notifications only
```

### 3.6 Rooms/Communities (15% integrated)
```
Backend Ready:      ✅ Full room service (CRUD, members, posts)
                   ✅ Room-specific posts, member management
Frontend Status:    ⚠️ Room component shows mock data
                   ❌ No room creation UI
Storage:            ✅ DynamoDB with room hierarchy
Expected Flow:      Browse rooms → joinRoom → View room posts → Post in room
Current Flow:       View mock room data → No room interaction
```

### 3.7 Analytics (0% integrated)
```
Backend Ready:      ✅ Complete analytics service
                   ✅ Event tracking, post analytics, dashboard
Frontend Status:    ❌ No analytics UI
Storage:            ✅ DynamoDB event tracking
Expected Flow:      User action → trackEvent → Dashboard → Display analytics
Current Flow:       No analytics features visible
```

---

## 4. STATE MANAGEMENT OVERVIEW

### 4.1 Zustand Stores

#### authStore.ts (563 lines) - ACTIVE
```typescript
Interface AuthStore {
  // State
  isAuthenticated: boolean          // JWT token status
  hasCompletedOnboarding: boolean   // Onboarding progress
  user: User | null                 // Current user object
  onboardingStep: number            // Step in onboarding flow
  isLoading: boolean                // Request loading state
  error: string | null              // Error messages

  // Actions
  signUp(params): Promise<void>     // Cognito registration
  confirmSignUp(username, code): Promise<void>
  signIn(username, password): Promise<void>  // Cognito login
  signOut(): Promise<void>          // Logout + clear AsyncStorage
  refreshUser(): Promise<void>      // Fetch latest user data
  forgotPassword(username): Promise<void>
  
  // Onboarding
  updateOnboardingStep(step): void
  saveOnboardingData(data): void
  completeOnboarding(): Promise<void>
  checkAuthStatus(): Promise<void>  // Startup auth check
}
```

**Platform Handling:**
- Web: Mock authentication (development only)
- iOS/Android: Real Cognito via AWS Amplify

**Storage Keys:**
- `@auth_token` - JWT token
- `@user_data` - User profile JSON
- `@onboarding_completed` - Boolean flag
- `@onboarding_step` - Current step number
- `@onboarding_data` - Form data during signup

#### cartStore.ts (103 lines) - PARTIAL
```typescript
Interface CartState {
  items: CartItem[]
  addItem(product, quantity)
  removeItem(itemId)
  updateQuantity(itemId, quantity)
  clearCart()
  getTotalPrice(): number
  getTotalItems(): number
}
```

**Status:** Fully functional for local state, no backend integration

#### themeStore.ts - IMPLEMENTED
```typescript
Interface ThemeStore {
  theme: 'light' | 'dark'
  setTheme(theme)
  toggleTheme()
}
```

**Usage:** Applied globally to all screens

#### photoGalleryStore.ts - BASIC
```typescript
Interface PhotoGalleryState {
  selectedPhotos: string[]
  addPhoto(uri)
  removePhoto(uri)
  clearPhotos()
}
```

**Usage:** Post creation flow photo selection

#### favoritesStore.ts - BASIC
```typescript
Interface FavoritesState {
  favorites: string[]  // Item IDs
  addFavorite(itemId)
  removeFavorite(itemId)
  isFavorited(itemId): boolean
}
```

**Status:** Local state only, no API sync

### 4.2 Missing Stores Needed
- `postsStore` - Timeline and post data caching
- `userStore` - User profiles and recommendations
- `productStore` - Product data and filtering
- `liveStore` - Active streams and chat state
- `notificationStore` - Notification queue
- `searchStore` - Search results cache

---

## 5. API CONFIGURATION

### 5.1 AWS Amplify Setup
**File:** `/config/aws-config.ts`

```typescript
// Cognito Configuration
const COGNITO_USER_POOL_ID = 'ap-northeast-1_LKhwTdez4'
const COGNITO_CLIENT_ID = '4dvma3506cs34sfs1c59he8i2l'
const COGNITO_REGION = 'ap-northeast-1'

// API Gateway
const API_URL = 'https://b6om6sz99f.execute-api.ap-northeast-1.amazonaws.com/dev/'

// Platform-specific handling
if (Platform.OS === 'web') {
  // Amplify skipped on web (OAuth listener error)
  // Use mock auth for development
} else {
  // iOS/Android: Full Amplify configuration
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: COGNITO_USER_POOL_ID,
        userPoolClientId: COGNITO_CLIENT_ID,
      },
    },
  })
}
```

### 5.2 Missing API Integration Layer
**What's Needed:**
```typescript
// Missing file: lib/api-client.ts
class ApiClient {
  baseURL = 'https://b6om6sz99f.execute-api.ap-northeast-1.amazonaws.com/dev/'
  
  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    token?: string
  ): Promise<T> {
    // Implementation
  }

  // Would expose:
  posts = {
    getTimeline: (limit, nextToken) => request<GetTimelineResponse>(...),
    createPost: (data) => request<CreatePostResponse>(...),
    // etc
  }

  products = {
    getProducts: (filters) => request<GetProductsResponse>(...),
    createProduct: (data) => request<CreateProductResponse>(...),
    // etc
  }

  // etc for all modules
}
```

---

## 6. FEATURE PRIORITY & INTEGRATION ORDER

### Phase 1: Core Social (Highest Priority)
1. **Feed Timeline** (40% → 100%)
   - Integrate getTimeline API
   - Replace mock posts with real data
   - Add infinite scroll with pagination

2. **Like System** (30% → 100%)
   - Connect like/unlike buttons to API
   - Update counters in real-time
   - Sync liked status in post cards

3. **Follow System** (20% → 100%)
   - Connect follow/unfollow buttons to API
   - Update follower counts
   - Reflect in profile screens

4. **Comments** (25% → 100%)
   - Build comment submission UI
   - Connect to createComment API
   - Add comment list with pagination
   - Implement nested replies

### Phase 2: Shopping (Medium Priority)
1. **Product Listing** (70% → 100%)
   - Connect getProducts with filters
   - Replace mock products
   - Add search/filter state management

2. **Product Detail** (0% → 100%)
   - Build detail screen
   - Connect to getProduct API
   - Track clicks with clickProduct API

3. **Checkout** (0% → 100%)
   - Build checkout flow
   - Integrate payment processor (Stripe/PayPal)
   - Order management

### Phase 3: Communication (Medium Priority)
1. **Direct Messages** (5% → 100%)
   - Build conversation list with real data
   - Implement message sending
   - Add WebSocket for real-time sync
   - Typing indicators

2. **Notifications** (30% → 100%)
   - Connect getNotifications API
   - Real-time notification updates
   - Notification settings

### Phase 4: Live & Communities (Lower Priority)
1. **Live Streaming** (10% → 100%)
   - Mux video integration
   - WebSocket chat
   - Gift sending

2. **Rooms/Communities** (15% → 100%)
   - Room discovery and joining
   - Room-specific posts
   - Member management

### Phase 5: Advanced (Future)
1. **Analytics** - Post/account analytics dashboard
2. **Search** - Global search implementation
3. **Recommendations** - ML-based recommendations
4. **Hashtags** - Trending hashtags integration

---

## 7. TECHNICAL DEBT & ISSUES

### 7.1 Architecture Issues
- **No API client abstraction** - Each screen imports directly from API Gateway
- **No error handling** - Network errors not properly managed
- **No offline support** - No caching/offline queue for actions
- **No real-time sync** - Most data is static mock
- **No request deduplication** - Same API could be called multiple times

### 7.2 State Management Issues
- **Too many stores** - Split across multiple Zustand instances
- **No data normalization** - Duplicate data across stores
- **No cache invalidation** - Stale data after mutations
- **Mock data mixed with real** - Hard to track what's real

### 7.3 Performance Issues
- **No pagination awareness** - Infinite scroll not implemented
- **No lazy loading** - All components render at once
- **Large mock datasets** - 16 mock files with 1000s of items
- **No image optimization** - Unsplash URLs loaded directly

### 7.4 Mobile-Specific Issues
- **Web platform limitations** - Cognito OAuth disabled on web
- **Deep linking incomplete** - Not all routes configured
- **Navigation duplication** - Some routes defined multiple times
- **Gesture handling basic** - Swipe gestures not fully implemented

---

## 8. TESTING INFRASTRUCTURE

### Current Status
- **Unit Tests:** None found
- **Integration Tests:** None found
- **E2E Tests:** None found
- **Mock Data:** 16 files (~2000 lines)

### What Should Be Added
```
tests/
├── unit/
│   ├── stores/
│   │   ├── authStore.test.ts
│   │   └── cartStore.test.ts
│   └── utils/
│       └── feedUtils.test.ts
├── integration/
│   ├── api/
│   │   ├── posts.test.ts
│   │   ├── products.test.ts
│   │   └── auth.test.ts
│   └── screens/
│       ├── feed.integration.test.ts
│       └── shop.integration.test.ts
└── e2e/
    ├── auth-flow.e2e.test.ts
    ├── post-creation.e2e.test.ts
    └── shopping.e2e.test.ts
```

---

## 9. KNOWN ENDPOINTS & PATHS

### API Gateway Base
```
https://b6om6sz99f.execute-api.ap-northeast-1.amazonaws.com/dev/
```

### Authentication Header
```
Authorization: Bearer {JWT_TOKEN}
x-account-id: {ACCOUNT_ID}  (fallback for development)
```

### Response Format (All Endpoints)
```json
{
  "success": boolean,
  "data": {
    // Depends on endpoint
  },
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}  // Optional
  }
}
```

### Pagination Pattern
```
Query Parameters:
  limit: number (default 20, max 100)
  nextToken: string (base64 encoded)

Response:
{
  "items": [...],
  "nextToken": "base64string|null",
  "total": number  // Optional
}
```

---

## 10. CRITICAL NEXT STEPS

### Week 1: Foundation
1. Create `lib/api-client.ts` with typed requests
2. Add error handling middleware
3. Create response/error interceptors
4. Setup request/response logging

### Week 2: Post Management
1. Integrate getTimeline in Feed screen
2. Replace post mock data with API
3. Implement infinite scroll pagination
4. Add like/unlike API integration
5. Test with real Cognito token

### Week 3: Shopping
1. Integrate getProducts in Shop screen
2. Add product filtering/search
3. Track product clicks
4. Build product detail screen

### Week 4: Polish
1. Add loading states
2. Error recovery flows
3. Offline detection
4. Empty state handling
5. Network retry logic

---

## APPENDIX: File Locations Reference

**Core Configuration:**
- `/config/aws-config.ts` - AWS Amplify setup
- `/app.json` - Expo configuration
- `/app.config.js` - Environment setup
- `/constants/colors.ts` - Theme definition

**Main Screens:**
- `/app/(tabs)/index.tsx` - Feed/Home (450+ lines)
- `/app/(tabs)/shop.tsx` - Shop/Products
- `/app/(tabs)/live-tab.tsx` - Live Streaming
- `/app/(tabs)/profile.tsx` - User Profile
- `/app/(tabs)/dm.tsx` - Direct Messages

**State Management:**
- `/store/authStore.ts` - Auth (Cognito integrated)
- `/store/cartStore.ts` - Shopping cart
- `/store/themeStore.ts` - Theme management

**Backend Types:**
- `/backend/src/types/api.ts` - API request/response types (1190 lines)
- `/backend/src/types/dynamodb.ts` - DynamoDB schema types
- `/backend/src/types/common.ts` - Shared type definitions

**Backend Handlers:**
- `/backend/src/handlers/` - 81 Lambda function handlers organized by feature

**Mock Data:**
- `/mocks/posts.ts` - 50+ sample posts
- `/mocks/users.ts` - 20+ sample users
- `/mocks/products.ts` - 50+ sample products
- `/mocks/liveStreams.ts` - 10+ sample live streams
- `/mocks/shoppingPosts.ts` - Shopping-enabled posts
- `+13 more mock files`

---

**Analysis Complete**
This codebase is architecture-complete but integration-incomplete. The backend is fully operational with 81 endpoints, but the frontend only utilizes ~30% of them, relying heavily on mock data for development/demonstration.

