# REVISED IMPLEMENTATION PLAN (External E-Commerce)

**Analysis Date:** 2025-11-09
**Current Screens:** 47
**Backend APIs:** 85+
**Model:** E-commerce via external links (no native checkout)

---

## SCOPE REDUCTION SUMMARY

### Original Missing Screens: 60+

### External Link Screens (NO WORK NEEDED): 18
- Checkout screen (external EC site)
- Payment screen (external)
- Order confirmation (external)
- Order history (external → seller dashboard)
- Order detail (external)
- Order tracking (external)
- Shipping management (external)
- Seller dashboard (external)
- Product management (external - create/edit/delete)
- Inventory management (external)
- Order management seller view (external)
- Sales analytics (external)
- Shop account application (external or simplified)
- Billing/Invoices (external)
- Return/Refund management (external)
- Payment processing (external)
- Tax/VAT management (external)
- Shipping label generation (external)

### **ACTUALLY NEED TO BUILD: 42 screens**

---

## MUST BUILD IN-APP (Priority Order)

### 🔴 CRITICAL - Week 1 (Day 1-7): Core Social Features

**Focus:** Make the app usable as a social platform first

#### 1. **Individual DM Conversation Screen** (`/dm/[userId]` or `/conversation/[conversationId]`)
**Why Critical:** DM list exists but users cannot read/send messages
- Message history display
- Send message input
- Message read receipts
- Typing indicator
- Real-time message updates
- **Backend:** `getMessages`, `sendMessage`, `createConversation`

#### 2. **New Message/Search Users Screen** (`/dm/new`)
**Why Critical:** Cannot start new conversations
- Search for users to message
- Start new conversation
- Recent conversations
- **Backend:** Search APIs, `createConversation`

#### 3. **Edit Post Screen** (`/post/[id]/edit`)
**Why Critical:** Basic user expectation - users should edit their content
- Edit caption
- Edit hashtags
- Update visibility
- Update room/category
- **Backend:** `updatePost`

#### 4. **Post Detail - Comments Section** (Enhancement to existing `/post/[id]`)
**Why Critical:** Posts exist but comment interaction is incomplete
- Comment list display
- Add comment input
- Reply to comments
- Like comments
- Delete own comments
- **Backend:** `getComments`, `createComment`, `deleteComment`

#### 5. **Hashtag Page** (`/hashtag/[tag]`)
**Why Critical:** Hashtags displayed but not clickable/browsable
- Posts with specific hashtag
- Hashtag follow option
- Related hashtags
- **Backend:** `searchByHashtag`

#### 6. **Trending Hashtags Page** (`/trending/hashtags`)
**Why Critical:** Content discovery is core social feature
- Trending hashtags list
- Click to view hashtag page
- **Backend:** `getTrendingHashtags`

#### 7. **Enhanced Explore/Discovery Screen** (`/explore` or enhance existing search)
**Why Critical:** Users need content discovery beyond followed accounts
- Curated discovery feed
- Category filters
- Trending content
- **Backend:** `getDiscoveryFeed`

---

### 🟡 IMPORTANT - Week 2 (Day 8-14): User Management & Enhanced Features

**Focus:** Profile management, privacy, and content management

#### 8. **Blocked Users List** (`/settings/blocked`)
**Why Important:** Privacy control
- List of blocked users
- Unblock action
- **Backend:** `getBlockList`, `unblockUser`

#### 9. **Muted Users List** (`/settings/muted`)
**Why Important:** Privacy control
- List of muted users
- Unmute action
- **Backend:** `getMutedUsers`, `unmuteUser`

#### 10. **Privacy Settings** (`/settings/privacy`)
**Why Important:** User privacy expectations
- Account visibility (public/private)
- Who can message me
- Who can tag me in posts
- Activity status
- Comment permissions

#### 11. **Notification Settings (Enhanced)** (`/settings/notifications`)
**Why Important:** Current settings are basic, need granular control
- Like notifications
- Comment notifications
- Follow notifications
- DM notifications
- Live stream notifications
- Per-channel control (push, email, in-app)
- **Backend:** `getNotificationSettings`, `updateNotificationSettings`

