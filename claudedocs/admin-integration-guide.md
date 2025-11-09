# Admin Panel Integration Guide

## Quick Start

### 1. Add Admin Panel Access to Profile Screen

Add this button to the profile screen for admin users:

```typescript
// In your profile screen component
import { useRouter } from 'expo-router';

// Inside component
const router = useRouter();

// Check if user is admin
const isAdmin = user?.accountType === 'admin';

// Render admin button
{isAdmin && (
  <TouchableOpacity
    style={styles.adminButton}
    onPress={() => router.push('/admin/dashboard')}
  >
    <Shield size={20} color="#FFF" />
    <Text style={styles.adminButtonText}>Admin Panel</Text>
  </TouchableOpacity>
)}

// Styles
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

### 2. Backend API Integration

Replace mock data with actual API calls:

#### Dashboard
```typescript
// app/admin/dashboard.tsx
const loadDashboardData = async () => {
  try {
    const response = await fetch(`${API_URL}/admin/dashboard`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) throw new Error('Failed to load dashboard');

    const data = await response.json();
    setMetrics(data.metrics);
    setRecentActivity(data.activity);
    setSystemHealth(data.health);
  } catch (error) {
    console.error('Dashboard error:', error);
    Alert.alert('Error', 'Failed to load dashboard data');
  }
};
```

#### Reports
```typescript
// app/admin/reports.tsx
const loadReports = async (status?: ReportStatus) => {
  try {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);

    const response = await fetch(
      `${API_URL}/admin/reports?${params.toString()}`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` },
      }
    );

    const data = await response.json();
    setReports(data.reports);
  } catch (error) {
    console.error('Reports error:', error);
  }
};

const handleTakeAction = async (action: string, reportId: string) => {
  try {
    const response = await fetch(
      `${API_URL}/admin/report/${reportId}/action`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      }
    );

    if (!response.ok) throw new Error('Action failed');

    Alert.alert('Success', 'Action completed');
    loadReports(activeTab === 'all' ? undefined : activeTab);
  } catch (error) {
    Alert.alert('Error', 'Failed to complete action');
  }
};
```

#### Users
```typescript
// app/admin/users.tsx
const loadUsers = async () => {
  try {
    const params = new URLSearchParams();
    if (filterStatus !== 'all') params.append('status', filterStatus);
    if (filterType !== 'all') params.append('accountType', filterType);

    const response = await fetch(
      `${API_URL}/admin/users?${params.toString()}`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` },
      }
    );

    const data = await response.json();
    setUsers(data.users);
  } catch (error) {
    console.error('Users error:', error);
  }
};

