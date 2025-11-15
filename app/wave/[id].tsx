import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useWavesStore } from '@/store/wavesStore';
import WaveFeed from '@/components/WaveFeed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export default function WaveDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { timelineWaves, loading, fetchTimeline } = useWavesStore();

  useEffect(() => {
    // タイムラインのウェーブを取得
    if (timelineWaves.length === 0) {
      fetchTimeline();
    }
  }, []);

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  // 現在のウェーブのインデックスを見つける
  const initialIndex = useMemo(() => {
    if (!id || typeof id !== 'string') return 0;
    const index = timelineWaves.findIndex((wave) => wave.id === id);
    return index >= 0 ? index : 0;
  }, [id, timelineWaves]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
    },
    header: {
      position: 'absolute',
      top: insets.top,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      zIndex: 10,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading || timelineWaves.length === 0) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Wave Feed - 縦スクロール対応 */}
        <WaveFeed
          waves={timelineWaves}
          initialIndex={initialIndex}
          onEndReached={() => {
            // TODO: Load more waves
            console.log('Load more waves');
          }}
        />
      </View>
    </>
  );
}