#### 12. **Account Security** (`/settings/security`)
**Why Important:** Security basics
- Change password
- Two-factor authentication setup
- Active sessions view
- **Backend:** `getAllAccountSessions`, `logoutSession`

#### 13. **Active Sessions Screen** (`/settings/sessions`)
**Why Important:** Security monitoring
- List active login sessions
- Device information
- Logout specific session
- Logout all other sessions
- **Backend:** `getAllAccountSessions`, `logoutSession`

#### 14. **Post Analytics Screen** (`/post/[id]/analytics`)
**Why Important:** Content creators need insights
- View counts
- Like/comment/share stats
- Reach metrics
- Product click tracking (if tagged)
- **Backend:** `getPostAnalytics`, `trackEvent`

#### 15. **Account Analytics Screen** (`/profile/analytics`)
**Why Important:** User growth insights
- Follower growth
- Engagement metrics
- Top posts
- Audience insights
- **Backend:** `getAccountAnalytics`

#### 16. **Dashboard/Insights Screen** (`/dashboard`)
**Why Important:** Overview of account performance
- Summary metrics
- Recent activity
- Quick stats
- **Backend:** `getDashboard`

---

### 🟡 IMPORTANT - Week 2 (continued): Room & Live Features

#### 17. **Create Room Screen** (`/room/create`)
**Why Important:** Users should create their own rooms
- Room name
- Room description
- Room image
- Room category
- Privacy settings
- **Backend:** `createRoom`

#### 18. **Edit Room Screen** (`/room/[id]/edit`)
**Why Important:** Room management
- Update room details
- Room settings
- Admin management
- **Backend:** `updateRoom`

#### 19. **Room Settings Screen** (`/room/[id]/settings`)
**Why Important:** Room moderation
- Room admins
- Moderation rules
- Member management
- Privacy settings

#### 20. **Room Members List** (`/room/[id]/members`)
**Why Important:** See who's in the room
- Member list with avatars
- Member roles (admin, moderator, member)
- Member actions (if admin)
- **Backend:** `getRoomMembers`

#### 21. **Live Stream Moderator Panel** (`/live/[id]/moderate`)
**Why Important:** Live stream moderation (for stream owner/mods)
- Manage chat
- Ban users
- Add moderators
- End stream controls
- **Backend:** `addModerator`, `banUserFromLive`

#### 22. **Live Stream Gifts UI** (`/live/[id]/gifts` or in-stream modal)
**Why Important:** Monetization for creators
- Gift selection
- Send gift animation
- Gift history
- **Backend:** `sendGift`

---

### 🔴 CRITICAL - Week 3 (Day 15-17): Admin & Moderation

**Focus:** Platform health and content moderation

#### 23. **Admin Dashboard** (`/admin/dashboard`)
**Why Critical:** Platform management
- Platform metrics overview
- User statistics
- Content moderation queue count
- System health indicators
- Quick actions

#### 24. **Report Management Screen** (`/admin/reports`)
**Why Critical:** Content moderation is essential
- Reported posts list
- Reported users list
- Report details
- Take action (remove/warn/ban)
- Resolve/dismiss reports
- Filter by status/type
- **Backend:** `getReports`

#### 25. **User Management (Admin)** (`/admin/users`)
**Why Critical:** User moderation
- User list with search/filters
- User details view
- Ban/suspend user
- Change account type
- View user activity

#### 26. **Content Moderation (Admin)** (`/admin/moderation`)
**Why Critical:** Keep platform safe
- Flagged content review
- Moderation actions
- Appeals system
- Content removal

---

### 🟢 NICE-TO-HAVE - Week 3 (Day 18-21): Enhanced Discovery & Content

**Focus:** Enhanced user experience and content discovery

#### 27. **Liked Posts Screen** (`/profile/likes`)
**Why Nice:** User content collection
- Posts user has liked
- Unlike action
- **Backend:** `getUserLikes`

#### 28. **Post Likes List Screen** (`/post/[id]/likes`)
**Why Nice:** Social proof and discovery
- See who liked a post
- Follow users from list
- **Backend:** `getPostLikes`

#### 29. **Reposted Posts Screen** (`/profile/reposts`)
**Why Nice:** User content sharing
- Posts user has reposted
- **Backend:** `getUserReposts`

