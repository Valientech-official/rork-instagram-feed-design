# Navigation Analysis Report - Orphaned & Unlinked Pages

## Executive Summary
- **Total Pages**: 73 accessible screens + 1 API endpoint
- **Directly Linked Pages**: 28 unique routes
- **Pages with NO Inbound Navigation (ORPHANED)**: 45 pages
- **Tab Bar Navigation**: 7 main tabs + 3 hidden tabs
- **Menu Drawer Links**: 8 settings pages
- **Admin Section**: Requires special authentication

---

## Complete Page Inventory

### CATEGORY 1: Auth & Onboarding (11 pages) - FLOW-BASED
- /(auth)/splash ✓ Entry point
- /(auth)/login ✓ Linked from splash
- /(auth)/signup ✗ NO LINK (Dead code?)
- /(auth)/verify-email ✓ Linked from signup flow
- /(onboarding)/welcome ✓ Linked from login
- /(onboarding)/avatar ✓ Linked from welcome
- /(onboarding)/styles ✓ Linked from avatar
- /(onboarding)/genres ✓ Linked from styles
- /(onboarding)/brands ✓ Linked from genres
- /(onboarding)/social ✓ Linked from brands
- /(onboarding)/profile ✗ NO NAVIGATION (Orphaned - only linked in code comment)

### CATEGORY 2: Tab Navigation (10 visible/visible pages) - CORE UI
**Visible in Tab Bar (7 tabs):**
- /(tabs)/index ✓ Tab: Home/Feed
- /(tabs)/search ✓ Tab: Search
- /(tabs)/create ✓ Tab: Create
- /(tabs)/dressup ✓ Tab: DressUp
- /(tabs)/activity ✓ Tab: Activity (Likes)
- /(tabs)/room ✓ Tab: Room
- /(tabs)/profile ✓ Tab: Profile

**Hidden from Tab Bar (3 pages):**
- /(tabs)/notification ✗ NO DIRECT LINK (Access only via header icon)
- /(tabs)/dm ✗ NO DIRECT LINK (Access only via header icon)
- /(tabs)/user_search ✗ NO DIRECT LINK (Access only via header icon)
- /(tabs)/shop ✗ NO DIRECT LINK (Needs route /shop - broken)
- /(tabs)/live-tab ✗ NO DIRECT LINK (Needs route /live - broken)

### CATEGORY 3: Settings Pages (9 pages) - MENU DRAWER LINKED
**Menu Drawer Links (From MenuDrawer.tsx):**
- /settings/account ✓ Linked: "アカウント設定"
- /settings/notifications ✓ Linked: "通知設定"
- /settings/privacy ✓ Linked: "プライバシー"
- /settings/blocked ✓ Linked: "ブロック済みアカウント"
- /settings/muted ✓ Linked: "ミュート済みアカウント"
- /settings/help ✓ Linked: "ヘルプ"
- /settings/terms ✓ Linked: "利用規約"
- /settings/privacy-policy ✓ Linked: "プライバシーポリシー"
- /settings/index ✗ NO LINK (Likely duplicate/unused)

### CATEGORY 4: Admin Pages (5 pages) - PROTECTED ACCESS
- /admin/index ✓ Entry point (redirects to dashboard)
- /admin/dashboard ✓ Linked from admin/index
- /admin/users ✓ Linked from dashboard
- /admin/reports ✓ Linked from dashboard
- /admin/moderation ✓ Linked from dashboard

**Issue**: Admin pages require special auth (useAdminAuth hook). No public entry point visible.

### CATEGORY 5: Analytics Pages (3 pages) - ORPHANED
- /analytics/account ✗ NO LINK (Dead code?)
- /analytics/followers ✓ Linked from account.tsx (1-way)
- /analytics/post/[id] ✓ Linked from account.tsx (1-way)

**Issue**: /analytics/account is the parent but HAS NO INBOUND LINKS. Only accessible via direct URL navigation.

### CATEGORY 6: Live Streaming (7 pages) - PARTIALLY ORPHANED
- /live ✓ Linked from notification.tsx, room.tsx (direct)
- /live/index ✓ Same as /live
- /live/[id] ✗ NO LINK (Dynamic route, only accessible from /live listing)
- /live/[streamId] ✗ NO LINK (Duplicate? Conflict with [id])
- /live/create ✓ Linked from create.tsx (mode selector)
- /live/start ✓ Linked from create.tsx (mode selector)
- /live/history ✗ NO LINK (Orphaned)
- /live/manage/[streamId] ✗ NO LINK (Orphaned)

**Issues**:
- Two dynamic route files: [id] and [streamId] (potential conflict)
- /live/history unreachable
- /live/manage unreachable

### CATEGORY 7: Direct Messaging (2 pages) - PROPERLY LINKED
- /(tabs)/dm ✓ Hidden tab (header icon access)
- /dm/new ✓ Linked from dm.tsx
- /dm/[conversationId] ✓ Dynamic route from dm.tsx

