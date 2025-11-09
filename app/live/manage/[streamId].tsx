/**
 * Live Stream Management Screen
 * Host view with moderation controls and live statistics
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  X,
  Users,
  Heart,
  MessageCircle,
  Settings,
  Trash2,
  Pin,
  Ban,
  TrendingUp,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import {
  getLiveStream,
  getLiveStreamStats,
  getLiveComments,
  endLiveStream,
  deleteLiveComment,
  LiveStream,
  LiveStreamStats,
  LiveComment,
} from '@/services/liveStreamService';

const { width, height } = Dimensions.get('window');

export default function LiveStreamManagementScreen() {
  const { streamId } = useLocalSearchParams<{ streamId: string }>();
  const router = useRouter();

  const [stream, setStream] = useState<LiveStream | null>(null);
  const [stats, setStats] = useState<LiveStreamStats | null>(null);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(true);

  const statsInterval = useRef<NodeJS.Timeout | null>(null);
  const commentsInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (streamId) {
      loadStreamData();
      startPolling();
    }

    return () => {
      if (statsInterval.current) {
        clearInterval(statsInterval.current);
      }
      if (commentsInterval.current) {
        clearInterval(commentsInterval.current);
      }
    };
  }, [streamId]);

  const loadStreamData = async () => {
    try {
      setLoading(true);
      const [streamData, statsData, commentsData] = await Promise.all([
        getLiveStream(streamId),
        getLiveStreamStats(streamId),
        getLiveComments(streamId),
      ]);

      setStream(streamData);
      setStats(statsData);
      setComments(commentsData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load stream data:', error);
      Alert.alert('Error', 'Failed to load stream data');
      setLoading(false);
    }
  };

  const startPolling = () => {
    // Poll stats every 5 seconds
    statsInterval.current = setInterval(async () => {
      try {
        const statsData = await getLiveStreamStats(streamId);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to poll stats:', error);
      }
    }, 5000);

    // Poll comments every 3 seconds
    commentsInterval.current = setInterval(async () => {
      try {
        const commentsData = await getLiveComments(streamId);
        setComments(commentsData);
      } catch (error) {
        console.error('Failed to poll comments:', error);
      }
    }, 3000);
  };

  const handleEndStream = () => {
    Alert.alert(
      'End Live Stream',
      'Are you sure you want to end this stream? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End Stream',
          style: 'destructive',
          onPress: async () => {
            try {
              await endLiveStream(streamId);

              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
              }

              router.back();
            } catch (error) {
              console.error('Failed to end stream:', error);
              Alert.alert('Error', 'Failed to end stream. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteLiveComment(streamId, commentId);
            setComments(comments.filter((c) => c.comment_id !== commentId));

            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }
          } catch (error) {
            console.error('Failed to delete comment:', error);
            Alert.alert('Error', 'Failed to delete comment');
          }
        },
      },
    ]);
  };

  const handleSettings = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert('Settings', 'Stream settings coming soon');
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !stream || !stats) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Video Preview */}
      <View style={styles.videoPreview}>
        {stream.thumbnail_url ? (
          <Image
            source={{ uri: stream.thumbnail_url }}
            style={styles.video}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.video, styles.placeholderVideo]}>
            <Text style={styles.placeholderText}>Live Preview</Text>
          </View>
        )}

        {/* Live Badge */}
        <View style={styles.liveBadge}>
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>

        {/* Settings Button */}
        <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
          <Settings size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <TouchableOpacity
          style={styles.statsHeader}
          onPress={() => setShowStats(!showStats)}
        >
          <TrendingUp size={20} color={Colors.light.primary} />
          <Text style={styles.statsHeaderText}>Live Statistics</Text>
        </TouchableOpacity>

        {showStats && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Users size={24} color={Colors.light.primary} />
              <Text style={styles.statValue}>{stats.current_viewers}</Text>
              <Text style={styles.statLabel}>Current Viewers</Text>
            </View>

            <View style={styles.statCard}>
              <TrendingUp size={24} color={Colors.light.success} />
              <Text style={styles.statValue}>{stats.peak_viewers}</Text>
              <Text style={styles.statLabel}>Peak Viewers</Text>
            </View>

            <View style={styles.statCard}>
              <Heart size={24} color={Colors.light.like} />
              <Text style={styles.statValue}>{stats.total_likes}</Text>
              <Text style={styles.statLabel}>Total Likes</Text>
            </View>

            <View style={styles.statCard}>
              <MessageCircle size={24} color={Colors.light.primary} />
              <Text style={styles.statValue}>{stats.total_comments}</Text>
              <Text style={styles.statLabel}>Comments</Text>
            </View>
          </View>
        )}
      </View>

      {/* Comments Moderation */}
      <View style={styles.commentsSection}>
        <Text style={styles.sectionTitle}>
          Comment Moderation ({comments.length})
        </Text>

        <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
          {comments.length === 0 ? (
            <View style={styles.emptyState}>
              <MessageCircle size={48} color={Colors.light.secondaryText} />
              <Text style={styles.emptyStateText}>No comments yet</Text>
            </View>
          ) : (
            comments.map((comment) => (
              <View key={comment.comment_id} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentUsername}>{comment.username}</Text>
                  <Text style={styles.commentTime}>
                    {new Date(comment.created_at).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>

                <View style={styles.commentActions}>
                  <TouchableOpacity
                    style={styles.commentActionButton}
                    onPress={() => {
                      Alert.alert('Pin', 'Pin comment feature coming soon');
                    }}
                  >
                    <Pin size={16} color={Colors.light.secondaryText} />
                    <Text style={styles.commentActionText}>Pin</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.commentActionButton}
                    onPress={() => handleDeleteComment(comment.comment_id)}
                  >
                    <Trash2 size={16} color={Colors.light.error} />
                    <Text style={[styles.commentActionText, styles.deleteText]}>
                      Delete
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.commentActionButton}
                    onPress={() => {
                      Alert.alert('Block', 'Block user feature coming soon');
                    }}
                  >
                    <Ban size={16} color={Colors.light.secondaryText} />
                    <Text style={styles.commentActionText}>Block</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* End Stream Button */}
      <View style={styles.bottomControls}>
        <View style={styles.durationInfo}>
          <Text style={styles.durationLabel}>Duration:</Text>
          <Text style={styles.durationValue}>
            {formatDuration(stats.duration)}
          </Text>
        </View>

        <TouchableOpacity style={styles.endStreamButton} onPress={handleEndStream}>
          <X size={20} color="white" />
          <Text style={styles.endStreamButtonText}>End Stream</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  videoPreview: {
    width: '100%',
    height: 220,
    backgroundColor: 'black',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  placeholderVideo: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  liveBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: Colors.light.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  liveBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  settingsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsSection: {
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statsHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.light.cardBackground,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    marginTop: 4,
    textAlign: 'center',
  },
  commentsSection: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  commentsList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    marginTop: 12,
  },
  commentItem: {
    backgroundColor: Colors.light.cardBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  commentTime: {
    fontSize: 12,
    color: Colors.light.secondaryText,
  },
  commentText: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    color: Colors.light.secondaryText,
  },
  deleteText: {
    color: Colors.light.error,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationLabel: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  durationValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  endStreamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.error,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  endStreamButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
  },
});