#### 30. **Post Reposts List Screen** (`/post/[id]/reposts`)
**Why Nice:** See who shared content
- See who reposted
- **Backend:** `getPostReposts`

#### 31. **User Search Results Screen** (`/search/users`)
**Why Nice:** Dedicated user search (if current user_search tab is limited)
- Search by username/name
- Filters
- Follow actions

#### 32. **Post Search Results Screen** (`/search/posts`)
**Why Nice:** Content search
- Search by keyword
- Filter by date/room/type
- Advanced filters

#### 33. **Enhanced Search/Filter Screen** (Enhance existing `/search-filter.tsx`)
**Why Nice:** Better search UX
- Advanced filters
- Save search
- Recent searches

---

### 🟢 NICE-TO-HAVE - Additional Enhancements

#### 34. **Offline/No Connection Screen**
**Why Nice:** Better UX during network issues
- Offline indicator
- Retry action
- Cached content display

#### 35. **Empty States (Consistent)**
**Why Nice:** Better UX
- No posts yet
- No followers yet
- No messages yet
- No notifications yet
- Design system for empty states

#### 36. **Loading Skeletons (Consistent)**
**Why Nice:** Better perceived performance
- Skeleton screens for all major views
- Consistent loading patterns

#### 37. **Terms of Service** (`/legal/terms`)
**Why Nice:** Legal compliance
- Terms display
- Accept flow for new users

#### 38. **Privacy Policy** (`/legal/privacy`)
**Why Nice:** Legal compliance
- Privacy policy display
- GDPR compliance info

#### 39. **About/Help** (`/help`)
**Why Nice:** User support
- FAQ
- How-to guides
- Feature explanations

#### 40. **Contact Support** (`/support`)
**Why Nice:** User support
- Support request form
- Issue reporting
- Help ticket tracking

#### 41. **Report Flow Enhancement** (Modal/Screen)
**Why Nice:** Better reporting UX
- Report reasons
- Evidence upload
- Report status tracking
- **Backend:** `createReport`

#### 42. **Admin Analytics Dashboard** (`/admin/analytics`)
**Why Nice:** Platform insights
- Platform-wide metrics
- User growth charts
- Engagement stats
- Revenue overview (if applicable)

---

## EXTERNAL LINK INTEGRATION POINTS

### Where Users Navigate to External Sites

#### 1. **Product Detail Page** (`/product/[id]`)
**Current State:** Has "ECサイトで購入する" button
**Integration:** ✅ Already implemented
**Action:** Opens `product.externalUrl` via `Linking.openURL()`
**Use Case:** View product → Click "Buy Now" → Opens external EC site

#### 2. **Cart Page** (`/cart`)
**Current State:** Has checkout flow
**Needs Change:** Replace "Proceed to Checkout" with "外部サイトで購入を完了する"
**Integration:** Navigate to external EC cart/checkout URL
**Use Case:** View cart → Click to external checkout

#### 3. **Shop Management (Seller Actions)**
**Location:** Profile screen, settings, or dedicated "マイショップ" button
**Integration:** "ショップ管理ダッシュボードへ" button → Opens external seller dashboard
**Use Case:** Seller wants to manage products/orders → Opens external dashboard

#### 4. **Order History (Buyer)**
**Location:** Profile or settings
**Integration:** "注文履歴を見る" button → Opens external order history
**Use Case:** User wants to view past orders → Opens external order page

#### 5. **Order Tracking**
**Location:** Notification or order confirmation (if shown in-app)
**Integration:** "配送を追跡" button → Opens external tracking page
**Use Case:** User wants to track shipment → Opens external tracking

#### 6. **Product Creation (Seller)**
**Option 1:** In-app product listing flow → Syncs to external EC site (API integration)
**Option 2:** "商品を登録する" button → Opens external product creation page
**Recommendation:** Option 2 (simpler, less maintenance)

#### 7. **Shop Application (Become Seller)**
**Location:** Settings or profile
**Integration:** "ショップアカウント申請" button → Opens external application form
**Use Case:** User wants to become seller → Fills form on external site → Account upgraded

---

## WHAT WE DON'T NEED TO BUILD

### ✅ E-Commerce Checkout Flow (External)
- Checkout screen → External EC site
- Payment screen → External payment gateway
- Order confirmation → External order page
- Billing address → External checkout
- Shipping address → External checkout
- Payment method selection → External
- Cart summary → Optional (can keep for product tagging)

