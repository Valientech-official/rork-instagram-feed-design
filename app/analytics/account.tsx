import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import {
  ChevronLeft,
  TrendingUp,
  Users,
  Eye,
  Heart,
  BarChart3,
  Clock,
  MapPin,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { getAccountAnalytics, type TimeFrame } from '@/services/analyticsService';

const { width } = Dimensions.get('window');

export default function AccountAnalyticsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<TimeFrame>('30d');
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getAccountAnalytics(timeframe);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const renderTimeframeSelector = () => (
    <View style={styles.timeframeContainer}>
      {(['7d', '30d', '90d'] as TimeFrame[]).map((tf) => (
        <TouchableOpacity
          key={tf}
          style={[styles.timeframeButton, timeframe === tf && styles.timeframeButtonActive]}
          onPress={() => setTimeframe(tf)}
        >
          <Text style={[styles.timeframeText, timeframe === tf && styles.timeframeTextActive]}>
            {tf === '7d' ? '7 days' : tf === '30d' ? '30 days' : '90 days'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewCard = (
    icon: any,
    label: string,
    value: string | number,
    change?: number,
    color: string = Colors.light.primary
  ) => (
    <View style={styles.overviewCard}>
      <View style={[styles.overviewIconContainer, { backgroundColor: `${color}15` }]}>
        {icon}
      </View>
      <View style={styles.overviewInfo}>
        <Text style={styles.overviewLabel}>{label}</Text>
        <Text style={styles.overviewValue}>{value}</Text>
        {change !== undefined && (
          <Text style={[styles.overviewChange, { color: change >= 0 ? Colors.light.success : Colors.light.error }]}>
            {change >= 0 ? '+' : ''}{change}
          </Text>
        )}
      </View>
    </View>
  );

  const renderFollowerGrowthChart = () => {
    if (!analytics?.follower_growth_chart) return null;

    const maxCount = Math.max(...analytics.follower_growth_chart.map((d: any) => d.count));
    const minCount = Math.min(...analytics.follower_growth_chart.map((d: any) => d.count));
    const range = maxCount - minCount;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Follower Growth</Text>
          <TouchableOpacity onPress={() => router.push('/analytics/followers')}>
            <Text style={styles.cardLink}>See Details</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.lineChartContainer}>
          {analytics.follower_growth_chart.map((item: any, index: number) => {
            const height = range > 0 ? ((item.count - minCount) / range) * 100 : 50;
            const date = new Date(item.date);
            const showLabel = index % Math.ceil(analytics.follower_growth_chart.length / 6) === 0;

            return (
              <View key={index} style={styles.lineChartBar}>
                <View style={styles.lineChartPoint}>
                  <View style={[styles.lineChartDot, { bottom: `${height}%` }]} />
                </View>
                {showLabel && (
                  <Text style={styles.lineChartLabel}>
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTopPosts = () => {
    if (!analytics?.top_posts) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top Performing Posts</Text>
        <View style={styles.topPostsGrid}>
          {analytics.top_posts.map((post: any, index: number) => (
            <TouchableOpacity
              key={index}
              style={styles.topPostCard}
              onPress={() => router.push(`/analytics/post/${post.post_id}`)}
            >
              <Image source={{ uri: post.image_url }} style={styles.topPostImage} contentFit="cover" />
              <View style={styles.topPostOverlay}>
                <View style={styles.topPostStats}>
                  <View style={styles.topPostStat}>
                    <Heart size={14} color="#FFFFFF" fill="#FFFFFF" />
                    <Text style={styles.topPostStatText}>{post.likes.toLocaleString()}</Text>
                  </View>
                  <View style={styles.topPostStat}>
                    <Text style={styles.topPostEngagement}>{post.engagement_rate}%</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderAudienceInsights = () => {
    if (!analytics?.audience_insights) return null;

    return (
      <>
        {/* Gender Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Gender Breakdown</Text>
          <View style={styles.genderContainer}>
            {analytics.audience_insights.gender_breakdown.map((item: any, index: number) => {
              const total = analytics.audience_insights.gender_breakdown.reduce((sum: number, g: any) => sum + g.count, 0);
              const percentage = ((item.count / total) * 100).toFixed(1);

              return (
                <View key={index} style={styles.genderItem}>
                  <View style={styles.genderLegend}>
                    <View style={[styles.genderColor, { backgroundColor: item.color }]} />
                    <Text style={styles.genderLabel}>{item.type}</Text>
                  </View>
                  <View style={styles.genderBar}>
                    <View
                      style={[
                        styles.genderBarFill,
                        { width: `${percentage}%`, backgroundColor: item.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.genderValue}>{item.count} ({percentage}%)</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Age Distribution */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Age Distribution</Text>
          <View style={styles.ageChartContainer}>
            {analytics.audience_insights.age_distribution.map((item: any, index: number) => {
              const maxCount = Math.max(...analytics.audience_insights.age_distribution.map((d: any) => d.count));
              const height = (item.count / maxCount) * 120;

              return (
                <View key={index} style={styles.ageBar}>
                  <View style={styles.ageBarContainer}>
                    <View style={[styles.ageBarFill, { height }]} />
                  </View>
                  <Text style={styles.ageLabel}>{item.range}</Text>
                  <Text style={styles.ageValue}>{item.count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Top Locations */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Locations</Text>
          {analytics.audience_insights.top_locations.map((item: any, index: number) => {
            const maxCount = analytics.audience_insights.top_locations[0].count;
            const percentage = (item.count / maxCount) * 100;

            return (
              <View key={index} style={styles.locationItem}>
                <View style={styles.locationHeader}>
                  <MapPin size={16} color={Colors.light.secondaryText} />
                  <Text style={styles.locationCity}>{item.city}</Text>
                </View>
                <View style={styles.locationBarContainer}>
                  <View style={[styles.locationBarFill, { width: `${percentage}%` }]} />
                </View>
                <Text style={styles.locationCount}>{item.count.toLocaleString()}</Text>
              </View>
            );
          })}
        </View>

        {/* Active Hours */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Most Active Hours</Text>
          <View style={styles.hoursChartContainer}>
            {analytics.audience_insights.active_hours.filter((h: any) => h.hour % 3 === 0).map((item: any, index: number) => {
              const maxCount = Math.max(...analytics.audience_insights.active_hours.map((h: any) => h.count));
              const height = (item.count / maxCount) * 80;

              return (
                <View key={index} style={styles.hourBar}>
                  <View style={styles.hourBarContainer}>
                    <View style={[styles.hourBarFill, { height }]} />
                  </View>
                  <Text style={styles.hourLabel}>{item.hour}:00</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Active Days */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Most Active Days</Text>
          <View style={styles.daysChartContainer}>
            {analytics.audience_insights.active_days.map((item: any, index: number) => {
              const maxCount = Math.max(...analytics.audience_insights.active_days.map((d: any) => d.count));
              const height = (item.count / maxCount) * 100;

              return (
                <View key={index} style={styles.dayBar}>
                  <View style={styles.dayBarContainer}>
                    <View style={[styles.dayBarFill, { height }]} />
                  </View>
                  <Text style={styles.dayLabel}>{item.day}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </>
    );
  };

  const renderContentPerformance = () => {
    if (!analytics?.content_performance) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Content Performance</Text>
        <View style={styles.performanceGrid}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceValue}>{analytics.content_performance.total_posts}</Text>
            <Text style={styles.performanceLabel}>Total Posts</Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceValue}>{analytics.content_performance.avg_engagement}%</Text>
            <Text style={styles.performanceLabel}>Avg Engagement</Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceValue}>{(analytics.content_performance.avg_reach / 1000).toFixed(1)}K</Text>
            <Text style={styles.performanceLabel}>Avg Reach</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Account Analytics',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Timeframe Selector */}
        {renderTimeframeSelector()}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        ) : analytics ? (
          <>
            {/* Overview Cards */}
            <View style={styles.overviewGrid}>
              {renderOverviewCard(
                <Users size={24} color={Colors.light.primary} />,
                'Total Followers',
                analytics.total_followers.toLocaleString(),
                analytics.followers_growth,
                Colors.light.primary
              )}
              {renderOverviewCard(
                <Eye size={24} color="#34C759" />,
                'Profile Visits',
                analytics.profile_visits.toLocaleString(),
                undefined,
                '#34C759'
              )}
            </View>

            <View style={styles.overviewGrid}>
              {renderOverviewCard(
                <TrendingUp size={24} color="#FF9500" />,
                'Total Reach',
                (analytics.total_reach / 1000).toFixed(1) + 'K',
                undefined,
                '#FF9500'
              )}
              {renderOverviewCard(
                <Heart size={24} color={Colors.light.like} />,
                'Engagement Rate',
                `${analytics.engagement_rate}%`,
                undefined,
                Colors.light.like
              )}
            </View>

            {/* Follower Growth Chart */}
            {renderFollowerGrowthChart()}

            {/* Top Posts */}
            {renderTopPosts()}

            {/* Content Performance */}
            {renderContentPerformance()}

            {/* Audience Insights */}
            {renderAudienceInsights()}
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No analytics data available</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  backButton: {
    padding: 8,
  },
  timeframeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.light.separator,
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  timeframeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.secondaryText,
  },
  timeframeTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  errorContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
  },
  overviewGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  overviewCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  overviewIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewInfo: {
    flex: 1,
  },
  overviewLabel: {
    fontSize: 11,
    color: Colors.light.secondaryText,
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  overviewChange: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
  cardLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  lineChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 2,
  },
  lineChartBar: {
    flex: 1,
    alignItems: 'center',
  },
  lineChartPoint: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  lineChartDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  lineChartLabel: {
    fontSize: 8,
    color: Colors.light.secondaryText,
    marginTop: 4,
  },
  topPostsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  topPostCard: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  topPostImage: {
    width: '100%',
    aspectRatio: 1,
  },
  topPostOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 8,
  },
  topPostStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topPostStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topPostStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  topPostEngagement: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  genderContainer: {
    gap: 16,
  },
  genderItem: {
    gap: 8,
  },
  genderLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  genderColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  genderBar: {
    height: 8,
    backgroundColor: Colors.light.separator,
    borderRadius: 4,
    overflow: 'hidden',
  },
  genderBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  genderValue: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  ageChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    gap: 8,
  },
  ageBar: {
    flex: 1,
    alignItems: 'center',
  },
  ageBarContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  ageBarFill: {
    backgroundColor: Colors.light.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 2,
  },
  ageLabel: {
    fontSize: 11,
    color: Colors.light.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  ageValue: {
    fontSize: 10,
    color: Colors.light.secondaryText,
  },
  locationItem: {
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locationCity: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  locationBarContainer: {
    height: 8,
    backgroundColor: Colors.light.separator,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  locationBarFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
  },
  locationCount: {
    fontSize: 13,
    color: Colors.light.secondaryText,
  },
  hoursChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    gap: 4,
  },
  hourBar: {
    flex: 1,
    alignItems: 'center',
  },
  hourBarContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  hourBarFill: {
    backgroundColor: Colors.light.primary,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    minHeight: 2,
  },
  hourLabel: {
    fontSize: 9,
    color: Colors.light.secondaryText,
  },
  daysChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    gap: 8,
  },
  dayBar: {
    flex: 1,
    alignItems: 'center',
  },
  dayBarContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  dayBarFill: {
    backgroundColor: Colors.light.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 2,
  },
  dayLabel: {
    fontSize: 11,
    color: Colors.light.secondaryText,
    fontWeight: '600',
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  performanceItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.separator,
    borderRadius: 8,
  },
  performanceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    textAlign: 'center',
  },
});
