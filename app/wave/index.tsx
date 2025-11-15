import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import WaveFeed from '@/components/WaveFeed';
import { useWavesStore } from '@/store/wavesStore';

export default function WaveTimelineScreen() {
  const { timelineWaves, loading, fetchTimeline } = useWavesStore();

  useEffect(() => {
    fetchTimeline();
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {timelineWaves.length > 0 && (
          <WaveFeed
            waves={timelineWaves}
            loading={loading}
            onEndReached={() => {
              // TODO: Load more waves
              console.log('Load more waves');
            }}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