### ✅ Order Management (External)
- Order history → External order dashboard
- Order detail → External order page
- Order tracking → External tracking page
- Return/Refund → External support
- Invoice download → External order page
- Reorder → External EC site

### ✅ Seller Dashboard (External)
- Product management → External seller dashboard
- Create product → External product creation
- Edit product → External product editor
- Delete product → External product management
- Inventory management → External inventory system
- Stock alerts → External notifications
- SKU management → External inventory
- Sales analytics → External analytics dashboard
- Revenue charts → External analytics
- Order management (seller) → External order dashboard
- Fulfillment → External order processing
- Shipping labels → External shipping system
- Customer support → External support system

### ✅ Shop Account Management (External)
- Shop application → External application form
- Shop verification → External verification process
- Business info collection → External form
- Account upgrade → External admin action

### ✅ Payment Processing (External)
- Payment gateway → External (Stripe, Square, etc.)
- Refund processing → External
- Payment disputes → External
- Tax calculation → External EC site
- VAT handling → External

---

## IMPLEMENTATION EFFORT SAVED

**Original Estimate:** 60+ screens
**External Link Screens:** 18 screens
**Revised Estimate:** 42 screens

### **Time Saved: 8-10 days** (approximately 1.5 weeks)

### Complexity Reduction:
- No payment gateway integration (Stripe SDK, etc.)
- No order processing logic
- No inventory management system
- No shipping calculation
- No tax/VAT logic
- No seller analytics implementation
- No financial transaction handling
- Reduced security requirements (no payment data)
- Reduced compliance requirements (PCI-DSS not needed)

---

## REVISED 21-DAY TIMELINE

### **Week 1 (Day 1-7): Core Social Features**
**Goal:** Make the app functional as a social platform

**Day 1-2: DM & Messaging**
- Individual DM conversation screen
- New message/search users screen
- Real-time message integration
- Message read receipts

**Day 3-4: Post Management**
- Edit post screen
- Post detail comments enhancement
- Delete post confirmation
- Comment moderation (delete own comments)

**Day 5-6: Content Discovery**
- Hashtag page
- Trending hashtags page
- Enhanced explore/discovery screen
- Search improvements

**Day 7: Testing & Refinement**
- Test all social flows
- Fix bugs
- UX improvements

---

### **Week 2 (Day 8-14): User Management & Features**
**Goal:** Privacy, settings, and enhanced features

**Day 8-9: Privacy & Settings**
- Blocked users list
- Muted users list
- Privacy settings screen
- Enhanced notification settings
- Account security screen
- Active sessions screen

**Day 10-11: Analytics**
- Post analytics screen
- Account analytics screen
- Dashboard/insights screen
- Analytics API integration

**Day 12-13: Room Management**
- Create room screen
- Edit room screen
- Room settings screen
- Room members list
- Room moderation features

**Day 14: Live Stream Enhancements**
- Live stream moderator panel
- Live stream gifts UI
- Live stream settings

---

### **Week 3 (Day 15-21): Admin, Enhancements & Polish**
**Goal:** Platform management and final polish

**Day 15-17: Admin Panel**
- Admin dashboard
- Report management screen
- User management (admin)
- Content moderation (admin)
- Admin analytics dashboard

**Day 18-19: Enhanced Discovery & Content**
- Liked posts screen
- Post likes list screen
- Reposted posts screen
- Post reposts list screen
- Enhanced search screens

**Day 20: Legal & Support**
- Terms of service
- Privacy policy
- About/help screen
- Contact support
- Report flow enhancement

**Day 21: Final Polish & Testing**
- Offline/no connection screen
- Consistent empty states
- Loading skeletons
- E2E testing
- Bug fixes
- Performance optimization
- External link integration testing

---

## API INTEGRATION PRIORITY (Revised)

### 🔴 Week 1 - Critical Social APIs
**Timeline/Feed:**
- `getTimeline` - Main feed
- `getUserPosts` - User profiles
- `getRoomPosts` - Room content
- `getDiscoveryFeed` - Explore

**Messaging:**
- `getMessages` - Message history
- `sendMessage` - Send message
- `createConversation` - Start conversation
- `getConversations` - Conversation list

