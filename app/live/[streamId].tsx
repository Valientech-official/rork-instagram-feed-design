/**
 * Live Stream Viewer Screen
 * Full-screen video player with real-time chat and controls
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  ScrollView,
  Animated,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  X,
  Heart,
  Share2,
  AlertCircle,
  Users,
  MessageCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import {
  getLiveStream,
  getLiveComments,
  sendLiveComment,
  likeLiveStream,
  LiveStream,
  LiveComment,
} from '@/services/liveStreamService';

const { width, height } = Dimensions.get('window');

export default function LiveStreamViewerScreen() {
  const { streamId } = useLocalSearchParams<{ streamId: string }>();
  const router = useRouter();

  const [stream, setStream] = useState<LiveStream | null>(null);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [likeAnimation] = useState(new Animated.Value(0));

  const controlsTimer = useRef<NodeJS.Timeout | null>(null);
  const commentsInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (streamId) {
      loadStreamData();
      startCommentsPolling();
    }

    return () => {
      if (commentsInterval.current) {
        clearInterval(commentsInterval.current);
      }
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
    };
  }, [streamId]);

  const loadStreamData = async () => {
    try {
      setLoading(true);
      const streamData = await getLiveStream(streamId);
      setStream(streamData);

      const commentsData = await getLiveComments(streamId);
      setComments(commentsData);

      setLoading(false);
    } catch (err) {
      console.error('Failed to load stream:', err);
      setError('Failed to load stream');
      setLoading(false);
    }
  };

  const startCommentsPolling = () => {
    commentsInterval.current = setInterval(async () => {
      try {
        const newComments = await getLiveComments(streamId);
        setComments(newComments);
      } catch (err) {
        console.error('Failed to poll comments:', err);
      }
    }, 3000);
  };

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;

    try {
      const newComment = await sendLiveComment(streamId, commentText);
      setComments([newComment, ...comments]);
      setCommentText('');

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.error('Failed to send comment:', err);
      Alert.alert('Error', 'Failed to send comment');
    }
  };

  const handleLike = async () => {
    try {
      await likeLiveStream(streamId);

      // Trigger heart animation
      Animated.sequence([
        Animated.timing(likeAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(likeAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (err) {
      console.error('Failed to like stream:', err);
    }
  };

  const handleShare = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert('Share', 'Share functionality coming soon');
  };

  const handleReport = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert('Report', 'Report functionality coming soon');
  };

  const toggleControls = () => {
    setShowControls(!showControls);

    if (!showControls) {
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
      controlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.loadingText}>Loading stream...</Text>
      </View>
    );
  }

  if (error || !stream) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <AlertCircle size={48} color={Colors.light.error} />
        <Text style={styles.errorText}>{error || 'Stream not found'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleClose}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const likeScale = likeAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Video Player - In production, use Mux Player */}
      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={toggleControls}
      >
        {stream.thumbnail_url ? (
          <Image
            source={{ uri: stream.thumbnail_url }}
            style={styles.video}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.video, styles.placeholderVideo]}>
            <Text style={styles.placeholderText}>Live Stream</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Top Controls */}
      {showControls && (
        <View style={styles.topControls}>
          <View style={styles.hostInfo}>
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
            <View style={styles.viewerCount}>
              <Users size={16} color="white" />
              <Text style={styles.viewerCountText}>{stream.viewer_count}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Stream Info */}
      {showControls && (
        <View style={styles.streamInfo}>
          <Text style={styles.streamTitle}>{stream.title}</Text>
          {stream.description && (
            <Text style={styles.streamDescription}>{stream.description}</Text>
          )}
        </View>
      )}

      {/* Comments List */}
      <View style={styles.commentsContainer}>
        <ScrollView
          style={styles.commentsList}
          showsVerticalScrollIndicator={false}
          inverted
        >
          {comments.slice(0, 10).map((comment) => (
            <View key={comment.comment_id} style={styles.commentItem}>
              <Text style={styles.commentUsername}>{comment.username}</Text>
              <Text style={styles.commentText}>{comment.text}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <View style={styles.commentInputContainer}>
          <MessageCircle size={20} color={Colors.light.secondaryText} />
          <Text
            style={styles.commentInputPlaceholder}
            onPress={() => {
              // In production, show actual TextInput modal
              Alert.prompt(
                'Add Comment',
                'Enter your comment',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Send',
                    onPress: (text) => {
                      if (text) {
                        setCommentText(text);
                        handleSendComment();
                      }
                    },
                  },
                ],
                'plain-text'
              );
            }}
          >
            Add a comment...
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <Heart size={24} color="white" fill="rgba(255,255,255,0.3)" />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Share2 size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleReport}>
            <AlertCircle size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 20,
  },
  videoContainer: {
    width,
    height,
    position: 'absolute',
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
    fontSize: 18,
    fontWeight: '600',
  },
  topControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveBadge: {
    backgroundColor: Colors.light.error,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  viewerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  viewerCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streamInfo: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    left: 16,
    right: 16,
  },
  streamTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  streamDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  commentsContainer: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    height: 200,
  },
  commentsList: {
    flex: 1,
  },
  commentItem: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    maxWidth: '80%',
  },
  commentUsername: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  commentText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 14,
  },
  bottomControls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  commentInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  commentInputPlaceholder: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
