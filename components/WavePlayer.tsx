import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Wave } from '@/mocks/waves';
import { useWavesStore } from '@/store/wavesStore';
import WaveInteractions from './WaveInteractions';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WavePlayerProps {
  wave: Wave;
  isActive: boolean;
  onDoubleTap?: () => void;
}

export default function WavePlayer({ wave, isActive, onDoubleTap }: WavePlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const lastTap = useRef<number>(0);
  const { incrementViews } = useWavesStore();
  const hasIncrementedViews = useRef(false);

  // アクティブ時に自動再生、非アクティブ時に停止
  useEffect(() => {
    if (isActive) {
      videoRef.current?.playAsync();
      setIsPlaying(true);
      // 視聴回数をインクリメント（初回のみ）
      if (!hasIncrementedViews.current) {
        incrementViews(wave.id);
        hasIncrementedViews.current = true;
      }
    } else {
      videoRef.current?.pauseAsync();
      setIsPlaying(false);
    }
  }, [isActive]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    if (status.didJustFinish) {
      // ループ再生
      videoRef.current?.replayAsync();
    }

    // プログレス更新
    if (status.durationMillis && status.positionMillis) {
      setProgress(status.positionMillis / status.durationMillis);
    }
  };

  const handleSingleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // ダブルタップ
      handleDoubleTap();
    } else {
      // シングルタップ: 再生/一時停止
      if (isPlaying) {
        videoRef.current?.pauseAsync();
        setIsPlaying(false);
      } else {
        videoRef.current?.playAsync();
        setIsPlaying(true);
      }
    }

    lastTap.current = now;
  };

  const handleDoubleTap = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onDoubleTap?.();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    videoRef.current?.setIsMutedAsync(!isMuted);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={styles.container}>
      {/* Video Player */}
      <TouchableWithoutFeedback onPress={handleSingleTap}>
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: wave.videoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            isLooping={false}
            shouldPlay={isActive}
            isMuted={isMuted}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />

          {/* Top Gradient Overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent']}
            style={styles.topGradient}
            pointerEvents="none"
          />

          {/* Bottom Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.bottomGradient}
            pointerEvents="none"
          />

          {/* Progress Bar */}
          <View style={styles.progressContainer} pointerEvents="none">
            <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* Interactions Overlay */}
      <WaveInteractions wave={wave} isMuted={isMuted} onToggleMute={toggleMute} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
  },
});