**Post Management:**
- `updatePost` - Edit posts
- `deletePost` - Delete posts
- `getPost` - Post detail
- `createPost` - Create posts

**Comments:**
- `getComments` - Comment list
- `createComment` - Add comment
- `deleteComment` - Delete comment

**Hashtags:**
- `searchByHashtag` - Hashtag page
- `getTrendingHashtags` - Trending

**Social Interactions:**
- `likePost` - Like action
- `unlikePost` - Unlike action
- `createRepost` - Repost action
- `deleteRepost` - Unrepost action

---

### 🟡 Week 2 - User Management & Features APIs
**Privacy:**
- `getBlockList` - Blocked users
- `blockUser` - Block action
- `unblockUser` - Unblock action
- `getMutedUsers` - Muted users
- `muteUser` - Mute action
- `unmuteUser` - Unmute action

**Settings:**
- `getNotificationSettings` - Notification prefs
- `updateNotificationSettings` - Update prefs
- `getAllAccountSessions` - Active sessions
- `logoutSession` - Logout session

**Analytics:**
- `trackEvent` - Event tracking
- `getPostAnalytics` - Post metrics
- `getAccountAnalytics` - Account metrics
- `getDashboard` - Dashboard data

**Room Management:**
- `createRoom` - Create room
- `updateRoom` - Edit room
- `getRoomMembers` - Member list
- `joinRoom` - Join room
- `leaveRoom` - Leave room

**Live Streaming:**
- `addModerator` - Add moderator
- `banUserFromLive` - Ban user
- `sendGift` - Send gift
- `getLiveChats` - Chat messages

---

### 🟢 Week 3 - Admin & Enhancement APIs
**Admin:**
- `getReports` - Report management
- Admin user management (if separate endpoints)
- Admin analytics (if separate endpoints)

**Content Discovery:**
- `getUserLikes` - Liked posts
- `getPostLikes` - Post likes list
- `getUserReposts` - Reposted posts
- `getPostReposts` - Post reposts list

**Reports:**
- `createReport` - Submit report
- `getReports` - View reports (admin)

**User Discovery:**
- User search endpoints
- Post search endpoints

---

## EXTERNAL LINK IMPLEMENTATION CHECKLIST

### Required Changes to Existing Screens:

