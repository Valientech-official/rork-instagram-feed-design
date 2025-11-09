# Admin Panel - Quick Reference Card

## File Paths

```
Screen Files:
  /app/admin/index.tsx          → Entry point
  /app/admin/dashboard.tsx      → Dashboard
  /app/admin/reports.tsx        → Reports
  /app/admin/users.tsx          → Users
  /app/admin/moderation.tsx     → Moderation

Utilities:
  /hooks/useAdminAuth.ts        → Auth hook
  /types/admin.ts               → Type defs

Documentation:
  /claudedocs/admin-panel-implementation.md
  /claudedocs/admin-integration-guide.md
  /claudedocs/admin-panel-summary.md
```

## Navigation Routes

```typescript
router.push('/admin')                  // → Dashboard
router.push('/admin/dashboard')        // Dashboard
router.push('/admin/reports')          // Reports
router.push('/admin/users')            // Users
router.push('/admin/moderation')       // Moderation
```

## Access Control

```typescript
// All screens use this:
import { useAdminAuth } from '@/hooks/useAdminAuth';

const { isAdmin, loading } = useAdminAuth();
if (loading) return <Loading />;
// Auto-redirects if not admin
```

## Add to Profile Screen

```typescript
import { Shield } from 'lucide-react-native';

{user?.accountType === 'admin' && (
  <TouchableOpacity
    style={styles.adminButton}
    onPress={() => router.push('/admin/dashboard')}
  >
    <Shield size={20} color="#FFF" />
    <Text style={styles.adminButtonText}>Admin Panel</Text>
  </TouchableOpacity>
)}

const styles = StyleSheet.create({
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9C27B0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
  },
  adminButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
```

## Backend API Checklist

```
Dashboard:
  [ ] GET /admin/dashboard
  [ ] GET /admin/activity

Reports:
  [ ] GET /admin/reports
  [ ] PUT /admin/report/:id
  [ ] POST /admin/report/:id/action

Users:
  [ ] GET /admin/users
  [ ] GET /admin/user/:id
  [ ] PUT /admin/user/:id/status
  [ ] PUT /admin/user/:id/type
  [ ] POST /admin/user/:id/warn

Moderation:
  [ ] GET /admin/moderation/flagged
  [ ] POST /admin/moderation/:id/approve
  [ ] POST /admin/moderation/:id/remove
  [ ] POST /admin/moderation/:id/warn
```

## Replace Mock Data Pattern

```typescript
// Find this pattern in all screens:
const mockData = [...];
setData(mockData);

// Replace with:
const response = await fetch(`${API_URL}/admin/endpoint`, {
  headers: { 'Authorization': `Bearer ${token}` },
});
const data = await response.json();
setData(data);
```

## Common Tasks

**Add new metric to dashboard:**
1. Update `DashboardMetrics` in `/types/admin.ts`
2. Update mock data in `loadDashboardData()`
3. Add metric card in dashboard JSX
4. Update backend endpoint

**Add new filter:**
1. Add state: `const [filter, setFilter] = useState('all')`
2. Add to filter modal options
3. Apply in useEffect filter logic
4. Update backend query params

**Add new action:**
1. Create handler function: `handleNewAction()`
2. Add button to detail modal
3. Add API call in handler
4. Add confirmation dialog
5. Update backend endpoint

## Color Reference

```typescript
// Status
Active:     #4BB543  (Green)
Suspended:  #FFD700  (Yellow)
Banned:     #FF3B30  (Red)
Pending:    #0095F6  (Blue)

// Account Types
User:       #0095F6  (Blue)
Shop:       #FF9800  (Orange)
Admin:      #9C27B0  (Purple)

// Metrics
Users:      #E3F2FD  (Light Blue)
Posts:      #FFF3E0  (Light Orange)
Reports:    #FFEBEE  (Light Red)
Streams:    #F3E5F5  (Light Purple)
```

## Type Imports

```typescript
import type {
  DashboardMetrics,
  ActivityItem,
  SystemHealth,
  Report,
  ReportStatus,
  ReportType,
  UserData,
  UserStats,
  FlaggedContent,
  ContentType,
  FlagReason,
} from '@/types/admin';
```

## Testing Commands

```bash
# Run app
npm start

# Type check
npx tsc --noEmit

# Test navigation
# 1. Login as admin user
# 2. Navigate to profile
# 3. Click "Admin Panel"
# 4. Test all screens
```

## Troubleshooting

**"Cannot access /admin"**
→ Check `accountType === 'admin'`

**"Data not loading"**
→ Check API endpoint URLs
→ Verify auth token in headers

**"Navigation not working"**
→ Verify route paths
→ Check expo-router config

**"Actions failing"**
→ Check request body format
→ Verify backend permissions

## Next Steps

1. [ ] Add admin button to Profile screen
2. [ ] Implement backend APIs (12 endpoints)
3. [ ] Replace mock data with API calls
4. [ ] Update useAdminAuth with real validation
5. [ ] Test with production data
6. [ ] Deploy and monitor

## Support

Full documentation: `/claudedocs/admin-*.md`
Type definitions: `/types/admin.ts`
Auth hook: `/hooks/useAdminAuth.ts`