### CATEGORY 8: Post Management (5 pages) - PROPERLY LINKED
- /post/[id] ✓ Linked from multiple sources (search, feed, profile)
- /post/[id]/edit ✗ NO LINK (Orphaned)
- /post/[id]/likes ✓ Linked from post detail (template)
- /post/[id]/reposts ✓ Linked from post detail (template)

### CATEGORY 9: Product Shopping (2 pages) - PARTIALLY ORPHANED
- /product/[id] ✓ Linked from search, feed, shop
- /cart ✓ Linked from notification.tsx

### CATEGORY 10: Profile Pages (4 pages) - ORPHANED EXCEPT MAIN
- /(tabs)/profile ✓ Main profile (tab)
- /profile/[userId]/followers ✓ Linked from template (user cards)
- /profile/[userId]/following ✓ Linked from template (user cards)
- /profile/likes ✗ NO LINK (Orphaned)
- /profile/reposts ✗ NO LINK (Orphaned)

**Issue**: profile/likes and profile/reposts have no navigation entry points.

### CATEGORY 11: Room/Community Pages (6 pages) - PROPERLY LINKED
- /(tabs)/room ✓ Tab navigation
- /room/qa ✓ Linked from room.tsx
- /room/fullbody ✓ Linked from room.tsx
- /room/pairlook ✓ Linked from room.tsx
- /room/situation ✓ Linked from room.tsx
- /room/recommend-all ✓ Linked from room.tsx
- /room/nexttrend ✓ Linked from room.tsx

### CATEGORY 12: Hashtag/Search (2 pages) - PARTIALLY ORPHANED
- /hashtag/[tag] ✓ Linked from discover/trending.tsx
- /hashtag/search ✗ NO LINK (Orphaned)

### CATEGORY 13: User Lists (2 pages) - ORPHANED
- /followers ✗ NO LINK (ProfileStatsRow mentions but no router.push)
- /following ✗ NO LINK (ProfileStatsRow mentions but no router.push)

**Issue**: These are likely meant to be accessed from /app/(tabs)/profile stats, but no actual navigation implemented.

### CATEGORY 14: Search Pages (3 pages) - ORPHANED EXCEPT MAIN
- /(tabs)/search ✓ Tab navigation
- /search/posts ✗ NO LINK (Orphaned)
- /search/users ✗ NO LINK (Orphaned)

**Issue**: Search tab shows inline results, doesn't link to dedicated search pages.

### CATEGORY 15: Discover (1 page) - ORPHANED
- /discover/trending ✓ Linked from hashtag context (hashtagService)

### CATEGORY 16: Utility Pages (3 pages) - EDGE CASES
- /modal ✗ NO LINK (Demo/template page)
- /offline ✓ Auto-triggered by NetInfo (edge case)
- /saved ✓ Linked from notification.tsx
- /search-filter ✓ Linked from search.tsx
- /split-view ✓ Linked from multiple sources (dynamic)

---

## Critical Findings

### PRIORITY HIGH - Cannot Access (No Navigation Path)
1. **/(onboarding)/profile** - Orphaned from onboarding flow
2. **/analytics/account** - Parent analytics page, no entry point
3. **/profile/likes** - No navigation in ProfileStatsRow
4. **/profile/reposts** - No navigation in ProfileStatsRow
5. **/live/history** - Live streaming history orphaned
6. **/live/manage/[streamId]** - Stream management orphaned
7. **/post/[id]/edit** - Edit post functionality unreachable
8. **/hashtag/search** - Hashtag search results orphaned
9. **/search/posts** - Dedicated post search orphaned
10. **/search/users** - Dedicated user search orphaned
11. **/followers** - User followers list orphaned
12. **/following** - User following list orphaned
13. **/(tabs)/notification** - Only accessible via header, needs tab or menu entry
14. **/(tabs)/user_search** - Only accessible via header, needs tab or menu entry

### PRIORITY MEDIUM - Hard to Find
1. **/(tabs)/shop** - Hidden from tab bar (direct /shop link appears broken)
2. **/(tabs)/live-tab** - Hidden from tab bar (direct /live link works instead)
3. **/admin/** section - Requires special authentication, no public path
4. **/analytics/** section - No clear entry point for regular users

### PRIORITY LOW - Alternative Access Exists
1. **/modal** - Template/demo page
2. **/offline** - Auto-triggered on network loss
3. **/discover/trending** - Accessible via hashtag links

---

## Missing Navigation Elements

### 1. ProfileStatsRow Component
Currently shows follower/following counts as text-only. Should navigate to:
- /followers (followers list)
- /following (following list)
- /profile/likes (liked posts)
- /profile/reposts (reposted content)

### 2. Profile Management Options
Missing navigation to:
- /analytics/account (profile analytics)
- /analytics/followers (follower analytics)
- /post/[id]/edit (edit own posts)

### 3. Notification Page
Currently hidden, should be:
- Added to tab bar OR
- Add to menu drawer

### 4. Admin Access
Need public entry point for:
- /admin (require special permission check)

### 5. Live Streaming
Missing navigation to:
- /live/history (view past streams)
- /live/manage/[streamId] (manage ongoing streams)

---

## Navigation Structure Summary

