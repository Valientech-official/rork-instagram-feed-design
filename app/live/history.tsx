/**
 * Live Stream History Screen
 * View past live streams with analytics and replay options
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  ChevronLeft,
  Play,
  Users,
  Eye,
  Clock,
  TrendingUp,
  Trash2,
  BarChart3,
  Video,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import {
  getLiveStreamHistory,
  deleteLiveStream,
  getLiveStreamReplay,
  LiveStreamHistoryItem,
} from '@/services/liveStreamService';

type FilterType = 'all' | 'replays' | 'archived';

export default function LiveStreamHistoryScreen() {
  const router = useRouter();

  const [streams, setStreams] = useState<LiveStreamHistoryItem[]>([]);
  const [filteredStreams, setFilteredStreams] = useState<LiveStreamHistoryItem[]>(
    []
  );
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filter, streams]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const history = await getLiveStreamHistory();
      setStreams(history);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load history:', error);
      Alert.alert('Error', 'Failed to load stream history');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const applyFilter = () => {
    let filtered = streams;

    if (filter === 'replays') {
      filtered = streams.filter((s) => s.has_replay);
    } else if (filter === 'archived') {
      filtered = streams.filter((s) => !s.has_replay);
    }

    setFilteredStreams(filtered);
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handlePlayReplay = async (stream: LiveStreamHistoryItem) => {
    if (!stream.has_replay) {
      Alert.alert('No Replay', 'Replay is not available for this stream');
      return;
    }

    try {
      const replayUrl = await getLiveStreamReplay(stream.stream_id);

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Navigate to replay player (same as viewer screen but with replay URL)
      router.push({
        pathname: '/live/[streamId]',
        params: {
          streamId: stream.stream_id,
          isReplay: 'true',
        },
      });
    } catch (error) {
      console.error('Failed to get replay URL:', error);
      Alert.alert('Error', 'Failed to load replay');
    }
  };

  const handleViewAnalytics = (streamId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert('Analytics', 'Detailed analytics coming soon');
  };

  const handleDeleteStream = (streamId: string, title: string) => {
    Alert.alert(
      'Delete Stream',
      `Are you sure you want to delete "${title}"? This cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLiveStream(streamId);
              setStreams(streams.filter((s) => s.stream_id !== streamId));

              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
              }
            } catch (error) {
              console.error('Failed to delete stream:', error);
              Alert.alert('Error', 'Failed to delete stream');
            }
          },
        },
      ]
    );
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: 'Stream History',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.container}>
        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => {
              setFilter('all');
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'all' && styles.filterTabTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'replays' && styles.filterTabActive,
            ]}
            onPress={() => {
              setFilter('replays');
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'replays' && styles.filterTabTextActive,
              ]}
            >
              Replays Available
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'archived' && styles.filterTabActive,
            ]}
            onPress={() => {
              setFilter('archived');
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'archived' && styles.filterTabTextActive,
              ]}
            >
              Archived
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stream List */}
        <ScrollView
          style={styles.streamsList}
          contentContainerStyle={styles.streamsListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {loading ? (
            <View style={styles.centerContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : filteredStreams.length === 0 ? (
            <View style={styles.emptyState}>
              <Video size={64} color={Colors.light.secondaryText} />
              <Text style={styles.emptyStateTitle}>No streams yet</Text>
              <Text style={styles.emptyStateText}>
                {filter === 'replays'
                  ? 'No replays available'
                  : filter === 'archived'
                  ? 'No archived streams'
                  : 'Your stream history will appear here'}
              </Text>
            </View>
          ) : (
            filteredStreams.map((stream) => (
              <View key={stream.stream_id} style={styles.streamCard}>
                {/* Thumbnail */}
                <TouchableOpacity
                  style={styles.thumbnailContainer}
                  onPress={() => handlePlayReplay(stream)}
                  disabled={!stream.has_replay}
                >
                  {stream.thumbnail_url ? (
                    <Image
                      source={{ uri: stream.thumbnail_url }}
                      style={styles.thumbnail}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
                      <Video size={32} color={Colors.light.secondaryText} />
                    </View>
                  )}

                  {stream.has_replay && (
                    <View style={styles.playOverlay}>
                      <Play size={32} color="white" fill="white" />
                    </View>
                  )}

                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>
                      {formatDuration(stream.duration)}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Stream Info */}
                <View style={styles.streamInfo}>
                  <Text style={styles.streamTitle} numberOfLines={2}>
                    {stream.title}
                  </Text>

                  <Text style={styles.streamDate}>{formatDate(stream.started_at)}</Text>

                  {/* Stats */}
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <TrendingUp
                        size={14}
                        color={Colors.light.secondaryText}
                      />
                      <Text style={styles.statText}>{stream.peak_viewers}</Text>
                    </View>

                    <View style={styles.statItem}>
                      <Eye size={14} color={Colors.light.secondaryText} />
                      <Text style={styles.statText}>{stream.total_views}</Text>
                    </View>

                    {stream.has_replay && (
                      <View style={styles.replayBadge}>
                        <Play size={12} color={Colors.light.primary} />
                        <Text style={styles.replayBadgeText}>Replay</Text>
                      </View>
                    )}
                  </View>

                  {/* Actions */}
                  <View style={styles.streamActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleViewAnalytics(stream.stream_id)}
                    >
                      <BarChart3 size={16} color={Colors.light.primary} />
                      <Text style={styles.actionButtonText}>Analytics</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() =>
                        handleDeleteStream(stream.stream_id, stream.title)
                      }
                    >
                      <Trash2 size={16} color={Colors.light.error} />
                      <Text style={[styles.actionButtonText, styles.deleteText]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.cardBackground,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: Colors.light.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  filterTabTextActive: {
    color: 'white',
  },
  streamsList: {
    flex: 1,
  },
  streamsListContent: {
    padding: 16,
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    textAlign: 'center',
  },
  streamCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: 200,
  },
  placeholderThumbnail: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  streamInfo: {
    padding: 12,
  },
  streamTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  streamDate: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: Colors.light.secondaryText,
  },
  replayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginLeft: 'auto',
  },
  replayBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  streamActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  deleteText: {
    color: Colors.light.error,
  },
});
