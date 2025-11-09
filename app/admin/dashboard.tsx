import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Users,
  FileText,
  AlertTriangle,
  Radio,
  TrendingUp,
  Activity,
  Shield,
  Database,
  ChevronRight,
  BarChart3,
} from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');

interface DashboardMetrics {
  totalUsers: number;
  userGrowth: number;
  totalPosts: number;
  pendingReports: number;
  activeLiveStreams: number;
  dailyActiveUsers: number;
  postEngagementRate: number;
}

interface ActivityItem {
  id: string;
  type: 'report' | 'user_join' | 'content_removed' | 'user_banned';
  message: string;
  timestamp: number;
}

interface SystemHealth {
  apiStatus: 'healthy' | 'degraded' | 'down';
  dbStatus: 'healthy' | 'degraded' | 'down';
}

export default function AdminDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const colors = Colors[theme];

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    userGrowth: 0,
    totalPosts: 0,
    pendingReports: 0,
    activeLiveStreams: 0,
    dailyActiveUsers: 0,
    postEngagementRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    apiStatus: 'healthy',
    dbStatus: 'healthy',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      // TODO: Replace with actual API calls
      // const response = await fetch('/admin/dashboard');
      // const data = await response.json();

      // Mock data
      setMetrics({
        totalUsers: 15234,
        userGrowth: 12.5,
        totalPosts: 89412,
        pendingReports: 23,
        activeLiveStreams: 8,
        dailyActiveUsers: 4523,
        postEngagementRate: 68.5,
      });

      setRecentActivity([
        {
          id: '1',
          type: 'report',
          message: 'New report: Spam post',
          timestamp: Date.now() - 300000,
        },
        {
          id: '2',
          type: 'user_join',
          message: 'New user registered',
          timestamp: Date.now() - 600000,
        },
        {
          id: '3',
          type: 'content_removed',
          message: 'Post removed: Violation',
          timestamp: Date.now() - 900000,
        },
      ]);

      setSystemHealth({
        apiStatus: 'healthy',
        dbStatus: 'healthy',
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const formatTimestamp = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return colors.success;
      case 'degraded':
        return colors.warning;
      case 'down':
        return colors.error;
      default:
        return colors.secondaryText;
    }
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>System Overview</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Metrics Cards */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: '#E3F2FD' }]}>
            <Users size={24} color="#0095F6" />
            <Text style={styles.metricValue}>
              {metrics.totalUsers.toLocaleString()}
            </Text>
            <Text style={styles.metricLabel}>Total Users</Text>
            <View style={styles.growthBadge}>
              <TrendingUp size={12} color={colors.success} />
              <Text style={[styles.growthText, { color: colors.success }]}>
                +{metrics.userGrowth}%
              </Text>
            </View>
          </View>

          <View style={[styles.metricCard, { backgroundColor: '#FFF3E0' }]}>
            <FileText size={24} color="#FF9800" />
            <Text style={styles.metricValue}>
              {metrics.totalPosts.toLocaleString()}
            </Text>
            <Text style={styles.metricLabel}>Total Posts</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: '#FFEBEE' }]}>
            <AlertTriangle size={24} color="#F44336" />
            <Text style={[styles.metricValue, { color: '#F44336' }]}>
              {metrics.pendingReports}
            </Text>
            <Text style={styles.metricLabel}>Pending Reports</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: '#F3E5F5' }]}>
            <Radio size={24} color="#9C27B0" />
            <Text style={styles.metricValue}>
              {metrics.activeLiveStreams}
            </Text>
            <Text style={styles.metricLabel}>Active Streams</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Activity size={20} color={colors.primary} />
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>
                    {metrics.dailyActiveUsers.toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>Daily Active Users</Text>
                </View>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <BarChart3 size={20} color={colors.primary} />
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>
                    {metrics.postEngagementRate}%
                  </Text>
                  <Text style={styles.statLabel}>Post Engagement Rate</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/admin/reports')}
            >
              <AlertTriangle size={24} color={colors.error} />
              <Text style={styles.actionText}>View Reports</Text>
              <ChevronRight size={18} color={colors.secondaryText} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/admin/users')}
            >
              <Users size={24} color={colors.primary} />
              <Text style={styles.actionText}>Manage Users</Text>
              <ChevronRight size={18} color={colors.secondaryText} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/admin/moderation')}
            >
              <Shield size={24} color={colors.warning} />
              <Text style={styles.actionText}>Content Moderation</Text>
              <ChevronRight size={18} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            {recentActivity.map((item) => (
              <View key={item.id} style={styles.activityItem}>
                <View style={styles.activityDot} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityMessage}>{item.message}</Text>
                  <Text style={styles.activityTime}>
                    {formatTimestamp(item.timestamp)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* System Health */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Health</Text>
          <View style={styles.healthCard}>
            <View style={styles.healthItem}>
              <Database size={20} color={colors.icon} />
              <Text style={styles.healthLabel}>API Status</Text>
              <View
                style={[
                  styles.healthBadge,
                  { backgroundColor: getHealthColor(systemHealth.apiStatus) },
                ]}
              >
                <Text style={styles.healthStatus}>
                  {systemHealth.apiStatus}
                </Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.healthItem}>
              <Database size={20} color={colors.icon} />
              <Text style={styles.healthLabel}>Database</Text>
              <View
                style={[
                  styles.healthBadge,
                  { backgroundColor: getHealthColor(systemHealth.dbStatus) },
                ]}
              >
                <Text style={styles.healthStatus}>
                  {systemHealth.dbStatus}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.secondaryText,
      marginTop: 4,
    },
    backButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    backButtonText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
    },
    scrollContent: {
      padding: 16,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    metricCard: {
      width: (width - 48) / 2,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    metricValue: {
      fontSize: 28,
      fontWeight: '700',
      color: '#111',
      marginTop: 8,
    },
    metricLabel: {
      fontSize: 13,
      color: '#666',
      marginTop: 4,
    },
    growthBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 4,
    },
    growthText: {
      fontSize: 12,
      fontWeight: '600',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    statsCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statRow: {
      paddingVertical: 8,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    statInfo: {
      flex: 1,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    statLabel: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 2,
    },
    statDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    actionsGrid: {
      gap: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    actionText: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    activityCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
      gap: 12,
    },
    activityDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      marginTop: 6,
    },
    activityContent: {
      flex: 1,
    },
    activityMessage: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 4,
    },
    activityTime: {
      fontSize: 12,
      color: colors.secondaryText,
    },
    healthCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    healthItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      gap: 12,
    },
    healthLabel: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    healthBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    healthStatus: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFF',
      textTransform: 'capitalize',
    },
  });