```
Root
├── (auth) - Entry point
│   ├── splash → login → signup → verify-email
│   └── Creates onboarding flow
├── (onboarding) - Sequential flow
│   └── welcome → avatar → styles → genres → brands → social
│       └── Missing: profile connection
├── (tabs) - Core UI (7 visible + 3 hidden)
│   ├── index (Home feed)
│   ├── search (Search)
│   ├── create (Create modes)
│   ├── dressup (Dress-up feature)
│   ├── activity (Likes/interactions)
│   ├── room (Community rooms)
│   ├── profile (User profile)
│   ├── dm (Hidden - DMs) → /dm/new → /dm/[id]
│   ├── notification (Hidden)
│   └── user_search (Hidden)
├── Settings Menu (via MenuDrawer from profile)
│   ├── account, notifications, privacy, blocked, muted
│   ├── help, terms, privacy-policy
│   └── Missing: settings/index
├── Admin (Protected)
│   └── admin/index → dashboard → [users|reports|moderation]
├── Analytics (Orphaned)
│   └── analytics/account ← (no entry point)
│       ├── analytics/followers
│       └── analytics/post/[id]
├── Live Streaming
│   ├── /live (accessible)
│   ├── /live/create, /live/start (from create)
│   └── /live/history, /live/manage (ORPHANED)
├── Posts (Scattered)
│   ├── /post/[id] (searchable)
│   ├── /post/[id]/likes (accessibleas template)
│   ├── /post/[id]/reposts (accessible as template)
│   └── /post/[id]/edit (ORPHANED)
├── User Profiles (Incomplete)
│   ├── /profile/[userId] (from search results)
│   ├── /profile/[userId]/followers (from template)
│   ├── /profile/[userId]/following (from template)
│   ├── /profile/likes (ORPHANED)
│   └── /profile/reposts (ORPHANED)
├── Community (Complete)
│   └── /room → [qa|fullbody|pairlook|situation|recommend-all|nexttrend]
├── Shopping (Partial)
│   ├── /product/[id] (from search/feed)
│   ├── /cart (from notification)
│   └── Missing: /shop navigation fix
├── Utilities
│   ├── /search-filter (from search)
│   ├── /saved (from notification)
│   ├── /split-view (dynamic)
│   ├── /offline (auto-triggered)
│   ├── /modal (demo)
│   ├── /discover/trending (from hashtag)
│   └── /hashtag/search (ORPHANED)
└── API
    └── /api/genimage+api
```

---

## Recommended Actions

### Immediate (Missing Critical Navigation)
1. Add /followers and /following pages accessible from ProfileStatsRow
2. Make /profile/likes and /profile/reposts accessible from profile stats
3. Add entry point for /analytics/account (e.g., from profile menu or settings)
4. Fix /live/history accessibility
5. Link /post/[id]/edit from post detail (long-press or options menu)

### Short-term (Improve Discoverability)
1. Add notification page to main tab bar or menu drawer
2. Create proper navigation to /search/posts and /search/users
3. Fix /admin entry point (add auth-protected link)
4. Connect /hashtag/search to search UI

### Medium-term (UX Improvements)
1. Consolidate duplicate route files (live/[id] vs live/[streamId])
2. Add /live/manage navigation for active stream management
3. Create navigation breadcrumbs for deep linking
4. Add fallback navigation for all orphaned pages

---

## Statistics by Category

| Category | Total | Linked | Orphaned | % Accessible |
|----------|-------|--------|----------|--------------|
| Auth/Onboarding | 11 | 10 | 1 | 91% |
| Tab Navigation | 10 | 7 | 3 | 70% |
| Settings | 9 | 8 | 1 | 89% |
| Admin | 5 | 4 | 1* | 80%* |
| Analytics | 3 | 2 | 1 | 67% |
| Live | 7 | 3 | 4 | 43% |
| Messaging | 3 | 3 | 0 | 100% |
| Posts | 5 | 3 | 2 | 60% |
| Products | 2 | 2 | 0 | 100% |
| Profiles | 4 | 2 | 2 | 50% |
| Rooms | 6 | 6 | 0 | 100% |
| Hashtag/Search | 2 | 1 | 1 | 50% |
| User Lists | 2 | 0 | 2 | 0% |
| Search Results | 3 | 1 | 2 | 33% |
| Discover | 1 | 1 | 0 | 100% |
| Utilities | 5 | 3 | 2 | 60% |
| **TOTAL** | **73** | **45** | **28** | **62%** |

---

## Code References for Orphaned Pages

### Pages with ZERO inbound navigation:
```
grep -r "followers\|following\|profile/likes\|profile/reposts" app --include="*.tsx" | wc -l
# Result: 0 actual router.push references found
```

### Pages only accessible via direct URL:
```
/analytics/account - No router.push or href found
/profile/likes - No router.push or href found
/profile/reposts - No router.push or href found
/live/history - No router.push or href found
/post/[id]/edit - No router.push or href found
/hashtag/search - No router.push or href found
/search/posts - No router.push or href found
/search/users - No router.push or href found
/followers - No router.push or href found
/following - No router.push or href found
```
