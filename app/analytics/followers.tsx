import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import {
  ChevronLeft,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  UserCheck,
  Building2,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { getFollowerAnalytics, type TimeFrame } from '@/services/analyticsService';

export default function FollowerAnalyticsScreen() {
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
      const data = await getFollowerAnalytics(timeframe);
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

  const renderGrowthChart = () => {
    if (!analytics?.follower_growth) return null;

    const maxNew = Math.max(...analytics.follower_growth.map((d: any) => d.new_followers));
    const maxUnfollow = Math.max(...analytics.follower_growth.map((d: any) => d.unfollowers));
    const maxValue = Math.max(maxNew, maxUnfollow);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Follower Growth</Text>
          <View style={styles.netChangeContainer}>
            {analytics.net_change >= 0 ? (
              <TrendingUp size={16} color={Colors.light.success} />
            ) : (
              <TrendingDown size={16} color={Colors.light.error} />
            )}
            <Text
              style={[
                styles.netChangeText,
                { color: analytics.net_change >= 0 ? Colors.light.success : Colors.light.error },
              ]}
            >
              {analytics.net_change >= 0 ? '+' : ''}{analytics.net_change}
            </Text>
          </View>
        </View>

        <View style={styles.growthLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: Colors.light.success }]} />
            <Text style={styles.legendText}>New Followers</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: Colors.light.error }]} />
            <Text style={styles.legendText}>Unfollowers</Text>
          </View>
        </View>

        <View style={styles.growthChartContainer}>
          {analytics.follower_growth.map((item: any, index: number) => {
            const newHeight = (item.new_followers / maxValue) * 100;
            const unfollowHeight = (item.unfollowers / maxValue) * 100;
            const date = new Date(item.date);
            const showLabel = index % Math.ceil(analytics.follower_growth.length / 6) === 0;

            return (
              <View key={index} style={styles.growthBar}>
                <View style={styles.growthBarContainer}>
                  <View style={[styles.growthBarNew, { height: `${newHeight}%` }]} />
                  <View style={[styles.growthBarUnfollow, { height: `${unfollowHeight}%` }]} />
                </View>
                {showLabel && (
                  <Text style={styles.growthLabel}>
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

  const renderEngagedFollowers = () => {
    if (!analytics?.most_engaged_followers) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Most Engaged Followers</Text>
        {analytics.most_engaged_followers.map((follower: any, index: number) => (
          <TouchableOpacity
            key={index}
            style={styles.followerItem}
            onPress={() => console.log('Navigate to user profile')}
          >
            <Image
              source={{ uri: follower.avatar_url }}
              style={styles.followerAvatar}
              contentFit="cover"
            />
            <View style={styles.followerInfo}>
              <Text style={styles.followerUsername}>{follower.username}</Text>
              <Text style={styles.followerEngagement}>
                {follower.engagement_count} interactions
              </Text>
            </View>
            <View style={styles.followerRank}>
              <Text style={styles.followerRankText}>#{index + 1}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderLocationDemographics = () => {
    if (!analytics?.demographics?.locations) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Follower Locations</Text>
        {analytics.demographics.locations.map((location: any, index: number) => {
          const maxCount = analytics.demographics.locations[0].count;
          const percentage = (location.count / maxCount) * 100;

          return (
            <View key={index} style={styles.locationItem}>
              <View style={styles.locationHeader}>
                <MapPin size={16} color={Colors.light.secondaryText} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationCity}>{location.city}</Text>
                  <Text style={styles.locationCountry}>{location.country}</Text>
                </View>
              </View>
              <View style={styles.locationBarContainer}>
                <View style={[styles.locationBarFill, { width: `${percentage}%` }]} />
              </View>
              <Text style={styles.locationCount}>{location.count.toLocaleString()}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderAgeGenderDemographics = () => {
    if (!analytics?.demographics?.age_gender) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Age & Gender Distribution</Text>
        {analytics.demographics.age_gender.map((item: any, index: number) => {
          const total = item.male + item.female + item.other;
          const malePercentage = (item.male / total) * 100;
          const femalePercentage = (item.female / total) * 100;
          const otherPercentage = (item.other / total) * 100;

          return (
            <View key={index} style={styles.ageGenderItem}>
              <Text style={styles.ageGenderLabel}>{item.age_range}</Text>
              <View style={styles.ageGenderBar}>
                <View
                  style={[styles.ageGenderSegment, { width: `${malePercentage}%`, backgroundColor: '#0095F6' }]}
                />
                <View
                  style={[styles.ageGenderSegment, { width: `${femalePercentage}%`, backgroundColor: '#FF3B30' }]}
                />
                <View
                  style={[styles.ageGenderSegment, { width: `${otherPercentage}%`, backgroundColor: '#8E8E8E' }]}
                />
              </View>
              <View style={styles.ageGenderStats}>
                <Text style={styles.ageGenderStat}>M: {item.male}</Text>
                <Text style={styles.ageGenderStat}>F: {item.female}</Text>
                <Text style={styles.ageGenderStat}>O: {item.other}</Text>
              </View>
            </View>
          );
        })}
        <View style={styles.genderLegend}>
          <View style={styles.genderLegendItem}>
            <View style={[styles.genderLegendColor, { backgroundColor: '#0095F6' }]} />
            <Text style={styles.genderLegendText}>Male</Text>
          </View>
          <View style={styles.genderLegendItem}>
            <View style={[styles.genderLegendColor, { backgroundColor: '#FF3B30' }]} />
            <Text style={styles.genderLegendText}>Female</Text>
          </View>
          <View style={styles.genderLegendItem}>
            <View style={[styles.genderLegendColor, { backgroundColor: '#8E8E8E' }]} />
            <Text style={styles.genderLegendText}>Other</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderAccountTypes = () => {
    if (!analytics?.demographics?.account_types) return null;

    const total = analytics.demographics.account_types.reduce((sum: number, type: any) => sum + type.count, 0);

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Types</Text>
        {analytics.demographics.account_types.map((type: any, index: number) => {
          const percentage = ((type.count / total) * 100).toFixed(1);
          const icon =
            type.type === 'Business' ? (
              <Building2 size={20} color={Colors.light.primary} />
            ) : type.type === 'Creator' ? (
              <UserCheck size={20} color="#FF9500" />
            ) : (
              <Users size={20} color={Colors.light.secondaryText} />
            );

          return (
            <View key={index} style={styles.accountTypeItem}>
              <View style={styles.accountTypeHeader}>
                {icon}
                <Text style={styles.accountTypeLabel}>{type.type}</Text>
              </View>
              <View style={styles.accountTypeBarContainer}>
                <View style={[styles.accountTypeBarFill, { width: `${percentage}%` }]} />
              </View>
              <Text style={styles.accountTypeValue}>
                {type.count.toLocaleString()} ({percentage}%)
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderEngagementSegments = () => {
    if (!analytics?.engagement_by_segment) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Engagement by Segment</Text>
        {analytics.engagement_by_segment.map((segment: any, index: number) => {
          const maxEngagement = Math.max(...analytics.engagement_by_segment.map((s: any) => s.avg_engagement));
          const percentage = (segment.avg_engagement / maxEngagement) * 100;
          const color =
            segment.segment === 'High Engagement'
              ? Colors.light.success
              : segment.segment === 'Medium Engagement'
              ? '#FF9500'
              : Colors.light.error;

          return (
            <View key={index} style={styles.segmentItem}>
              <Text style={styles.segmentLabel}>{segment.segment}</Text>
              <View style={styles.segmentBarContainer}>
                <View style={[styles.segmentBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
              </View>
              <Text style={styles.segmentValue}>{segment.avg_engagement}%</Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Follower Analytics',
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
        {/* Timeframe Selector */}
        {renderTimeframeSelector()}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        ) : analytics ? (
          <>
            {/* Follower Growth Chart */}
            {renderGrowthChart()}

            {/* Most Engaged Followers */}
            {renderEngagedFollowers()}

            {/* Location Demographics */}
            {renderLocationDemographics()}

            {/* Age & Gender Demographics */}
            {renderAgeGenderDemographics()}

            {/* Account Types */}
            {renderAccountTypes()}

            {/* Engagement Segments */}
            {renderEngagementSegments()}
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
  exportButton: {
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
  netChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.background,
    borderRadius: 16,
  },
  netChangeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  growthLegend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: Colors.light.secondaryText,
  },
  growthChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 2,
  },
  growthBar: {
    flex: 1,
    alignItems: 'center',
  },
  growthBarContainer: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 1,
    marginBottom: 4,
  },
  growthBarNew: {
    width: '45%',
    backgroundColor: Colors.light.success,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    minHeight: 2,
  },
  growthBarUnfollow: {
    width: '45%',
    backgroundColor: Colors.light.error,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    minHeight: 2,
  },
  growthLabel: {
    fontSize: 9,
    color: Colors.light.secondaryText,
  },
  followerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.separator,
  },
  followerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  followerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  followerUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  followerEngagement: {
    fontSize: 12,
    color: Colors.light.secondaryText,
  },
  followerRank: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  followerRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
  locationInfo: {
    flex: 1,
  },
  locationCity: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  locationCountry: {
    fontSize: 12,
    color: Colors.light.secondaryText,
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
  ageGenderItem: {
    marginBottom: 16,
  },
  ageGenderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  ageGenderBar: {
    flexDirection: 'row',
    height: 24,
    backgroundColor: Colors.light.separator,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  ageGenderSegment: {
    height: '100%',
  },
  ageGenderStats: {
    flexDirection: 'row',
    gap: 16,
  },
  ageGenderStat: {
    fontSize: 12,
    color: Colors.light.secondaryText,
  },
  genderLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.separator,
  },
  genderLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  genderLegendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  genderLegendText: {
    fontSize: 12,
    color: Colors.light.secondaryText,
  },
  accountTypeItem: {
    marginBottom: 16,
  },
  accountTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  accountTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  accountTypeBarContainer: {
    height: 8,
    backgroundColor: Colors.light.separator,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  accountTypeBarFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
  },
  accountTypeValue: {
    fontSize: 13,
    color: Colors.light.secondaryText,
  },
  segmentItem: {
    marginBottom: 16,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  segmentBarContainer: {
    height: 12,
    backgroundColor: Colors.light.separator,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  segmentBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  segmentValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
});