#### 1. **Cart Screen** (`/cart.tsx`)
**Current:** "Proceed to Checkout" → in-app checkout (doesn't exist)
**New:** "外部サイトで購入を完了する" → Opens external EC site cart

```tsx
// Replace handleCheckout function
const handleCheckout = async () => {
  const externalCartUrl = 'https://ec-site.com/cart'; // Configure per shop
  await Linking.openURL(externalCartUrl);
};
```

#### 2. **Product Detail Screen** (`/product/[id].tsx`)
**Current:** ✅ Already has "ECサイトで購入する" button
**Action:** Verify implementation, add analytics tracking

```tsx
// Add click tracking
const handleGoToExternalSite = async () => {
  // Track product click
  await trackProductClick(product.id);

  if (product.externalUrl) {
    await Linking.openURL(product.externalUrl);
  }
};
```

#### 3. **Profile Screen** - Add Seller Dashboard Link
**New Section:** If user has `account_type === 'shop'`
**Action:** Add "ショップ管理ダッシュボード" button

```tsx
{accountType === 'shop' && (
  <TouchableOpacity onPress={handleOpenSellerDashboard}>
    <ExternalLink size={20} />
    <Text>ショップ管理ダッシュボードへ</Text>
  </TouchableOpacity>
)}
```

#### 4. **Settings Screen** - Add External Links Section
**New Sections:**
- "注文履歴を見る" → External order history
- "ショップアカウント申請" → External shop application (if not shop)

#### 5. **Shop Tab** (`/shop.tsx`)
**Enhancement:** Add informational banner
**Message:** "購入は外部ECサイトで完了します"

---

## PRODUCT DATA MODEL (In-App vs External)

### What's Stored In-App (DynamoDB):
```typescript
Product {
  id: string;
  name: string;
  description: string;
  images: string[]; // S3 URLs
  price: number;
  currency: 'JPY' | 'USD';
  category: string;
  tags: string[];
  seller: {
    id: string;
    username: string;
    avatar: string;
  };

  // CRITICAL: External link
  isExternal: true; // Always true
  externalUrl: string; // EC site product page
  shopName: string; // External shop name
  brand: string;

  // Display only (not for transaction)
  featured: boolean;
  rating: number;
  reviews: number;

  created_at: number;
  updated_at: number;
}
```

### What's Managed Externally:
- Inventory/stock levels
- Order processing
- Payment processing
- Shipping/fulfillment
- Returns/refunds
- Customer support
- Transaction history

### Integration Flow:
1. **User browses products** → In-app (Instagram-like feed)
2. **User views product detail** → In-app
3. **User clicks "Buy Now"** → Opens external EC site
4. **User completes purchase** → External EC site
5. **User tracks order** → External EC site
6. **User views order history** → External EC site

---

## TECHNICAL INTEGRATION REQUIREMENTS

### 1. **Deep Linking Configuration**
**Purpose:** Allow external EC site to deep link back to app

```typescript
// app.json or expo config
{
  "expo": {
    "scheme": "rork", // or your app scheme
    "ios": {
      "associatedDomains": ["applinks:rork.app"]
    },
    "android": {
      "intentFilters": [...]
    }
  }
}
```

### 2. **External URL Configuration**
**Options:**
- Environment variables for EC site URLs
- Per-shop configuration in database
- Global EC site domain

```typescript
// config/external-links.ts
export const EXTERNAL_LINKS = {
  EC_SITE_BASE: process.env.EXPO_PUBLIC_EC_SITE_URL,
  SELLER_DASHBOARD: process.env.EXPO_PUBLIC_SELLER_DASHBOARD_URL,
  ORDER_HISTORY: process.env.EXPO_PUBLIC_ORDER_HISTORY_URL,
  SHOP_APPLICATION: process.env.EXPO_PUBLIC_SHOP_APPLICATION_URL,
};
```

### 3. **Analytics Tracking**
**Track External Link Clicks:**
```typescript
// utils/analytics.ts
export const trackExternalLinkClick = async (
  linkType: 'product' | 'cart' | 'seller_dashboard' | 'order_history',
  productId?: string
) => {
  await trackEvent({
    event_type: 'external_link_click',
    metadata: {
      link_type: linkType,
      product_id: productId,
      timestamp: Date.now(),
    },
  });
};
```

### 4. **Product Click Tracking API**
**Backend Already Has:** `clickProduct` API
**Implementation:**
```typescript
// When user clicks product or "Buy Now"
const handleProductClick = async (productId: string) => {
  try {
    await API.post('clickProduct', {
      product_id: productId,
    });
  } catch (error) {
    console.error('Failed to track product click:', error);
  }
};
```

### 5. **Cart → External Checkout Flow**
**Option 1: Direct External Cart**
- Remove in-app cart entirely
- "Add to Cart" → Opens external EC site cart

**Option 2: In-App Cart for Display (Recommended)**
- Keep in-app cart for product tagging/wishlist
- "Checkout" → Exports cart to external EC site
- Requires: API to create external cart from in-app items

```typescript
// Option 2 implementation
const handleCheckout = async () => {
  const cartItems = useCartStore.getState().items;

  // Create external cart
  const externalCartUrl = await createExternalCart(cartItems);

  // Open external checkout
  await Linking.openURL(externalCartUrl);

  // Optional: Clear in-app cart
  useCartStore.getState().clearCart();
};
```

---

## COMMUNICATION STRATEGY

### User-Facing Messaging
**Key Messages:**
- "購入は外部ECサイトで完了します" (Purchases completed on external EC site)
- "安全な決済ページに移動します" (Moving to secure payment page)
- "ショップ管理は外部ダッシュボードで行います" (Shop management via external dashboard)

### UI Indicators:
- External link icon (⎘) next to all external buttons
- Confirmation dialog before leaving app: "外部サイトに移動しますか？"
- Back link in external site (if possible): "アプリに戻る"

---

## TESTING CHECKLIST

### External Link Flows:
- [ ] Product detail → "Buy Now" → Opens external site
- [ ] Cart → "Checkout" → Opens external cart/checkout
- [ ] Profile (seller) → "Manage Shop" → Opens seller dashboard
- [ ] Settings → "Order History" → Opens external orders
- [ ] Settings → "Shop Application" → Opens external form
- [ ] External site → Deep link back to app works
- [ ] Analytics tracking for all external clicks works
- [ ] Error handling when external URL fails
- [ ] Deep linking from external site back to app
- [ ] Offline behavior (show error if no connection)

---

## RISK ASSESSMENT

### Reduced Risks (Due to External E-Commerce):
- ✅ No PCI-DSS compliance needed (no payment data)
- ✅ No payment gateway integration complexity
- ✅ No order processing logic to maintain
- ✅ No inventory sync issues
- ✅ No financial transaction bugs
- ✅ No refund/return logic
- ✅ No shipping calculation errors
- ✅ No tax/VAT compliance

### New Risks (External Model):
- ⚠️ User experience friction (leaving app)
- ⚠️ Deep linking failures
- ⚠️ External site downtime (out of control)
- ⚠️ Product data sync (if product info changes on external site)
- ⚠️ Cart abandonment (higher due to app switch)
- ⚠️ User confusion about where to manage shop/orders

### Mitigation Strategies:
1. **Clear Communication:** Prominent messaging about external checkout
2. **Deep Linking:** Robust deep link back to app after purchase
3. **Error Handling:** Graceful handling of external link failures
4. **Analytics:** Track drop-off at external link points
5. **User Education:** Onboarding explaining external checkout flow
6. **Fallback:** If external site down, show error with retry option

---

## SUCCESS METRICS

### Week 1 Targets:
- ✅ DM conversations fully functional
- ✅ Post editing working
- ✅ Hashtag browsing working
- ✅ Discovery feed live
- ✅ All social APIs integrated

### Week 2 Targets:
- ✅ Privacy settings complete
- ✅ Analytics dashboards live
- ✅ Room management functional
- ✅ Live stream moderation working
- ✅ All user management APIs integrated

### Week 3 Targets:
- ✅ Admin panel operational
- ✅ Content moderation working
- ✅ All external links tested
- ✅ Legal pages live
- ✅ 100% backend API integration
- ✅ E2E testing complete
- ✅ Performance optimized
- ✅ Ready for production

---

## DEPLOYMENT READINESS

### External Link Configuration:
- [ ] EC site URLs configured (env variables)
- [ ] Seller dashboard URL configured
- [ ] Order history URL configured
- [ ] Shop application URL configured
- [ ] Deep linking configured (iOS + Android)
- [ ] Universal links configured
- [ ] App store listing mentions external checkout
- [ ] Privacy policy updated (mention external EC site)
- [ ] Terms of service updated

### API Readiness:
- [ ] All 85+ backend APIs tested
- [ ] External link tracking API integrated
- [ ] Product click tracking working
- [ ] Analytics APIs connected
- [ ] WebSocket for real-time features
- [ ] Rate limiting configured
- [ ] Error handling robust

### User Experience:
- [ ] External link messaging clear
- [ ] Confirmation dialogs before leaving app
- [ ] Error messages for failed external links
- [ ] Loading states during external link opens
- [ ] Deep link back to app working
- [ ] Onboarding explains external checkout

---

## CONCLUSION

**With external e-commerce model:**
- **Reduced scope:** 42 screens vs 60+ screens (30% reduction)
- **Time saved:** 8-10 days
- **Complexity reduced:** No payment processing, order management, inventory system
- **Security simplified:** No PCI-DSS compliance needed
- **Focus shift:** Social platform first, e-commerce as external integration
- **Risk reduction:** Fewer financial transaction bugs, compliance issues
- **Trade-off:** Slight UX friction (leaving app for checkout)

**Implementation becomes more feasible within 21-day timeline with focus on:**
1. Core social features (DM, posts, discovery)
2. User management (privacy, settings, analytics)
3. Platform moderation (admin panel)
4. External link integration (clean handoff to EC site)

**Final recommendation:**
- **Week 1:** Nail social features (critical for engagement)
- **Week 2:** Complete user management (trust & retention)
- **Week 3:** Admin panel + polish (operational readiness)
- **External E-Commerce:** Simple, clean integration with clear messaging

This approach makes the 21-day timeline achievable while maintaining high quality.
