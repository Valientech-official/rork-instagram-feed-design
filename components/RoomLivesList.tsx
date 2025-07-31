import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { roomPosts } from '@/mocks/roomPosts';
import LiveStreamItem from './LiveStreamItem';
import Colors from '@/constants/colors';
import { Image } from 'expo-image';

// Convert room posts to live stream format for display
const convertRoomPostsToLiveStreams = () => {
  return roomPosts.slice(0, 4).map((post, index) => ({
    id: `room-live-${post.id}`,
    user: {
      ...post.user,
      verified: false, // Add the missing verified property
    },
    title: `${post.roomName} - Live Chat`,
    thumbnail: post.images[0],
    viewers: Math.floor(Math.random() * 200) + 50,
    startedAt: post.timestamp,
    tags: ['room', 'chat', 'live'],
    isActive: true,
    description: `Live discussion in ${post.roomName}`,
    isRoomLive: true,
    roomId: post.roomId,
    roomName: post.roomName,
  }));
};

export default function RoomLivesList() {
  const router = useRouter();
  const roomLiveStreams = convertRoomPostsToLiveStreams();

  const handleSeeAllPress = () => {
    router.push('/room');
  };

  const handleRoomPress = (roomId: string) => {
    router.push(`/room/${roomId}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Room Live</Text>
        <TouchableOpacity style={styles.seeAllButton} onPress={handleSeeAllPress}>
          <Text style={styles.seeAllText}>すべて見る</Text>
          <ChevronRight size={16} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.contentRow}>
        {/* Room entrance image */}
        <TouchableOpacity 
          style={styles.roomImageContainer}
          onPress={() => router.push('/room')}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000" }}
            style={styles.roomImage}
            contentFit="cover"
          />
          <View style={styles.roomOverlay}>
            <Text style={styles.roomText}>Room</Text>
            <Text style={styles.roomSubText}>Join Chat</Text>
          </View>
        </TouchableOpacity>
        
        {/* Room Live Streams */}
        <FlatList
          data={roomLiveStreams}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleRoomPress(item.roomId)}
              activeOpacity={0.9}
            >
              <LiveStreamItem stream={item} size="small" />
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
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
  roomImageContainer: {
    width: 100,
    height: 150,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  roomImage: {
    width: '100%',
    height: '100%',
  },
  roomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  roomText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  roomSubText: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.8,
  },
  listContent: {
    paddingRight: 8,
  },
});