const handleSuspendUser = async (userId: string) => {
  try {
    const response = await fetch(
      `${API_URL}/admin/user/${userId}/status`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'suspended' }),
      }
    );

    if (!response.ok) throw new Error('Suspend failed');

    Alert.alert('Success', 'User suspended');
    loadUsers();
  } catch (error) {
    Alert.alert('Error', 'Failed to suspend user');
  }
};
```

#### Moderation
```typescript
// app/admin/moderation.tsx
const loadFlaggedContent = async (type: ContentType) => {
  try {
    const params = new URLSearchParams({ type });
    if (filterReason !== 'all') params.append('reason', filterReason);
    if (filterConfidence > 0) {
      params.append('confidence', filterConfidence.toString());
    }

    const response = await fetch(
      `${API_URL}/admin/moderation/flagged?${params.toString()}`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` },
      }
    );

    const data = await response.json();
    setFlaggedContent(data.content);
  } catch (error) {
    console.error('Moderation error:', error);
  }
};

const handleApprove = async (contentId: string) => {
  try {
    const response = await fetch(
      `${API_URL}/admin/moderation/${contentId}/approve`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
      }
    );

    if (!response.ok) throw new Error('Approve failed');

    Alert.alert('Success', 'Content approved');
    loadFlaggedContent(activeTab);
  } catch (error) {
    Alert.alert('Error', 'Failed to approve content');
  }
};
```

### 3. Authentication Setup

Update the `useAdminAuth` hook:

```typescript
// hooks/useAdminAuth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAdminAuth() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      // Get current user from storage or API
      const userJson = await AsyncStorage.getItem('currentUser');
      if (!userJson) {
        router.replace('/');
        return;
      }

      const user = JSON.parse(userJson);

      // Validate with backend
      const response = await fetch(`${API_URL}/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      if (!response.ok) throw new Error('Validation failed');

      const validatedUser = await response.json();

      if (validatedUser.accountType !== 'admin') {
        router.replace('/');
      } else {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  return { isAdmin, loading };
}
```

### 4. Environment Setup

Create environment config:

```typescript
// config/env.ts
export const API_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://api.yourapp.com';

export const getAuthToken = async (): Promise<string | null> => {
  try {
    const userJson = await AsyncStorage.getItem('currentUser');
    if (!userJson) return null;

    const user = JSON.parse(userJson);
    return user.token;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
};
```

## Backend API Specifications

### Admin Dashboard Endpoint

**GET** `/admin/dashboard`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "metrics": {
    "totalUsers": 15234,
    "userGrowth": 12.5,
    "totalPosts": 89412,
    "pendingReports": 23,
    "activeLiveStreams": 8,
    "dailyActiveUsers": 4523,
    "postEngagementRate": 68.5
  },
  "activity": [
    {
      "id": "act_123",
      "type": "report",
      "message": "New report: Spam post",
      "timestamp": 1699564800
    }
  ],
  "health": {
    "apiStatus": "healthy",
    "dbStatus": "healthy"
  }
}
```

### Reports Endpoint

**GET** `/admin/reports`

**Query Parameters:**
- `status`: pending | resolved | dismissed | all
- `type`: post | user | comment | live
- `limit`: number (default: 20)
- `offset`: number (default: 0)

**Response:**
```json
{
  "reports": [
    {
      "id": "rep_123",
      "type": "post",
      "status": "pending",
      "reason": "Spam",
      "reportedBy": {
        "id": "usr_456",
        "username": "reporter1",
        "avatar": "https://..."
      },
      "reportedContent": {
        "id": "pst_789",
        "type": "post",
        "preview": "This is spam...",
        "imageUrl": "https://..."
      },
      "reportedUser": {
        "id": "usr_012",
        "username": "spammer",
        "avatar": "https://..."
      },
      "timestamp": 1699564800,
      "description": "Multiple promotional links"
    }
  ],
  "pagination": {
    "total": 145,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**POST** `/admin/report/:id/action`

**Body:**
```json
{
  "action": "remove" | "warn" | "ban"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Action completed",
  "updatedStatus": "resolved"
}
```

### Users Endpoint

**GET** `/admin/users`

**Query Parameters:**
- `status`: active | suspended | banned | all
- `accountType`: user | shop | admin | all
- `search`: string
- `limit`: number
- `offset`: number

**Response:**
```json
{
  "users": [
    {
      "id": "usr_123",
      "username": "johndoe",
      "email": "john@example.com",
      "avatar": "https://...",
      "accountType": "user",
      "status": "active",
      "followerCount": 1250,
      "followingCount": 890,
      "postCount": 145,
      "joinedAt": 1699564800,
      "lastActive": 1699651200,
      "reportCount": 0
    }
  ],
  "pagination": {
    "total": 15234,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

**GET** `/admin/user/:id`

**Response:**
```json
{
  "user": {
    "id": "usr_123",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": "https://...",
    "accountType": "user",
    "status": "active",
    "followerCount": 1250,
    "followingCount": 890,
    "postCount": 145,
    "joinedAt": 1699564800,
    "lastActive": 1699651200,
    "reportCount": 0
  },
  "stats": {
    "totalPosts": 145,
    "totalLikes": 3420,
    "totalComments": 890,
    "avgEngagement": 28.5
  }
}
```

**PUT** `/admin/user/:id/status`

**Body:**
```json
{
  "status": "active" | "suspended" | "banned"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User status updated",
  "updatedStatus": "suspended"
}
```

### Moderation Endpoint

**GET** `/admin/moderation/flagged`

**Query Parameters:**
- `type`: post | comment | user | live
- `reason`: violence | nudity | spam | hate_speech | misinformation | harassment
- `confidence`: 0.0 - 1.0 (minimum threshold)
- `limit`: number
- `offset`: number

**Response:**
```json
{
  "content": [
    {
      "id": "flg_123",
      "contentId": "pst_456",
      "type": "post",
      "reason": "spam",
      "aiConfidence": 0.92,
      "flaggedAt": 1699564800,
      "content": {
        "preview": "Buy now!...",
        "imageUrl": "https://...",
        "user": {
          "id": "usr_789",
          "username": "spammer",
          "avatar": "https://...",
          "previousViolations": 3
        }
      },
      "metadata": {
        "viewCount": 450,
        "likeCount": 12,
        "commentCount": 3
      }
    }
  ],
  "pagination": {
    "total": 87,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**POST** `/admin/moderation/:id/approve`

**Response:**
```json
{
  "success": true,
  "message": "Content approved"
}
```

**POST** `/admin/moderation/:id/remove`

**Response:**
```json
{
  "success": true,
  "message": "Content removed"
}
```

## Security Considerations

### 1. Token Validation
Always validate admin tokens on the backend:

```typescript
// Backend middleware
const requireAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await validateToken(token);

  if (!user || user.accountType !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  req.user = user;
  next();
};

// Apply to all admin routes
app.use('/admin/*', requireAdmin);
```

### 2. Audit Logging
Log all admin actions:

```typescript
// Backend
const logAdminAction = async (adminId, action, targetId, details) => {
  await db.adminLogs.create({
    adminId,
    action,
    targetId,
    details: JSON.stringify(details),
    timestamp: Date.now(),
    ipAddress: req.ip,
  });
};

// Usage
app.post('/admin/user/:id/ban', async (req, res) => {
  const userId = req.params.id;
  await banUser(userId);

  await logAdminAction(
    req.user.id,
    'ban_user',
    userId,
    { reason: req.body.reason }
  );

  res.json({ success: true });
});
```

### 3. Rate Limiting
Protect admin endpoints:

```typescript
// Backend
import rateLimit from 'express-rate-limit';

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each admin to 100 requests per window
  message: 'Too many admin requests',
});

app.use('/admin/*', adminLimiter);
```

## Testing

### Manual Testing Checklist

1. **Authentication**
   - [ ] Non-admin users cannot access admin routes
   - [ ] Admin users can access all routes
   - [ ] Expired tokens redirect to login

2. **Dashboard**
   - [ ] Metrics load correctly
   - [ ] Activity feed updates
   - [ ] System health accurate
   - [ ] Quick actions navigate properly

3. **Reports**
   - [ ] Search works
   - [ ] Filters apply
   - [ ] Detail modal shows correct data
   - [ ] Actions execute successfully
   - [ ] Confirmations appear

4. **Users**
   - [ ] Search finds users
   - [ ] Filters work
   - [ ] User details load
   - [ ] Actions work (suspend, ban, warn)
   - [ ] Account type changes apply

5. **Moderation**
   - [ ] Tabs switch correctly
   - [ ] Filters apply
   - [ ] Content displays properly
   - [ ] Actions work (approve, remove)
   - [ ] User actions work (warn, ban)

### Automated Testing

```typescript
// Example test
describe('Admin Dashboard', () => {
  it('should redirect non-admin users', async () => {
    const user = { accountType: 'user', token: 'test' };
    // Test implementation
  });

  it('should load metrics for admin users', async () => {
    const admin = { accountType: 'admin', token: 'admin_test' };
    // Test implementation
  });
});
```

## Troubleshooting

### Common Issues

1. **"Cannot access admin panel"**
   - Check user accountType
   - Verify token is valid
   - Check backend admin middleware

2. **"Data not loading"**
   - Check network connectivity
   - Verify API endpoints
   - Check backend logs
   - Validate response format

3. **"Actions failing"**
   - Check authorization headers
   - Verify request body format
   - Check backend permissions
   - Review error logs

4. **"Navigation not working"**
   - Verify route paths match
   - Check router.push() calls
   - Ensure expo-router is configured

## Next Steps

1. **Add to Profile Screen**
   - Add admin button for admin users
   - Test navigation

2. **Backend Setup**
   - Implement all endpoints
   - Add authentication middleware
   - Set up audit logging

3. **Integration**
   - Replace mock data with API calls
   - Test with real data
   - Handle errors gracefully

4. **Polish**
   - Add loading animations
   - Improve error messages
   - Add success notifications
   - Optimize performance

5. **Deploy**
   - Test in production
   - Monitor performance
   - Collect feedback
   - Iterate improvements
