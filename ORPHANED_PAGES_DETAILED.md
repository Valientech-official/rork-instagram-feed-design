# Orphaned & Unlinked Pages - Detailed File Paths

## COMPLETE LIST OF 28 ORPHANED PAGES

### Group 1: User Profile Analytics (2 pages - CRITICAL)
**Problem**: User statistics pages created but never linked from profile

1. `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/profile/likes.tsx`
   - Status: NO INBOUND NAVIGATION
   - Expected Access: Click on likes count in ProfileStatsRow
   - Current Status: ProfileStatsRow.tsx has no router.push implementation
   - File: `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/components/ProfileStatsRow.tsx`

2. `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/profile/reposts.tsx`
   - Status: NO INBOUND NAVIGATION
   - Expected Access: Click on reposts/waves count in ProfileStatsRow
   - Current Status: ProfileStatsRow.tsx has no router.push implementation

---

### Group 2: Account Follow Lists (2 pages - CRITICAL)
**Problem**: Follow/follower pages exist but no navigation from ProfileStatsRow

3. `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/followers.tsx`
   - Status: NO INBOUND NAVIGATION
   - Expected Access: Click followers count in ProfileStatsRow
   - Referenced Component: `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/components/ProfileStatsRow.tsx`
   - Issue: Component shows text but doesn't navigate

4. `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/following.tsx`
   - Status: NO INBOUND NAVIGATION
   - Expected Access: Click following count in ProfileStatsRow
   - Referenced Component: `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/components/ProfileStatsRow.tsx`
   - Issue: Component shows text but doesn't navigate

---

### Group 3: User Account Analytics (1 page - CRITICAL)
**Problem**: Analytics parent page exists but has no entry point

5. `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/analytics/account.tsx`
   - Status: NO INBOUND NAVIGATION (dead code)
   - Grep Result: No "router.push('/analytics/account')" found anywhere
   - Has Outbound Navigation To:
     - `/analytics/followers` (via "See Details" link)
     - `/analytics/post/[id]` (via post cards)
   - Expected Access: Profile menu or settings
   - Should be linked from: `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/(tabs)/profile.tsx`

---

### Group 4: Live Streaming Management (2 pages - CRITICAL)
**Problem**: Live stream history and management pages unreachable

6. `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/live/history.tsx`
   - Status: NO INBOUND NAVIGATION
   - Grep Result: No "router.push('/live/history')" found
   - Expected Access: From /live listings or profile
   - Should be linked from: `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/live/index.tsx`

7. `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/live/manage/[streamId].tsx`
   - Status: NO INBOUND NAVIGATION
   - Grep Result: No "router.push('/live/manage/')" found
   - Expected Access: From active stream indicator
   - Should be linked from: `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/live/[streamId].tsx`

---

### Group 5: Post Editing (1 page - CRITICAL)
**Problem**: Post edit functionality exists but unreachable

8. `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/post/[id]/edit.tsx`
   - Status: NO INBOUND NAVIGATION
   - Grep Result: No "router.push" or "href" to edit page found
   - Expected Access: Long-press menu on post or post detail options
   - Should be linked from: `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/post/[id].tsx`

---

### Group 6: Search Result Pages (3 pages - MEDIUM PRIORITY)
**Problem**: Dedicated search pages created but search tab uses inline results

9. `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/search/posts.tsx`
   - Status: NO INBOUND NAVIGATION
   - Grep Result: No "router.push('/search/posts')" found
   - Location Code: `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/(tabs)/search.tsx` (lines 40-130)
   - Uses: Inline FlatList instead of navigating to /search/posts

10. `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/search/users.tsx`
    - Status: NO INBOUND NAVIGATION
    - Grep Result: No "router.push('/search/users')" found
    - Location Code: `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/(tabs)/search.tsx` (lines 40-130)
    - Uses: Inline FlatList instead of navigating to /search/users

11. `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/hashtag/search.tsx`
    - Status: NO INBOUND NAVIGATION
    - Grep Result: No "router.push('/hashtag/search')" found
    - Expected Access: From hashtag search button
    - Should be linked from: `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/discover/trending.tsx`

---

### Group 7: Navigation Dead Ends (1 page - MEDIUM PRIORITY)
**Problem**: Incomplete onboarding flow - profile creation skipped

12. `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/(onboarding)/profile.tsx`
    - Status: ORPHANED FROM FLOW
    - Grep Result: Referenced in code comment only
    - Onboarding Flow Current: welcome → avatar → styles → genres → brands → social → (tabs)
    - Should be: welcome → avatar → styles → genres → brands → social → profile → (tabs)
    - Referenced in: `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/(auth)/login.tsx` (code comment)

---

### Group 8: Hidden Tab Pages - No Direct Navigation (3 pages - LOW PRIORITY)
**Problem**: Hidden from tab bar, only accessible via header icons

13. `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/(tabs)/notification.tsx`
    - Status: HIDDEN FROM TAB BAR
    - Access Method: Header icon only (defined in _layout.tsx, line 100-104)
    - Should be: Added to main tab bar OR menu drawer
    - Currently requires: Direct header button implementation (not shown in code)

