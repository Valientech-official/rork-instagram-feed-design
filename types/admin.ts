/**
 * Admin Panel Type Definitions
 */

export type AccountType = 'user' | 'shop' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'banned';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';
export type ReportType = 'post' | 'user' | 'comment' | 'live';
export type ContentType = 'post' | 'comment' | 'user' | 'live';
export type FlagReason =
  | 'violence'
  | 'nudity'
  | 'spam'
  | 'hate_speech'
  | 'misinformation'
  | 'harassment';

// Dashboard Types
export interface DashboardMetrics {
  totalUsers: number;
  userGrowth: number;
  totalPosts: number;
  pendingReports: number;
  activeLiveStreams: number;
  dailyActiveUsers: number;
  postEngagementRate: number;
}

export interface ActivityItem {
  id: string;
  type: 'report' | 'user_join' | 'content_removed' | 'user_banned';
  message: string;
  timestamp: number;
}

export interface SystemHealth {
  apiStatus: 'healthy' | 'degraded' | 'down';
  dbStatus: 'healthy' | 'degraded' | 'down';
}

// Report Types
export interface Report {
  id: string;
  type: ReportType;
  status: ReportStatus;
  reason: string;
  reportedBy: {
    id: string;
    username: string;
    avatar: string;
  };
  reportedContent: {
    id: string;
    type: ReportType;
    preview: string;
    imageUrl?: string;
  };
  reportedUser: {
    id: string;
    username: string;
    avatar: string;
  };
  timestamp: number;
  description: string;
}

// User Management Types
export interface UserData {
  id: string;
  username: string;
  email: string;
  avatar: string;
  accountType: AccountType;
  status: UserStatus;
  followerCount: number;
  followingCount: number;
  postCount: number;
  joinedAt: number;
  lastActive: number;
  reportCount: number;
}

export interface UserStats {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  avgEngagement: number;
}

// Content Moderation Types
export interface FlaggedContent {
  id: string;
  contentId: string;
  type: ContentType;
  reason: FlagReason;
  aiConfidence: number;
  flaggedAt: number;
  content: {
    preview: string;
    imageUrl?: string;
    user: {
      id: string;
      username: string;
      avatar: string;
      previousViolations: number;
    };
  };
  metadata: {
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
  };
}

// Admin Actions
export type AdminAction =
  | 'approve'
  | 'remove'
  | 'warn'
  | 'suspend'
  | 'ban'
  | 'dismiss'
  | 'resolve';

export interface AdminActionRequest {
  actionType: AdminAction;
  targetId: string;
  reason?: string;
  duration?: number; // For temporary suspensions (in days)
}

export interface AdminActionResponse {
  success: boolean;
  message: string;
  updatedStatus?: UserStatus | ReportStatus;
}
