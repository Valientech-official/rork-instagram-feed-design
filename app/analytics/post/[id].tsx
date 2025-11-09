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
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { ChevronLeft, Download, TrendingUp, Eye, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { getPostAnalytics, type TimeFrame } from '@/services/analyticsService';
import { profilePosts } from '@/mocks/profilePosts';

const { width } = Dimensions.get('window');

export default function PostAnalyticsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<TimeFrame>('7d');
  const [analytics, setAnalytics] = useState<any>(null);

  const post = profilePosts.find(p => p.id === id);

  useEffect(() => {
    loadAnalytics();
  }, [id, timeframe]);

  const loadAnalytics = async () => {
    if (!id || typeof id !== 'string') return;

    try {
      setLoading(true);
      const data = await getPostAnalytics(id, timeframe);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    Alert.alert('Export', 'Export functionality coming soon');
  };

  const renderTimeframeSelector = () => (
    <View style={styles.timeframeContainer}>
      {(['7d', '30d', '90d', 'all'] as TimeFrame[]).map((tf) => (
        <TouchableOpacity
          key={tf}
          style={[styles.timeframeButton, timeframe === tf && styles.timeframeButtonActive]}
          onPress={() => setTimeframe(tf)}
        >
          <Text style={[styles.timeframeText, timeframe === tf && styles.timeframeTextActive]}>
            {tf === '7d' ? '7 days' : tf === '30d' ? '30 days' : tf === '90d' ? '90 days' : 'All time'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMetricCard = (icon: any, label: string, value: string | number, color: string) => (
    <View style={styles.metricCard}>
      <View style={[styles.metricIconContainer, { backgroundColor: `${color}15` }]}>
        {icon}
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );

  const renderEngagementBreakdown = () => {
    if (!analytics?.engagement_breakdown) return null;

    const total = analytics.engagement_breakdown.reduce((sum: number, item: any) => sum + item.count, 0);

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Engagement Breakdown</Text>
        <View style={styles.pieChartContainer}>
          {analytics.engagement_breakdown.map((item: any, index: number) => {
            const percentage = ((item.count / total) * 100).toFixed(1);
            return (
              <View key={index} style={styles.pieChartItem}>
                <View style={styles.pieChartLegend}>
                  <View style={[styles.pieChartColor, { backgroundColor: item.color }]} />
                  <Text style={styles.pieChartLabel}>{item.type}</Text>
                </View>
                <View style={styles.pieChartBar}>
                  <View
                    style={[
                      styles.pieChartBarFill,
                      { width: `${percentage}%`, backgroundColor: item.color },
                    ]}
                  />
                </View>
                <Text style={styles.pieChartValue}>{item.count} ({percentage}%)</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderImpressionsChart = () => {
    if (!analytics?.impressions_over_time) return null;

    const maxCount = Math.max(...analytics.impressions_over_time.map((d: any) => d.count));

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Impressions Over Time</Text>
        <View style={styles.chartContainer}>
          {analytics.impressions_over_time.map((item: any, index: number) => {
            const height = (item.count / maxCount) * 120;
            const date = new Date(item.date);
            const label = timeframe === '7d' ? date.toLocaleDateString('en-US', { weekday: 'short' }) : `${date.getMonth() + 1}/${date.getDate()}`;

            return (
              <View key={index} style={styles.chartBar}>
                <View style={styles.chartBarContainer}>
                  <View style={[styles.chartBarFill, { height }]} />
                </View>
                <Text style={styles.chartLabel}>{label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderDemographics = () => {
    if (!analytics?.demographics) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Audience Demographics</Text>

        <View style={styles.demographicsSection}>
          <Text style={styles.demographicsSubtitle}>Age Groups</Text>
          {analytics.demographics.age_groups.map((item: any, index: number) => (
            <View key={index} style={styles.demographicsBar}>
              <Text style={styles.demographicsLabel}>{item.range}</Text>
              <View style={styles.demographicsBarContainer}>
                <View
                  style={[
                    styles.demographicsBarFill,
                    { width: `${(item.count / 5000) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.demographicsValue}>{item.count}</Text>
            </View>
          ))}
        </View>

        <View style={styles.demographicsSection}>
          <Text style={styles.demographicsSubtitle}>Gender</Text>
          {analytics.demographics.gender.map((item: any, index: number) => (
            <View key={index} style={styles.demographicsBar}>
              <Text style={styles.demographicsLabel}>{item.type}</Text>
              <View style={styles.demographicsBarContainer}>
                <View
                  style={[
                    styles.demographicsBarFill,
                    { width: `${(item.count / 5000) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.demographicsValue}>{item.count}</Text>
            </View>
          ))}
        </View>

        <View style={styles.demographicsSection}>
          <Text style={styles.demographicsSubtitle}>Top Locations</Text>
          {analytics.demographics.locations.slice(0, 5).map((item: any, index: number) => (
            <View key={index} style={styles.demographicsBar}>
              <Text style={styles.demographicsLabel}>{item.city}</Text>
              <View style={styles.demographicsBarContainer}>
                <View
                  style={[
                    styles.demographicsBarFill,
                    { width: `${(item.count / 3000) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.demographicsValue}>{item.count}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (!post) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Post not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Post Analytics',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
              <Download size={20} color={Colors.light.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Post Preview */}
        <View style={styles.postPreview}>
          <Image source={{ uri: post.imageUrl }} style={styles.postImage} contentFit="cover" />
          <View style={styles.postInfo}>
            <Text style={styles.postCaption} numberOfLines={2}>
              {post.caption || 'No caption'}
            </Text>
          </View>
        </View>

        {/* Timeframe Selector */}
        {renderTimeframeSelector()}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        ) : analytics ? (
          <>
            {/* Key Metrics */}
            <View style={styles.metricsGrid}>
              {renderMetricCard(
                <TrendingUp size={24} color={Colors.light.primary} />,
                'Total Reach',
                analytics.total_reach.toLocaleString(),
                Colors.light.primary
              )}
              {renderMetricCard(
                <Eye size={24} color="#34C759" />,
                'Impressions',
                analytics.impressions.toLocaleString(),
                '#34C759'
              )}
              {renderMetricCard(
                <Heart size={24} color={Colors.light.like} />,
                'Engagement Rate',
                `${analytics.engagement_rate}%`,
                Colors.light.like
              )}
            </View>

            <View style={styles.metricsGrid}>
              {renderMetricCard(
                <Heart size={24} color={Colors.light.like} />,
                'Likes',
                analytics.likes.toLocaleString(),
                Colors.light.like
              )}
              {renderMetricCard(
                <MessageCircle size={24} color={Colors.light.primary} />,
                'Comments',
                analytics.comments.toLocaleString(),
                Colors.light.primary
              )}
              {renderMetricCard(
                <Share2 size={24} color="#34C759" />,
                'Shares',
                analytics.shares.toLocaleString(),
                '#34C759'
              )}
              {renderMetricCard(
                <Bookmark size={24} color="#FFD700" />,
                'Saves',
                analytics.saves.toLocaleString(),
                '#FFD700'
              )}
            </View>

            {/* Impressions Chart */}
            {renderImpressionsChart()}

            {/* Engagement Breakdown */}
            {renderEngagementBreakdown()}

            {/* Demographics */}
            {renderDemographics()}
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No analytics data available</Text>
          </View>
        )}
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
  exportButton: {
    padding: 8,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
  },
  postPreview: {
    backgroundColor: Colors.light.cardBackground,
    marginBottom: 16,
  },
  postImage: {
    width: width,
    height: width,
  },
  postInfo: {
    padding: 16,
  },
  postCaption: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  timeframeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
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
  metricsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    gap: 4,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  chartBarFill: {
    backgroundColor: Colors.light.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 2,
  },
  chartLabel: {
    fontSize: 10,
    color: Colors.light.secondaryText,
  },
  pieChartContainer: {
    gap: 16,
  },
  pieChartItem: {
    gap: 8,
  },
  pieChartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pieChartColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pieChartLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  pieChartBar: {
    height: 8,
    backgroundColor: Colors.light.separator,
    borderRadius: 4,
    overflow: 'hidden',
  },
  pieChartBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  pieChartValue: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  demographicsSection: {
    marginBottom: 20,
  },
  demographicsSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  demographicsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  demographicsLabel: {
    fontSize: 13,
    color: Colors.light.text,
    width: 60,
  },
  demographicsBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.light.separator,
    borderRadius: 4,
    overflow: 'hidden',
  },
  demographicsBarFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
  },
  demographicsValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    width: 50,
    textAlign: 'right',
  },
});