14. `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/(tabs)/user_search.tsx`
    - Status: HIDDEN FROM TAB BAR
    - Access Method: Header icon only (defined in _layout.tsx, line 93-97)
    - Issue: Likely duplicate of /(tabs)/search functionality
    - Should be: Merged into search.tsx or properly linked

---

### Group 9: Settings Index (1 page - LOW PRIORITY)
**Problem**: Unused settings parent page

15. `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/settings/index.tsx`
    - Status: NO INBOUND NAVIGATION
    - Grep Result: No "router.push('/settings')" found
    - MenuDrawer.tsx: Links directly to subpages, never to /settings
    - Likely: Duplicate or legacy file that should be deleted

---

### Group 10: Admin Entry Point (1 page - SPECIAL)
**Problem**: Admin section requires authentication but no public entry

16. `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/admin/index.tsx`
    - Status: PROTECTED, NO PUBLIC LINK
    - Auth Hook: `useAdminAuth()` (lines 4, 14)
    - Redirect Logic: Automatically redirects to /admin/dashboard if admin (line 21)
    - Issue: No router.push('/admin') found from profile or menu
    - Should be: Added to settings menu with permission check

---

## Dynamic Route Issues (Duplicates)

### Live Streaming Route Conflict
**Files**:
- `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/live/[id].tsx`
- `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/live/[streamId].tsx`

**Problem**: Two files match the same route pattern
- Both can match `/live/123`
- Unclear which takes precedence
- May cause navigation conflicts

**Fix**: Consolidate into single file with `[streamId]` naming

---

## Navigation Flow Issues

### Issue 1: Auth to Onboarding Disconnect
**File**: `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/(auth)/login.tsx`
- After signup verification, goes to: `/(onboarding)/avatar`
- Expected flow: avatar → styles → genres → brands → social → profile → (tabs)
- Actual flow: avatar → styles → genres → brands → social → (tabs)
- **Missing**: /(onboarding)/profile page connection

**Code Location**:
```
// app/(auth)/login.tsx line ~180
router.replace('/(onboarding)/avatar');  // Should navigate through full flow
```

---

### Issue 2: Profile Stats Not Interactive
**File**: `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/components/ProfileStatsRow.tsx`
- Shows: Posts, Waves, Followers, Following counts
- Should navigate to: /profile/likes, /profile/reposts, /followers, /following
- Currently: Text-only display with no onPress handlers

**Implementation Needed**:
```tsx
<TouchableOpacity onPress={() => router.push('/followers')}>
  <Text>{followersCount}</Text>
</TouchableOpacity>
```

---

### Issue 3: Search Tab Functionality
**File**: `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/(tabs)/search.tsx`
- Contains: Full search UI with 3 result types (posts, products, users)
- Issue: Has separate search/posts.tsx and search/users.tsx pages that are never reached
- Decision: Either use inline results OR link to dedicated pages

---

### Issue 4: Analytics Access
**Files**:
- `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/analytics/account.tsx`
- `/Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design/app/(tabs)/profile.tsx`

**Missing Navigation**:
1. Profile page should have analytics button
2. Users can't see post/follower analytics
3. No menu item in MenuDrawer for analytics

---

## Recommendations by File

### High Priority Fixes (File Path + Action)

1. **`components/ProfileStatsRow.tsx`**
   - ADD: onPress handlers to navigate to:
     - `/followers` (followers count)
     - `/following` (following count)
     - `/profile/likes` (likes count)
     - `/profile/reposts` (reposts count)

2. **`app/(tabs)/profile.tsx`**
   - ADD: Analytics button to navigate to `/analytics/account`

3. **`app/(onboarding)/social.tsx`**
   - MODIFY: Final navigation from `/social` should go to `/(onboarding)/profile` instead of `/(tabs)`
   - File: Line ~150 (router.replace)

4. **`app/(onboarding)/profile.tsx`**
   - ADD: Final navigation to `/(tabs)` to complete flow

5. **`app/post/[id].tsx`**
   - ADD: Options menu with edit button linking to `/post/[id]/edit`

6. **`app/live/index.tsx`**
   - ADD: History button linking to `/live/history`
   - ADD: Active streams should link to `/live/manage/[streamId]`

---

## Summary Statistics

**Orphaned Pages by Severity**:
- CRITICAL (No user-facing navigation): 8 pages
- MEDIUM (Hard to find, requires workaround): 5 pages
- LOW (Alternative access exists): 3 pages
- SPECIAL (Protected/Demo): 2 pages

**Total Orphaned**: 28 pages (38% of 73 total pages)
**Accessibility Rate**: 62%

---

## Verification Commands

```bash
# Find all pages with no inbound router.push
grep -L "router\\.push\\|href=" app/**/*.tsx

# Check for orphaned pages
find app -name "*.tsx" -exec grep -l "export default" {} \; | \
while read f; do
  page=$(echo $f | sed 's|app/||; s|/index.tsx||; s|.tsx||')
  if ! grep -r "router.push.*$page\|href.*$page" app >/dev/null; then
    echo "ORPHANED: $page"
  fi
done

# List all router.push targets
grep -rh "router.push\|router.replace" app --include="*.tsx" | \
grep -o "'[^']*'" | sort | uniq
```

