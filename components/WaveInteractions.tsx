import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Music,
  MoreHorizontal,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { Wave } from '@/mocks/waves';
import { useWavesStore } from '@/store/wavesStore';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface WaveInteractionsProps {
  wave: Wave;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function WaveInteractions({
  wave,
  isMuted,
  onToggleMute,
}: WaveInteractionsProps) {
  const router = useRouter();
  const { likeWave, unlikeWave } = useWavesStore();
  const [isLiked, setIsLiked] = useState(wave.isLiked || false);
  const [likesCount, setLikesCount] = useState(wave.likes);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLike = async () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount(newLikedState ? likesCount + 1 : likesCount - 1);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(
        newLikedState ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
      );
    }

    // アニメーション
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // ストア更新
    if (newLikedState) {
      await likeWave(wave.id);
    } else {
      await unlikeWave(wave.id);
    }
  };

  const handleComment = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/wave/${wave.id}`);
  };

  const handleShare = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // TODO: シェア機能実装
    console.log('Share wave:', wave.id);
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <View style={styles.container}>
      {/* Right Side Actions */}
      <View style={styles.rightActions}>
        {/* User Avatar */}
        <TouchableOpacity style={styles.avatarContainer}>
          <Image source={{ uri: wave.user.avatar }} style={styles.avatar} />
          {wave.user.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Like Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Heart
              size={32}
              color={isLiked ? '#ff0050' : '#fff'}
              fill={isLiked ? '#ff0050' : 'none'}
              strokeWidth={2}
            />
          </Animated.View>
          <Text style={styles.actionText}>{formatCount(likesCount)}</Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
          <MessageCircle size={32} color="#fff" strokeWidth={2} />
          <Text style={styles.actionText}>{formatCount(wave.comments)}</Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Share2 size={30} color="#fff" strokeWidth={2} />
          <Text style={styles.actionText}>{formatCount(wave.shares)}</Text>
        </TouchableOpacity>

        {/* Mute Button */}
        <TouchableOpacity style={styles.actionButton} onPress={onToggleMute}>
          {isMuted ? (
            <VolumeX size={28} color="#fff" strokeWidth={2} />
          ) : (
            <Volume2 size={28} color="#fff" strokeWidth={2} />
          )}
        </TouchableOpacity>

        {/* More Button */}
        <TouchableOpacity style={styles.actionButton}>
          <MoreHorizontal size={28} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Bottom Info */}
      <View style={styles.bottomInfo}>
        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.username}>@{wave.user.username}</Text>
          <Text style={styles.caption} numberOfLines={2}>
            {wave.caption}
          </Text>
          {wave.hashtags.length > 0 && (
            <View style={styles.hashtagsContainer}>
              {wave.hashtags.map((tag, index) => (
                <Text key={index} style={styles.hashtag}>
                  #{tag}{' '}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Music Info */}
        {wave.music && (
          <View style={styles.musicInfo}>
            <Music size={16} color="#fff" />
            <Text style={styles.musicText} numberOfLines={1}>
              {wave.music.title} - {wave.music.artist}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  rightActions: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    alignItems: 'center',
    gap: 20,
  },
  avatarContainer: {
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00a6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomInfo: {
    position: 'absolute',
    left: 16,
    right: 80,
    bottom: 20,
  },
  userInfo: {
    marginBottom: 12,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  hashtag: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  musicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  musicText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 250,
  },
});
