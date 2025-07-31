import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LiveStream } from '@/mocks/liveStreams';
import LiveStreamItem from './LiveStreamItem';
import Colors from '@/constants/colors';
import { Image } from 'expo-image';

interface LiveStreamsListProps {
  streams: LiveStream[];
  title?: string;
  showSeeAll?: boolean;
}

export default function LiveStreamsList({ 
  streams, 
  title = "Live and ウェーブ", 
  showSeeAll = true 
}: LiveStreamsListProps) {
  const router = useRouter();

  const handleSeeAllPress = () => {
    router.push('/live');
  };

  if (streams.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {showSeeAll && (
          <TouchableOpacity style={styles.seeAllButton} onPress={handleSeeAllPress}>
            <Text style={styles.seeAllText}>See All</Text>
            <ChevronRight size={16} color={Colors.light.primary} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.contentRow}>
        {/* Entrance room image */}
        <View style={styles.doorImageContainer}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1000" }}
            style={styles.doorImage}
            contentFit="cover"
          />
          <View style={styles.doorOverlay}>
            <Text style={styles.doorText}>Room</Text>
          </View>
        </View>
        
        {/* Live Streams */}
        <FlatList
          data={streams}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <LiveStreamItem stream={item} size="small" />
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.light.primary,
    marginRight: 2,
  },
  contentRow: {
    flexDirection: 'row',
    paddingLeft: 16,
  },
  doorImageContainer: {
    width: 100,
    height: 125,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  doorImage: {
    width: '100%',
    height: '100%',
  },
  doorOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
  },
  doorText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContent: {
    paddingRight: 8,
  },
});