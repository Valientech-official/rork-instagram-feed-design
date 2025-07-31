import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { liveStreams } from '@/mocks/liveStreams';
import LiveStreamsList from '@/components/LiveStreamsList';
import LiveStreamItem from '@/components/LiveStreamItem';
import Colors from '@/constants/colors';

export default function LiveTabScreen() {
  const router = useRouter();
  const activeStreams = liveStreams.filter(stream => stream.isActive);
  
  // For demo purposes, we'll just show the first stream in the featured section
  const featuredStream = activeStreams.length > 0 ? activeStreams[0] : null;
  // And the rest in the list below
  const otherStreams = activeStreams.filter(stream => stream.id !== featuredStream?.id);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Featured Stream */}
      {featuredStream && (
        <View style={styles.featuredContainer}>
          <LiveStreamItem stream={featuredStream} />
        </View>
      )}
      
      {/* Other Active Streams */}
      {otherStreams.length > 0 && (
        <LiveStreamsList 
          streams={otherStreams} 
          title="CM and Live" 
          showSeeAll={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingTop: 16,
  },
  featuredContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
});