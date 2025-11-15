import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Dimensions, ViewToken } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { DoorOpen, Plus, ChevronUp, ChevronDown } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { roomPosts, RoomPost as RoomPostType } from '@/mocks/roomPosts';
import RoomPostComponent from '@/components/RoomPost';
import { liveStreams, LiveStream } from '@/mocks/liveStreams';
import LiveStreamItem from '@/components/LiveStreamItem';
import { useThemeStore } from '@/store/themeStore';

interface Room {
  id: string;
  name: string;
  members: number;
  isLive: boolean;
}

const rooms: Room[] = [
  { id: '1', name: 'コーデQ&A Room', members: 24, isLive: true },
  { id: '2', name: '全身コーデ Room', members: 56, isLive: true },
  { id: '3', name: 'ペアルック Room', members: 12, isLive: false },
  { id: '4', name: 'シチュエーション Room', members: 8, isLive: false },
  { id: '5', name: 'オススメALL Room', members: 32, isLive: true },
  { id: '6', name: 'Nextトレンド Room', members: 18, isLive: false },
];

type ViewMode = 'rooms' | 'live';

const { height } = Dimensions.get('window');

export default function RoomScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>('rooms');
  const [currentLiveIndex, setCurrentLiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<LiveStream>>(null);
  
  // Memoize viewabilityConfig to prevent recreation on each render
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  const handleCreateRoom = () => {
    // Navigate to room creation screen
    console.log('Create room');
  };

  const handleRoomPress = (roomId: string) => {
    // Navigate to room detail
    if (roomId === '1') {
      router.push('/room/qa');
    } else if (roomId === '2') {
      router.push('/room/fullbody');
    } else if (roomId === '3') {
      router.push('/room/pairlook');
    } else if (roomId === '4') {
      router.push('/room/situation');
    } else if (roomId === '5') {
      router.push('/room/recommend-all');
    } else if (roomId === '6') {
      router.push('/room/nexttrend');
    } else {
      console.log(`Room ${roomId} pressed`);
    }
  };

  const handlePostPress = (postId: string) => {
    // Navigate to post detail
    console.log(`Post ${postId} pressed`);
  };

  const handleLiveStreamPress = (streamId: string) => {
    router.push(`/live/${streamId}`);
  };

  const toggleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    // Reset to first live stream when switching to live mode
    if (mode === 'live') {
      setCurrentLiveIndex(0);
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: 0, animated: false });
      }
    }
  };

  // Use useCallback to memoize the function and prevent recreation on each render
  const handleViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null && viewableItems[0].index !== undefined) {
      setCurrentLiveIndex(viewableItems[0].index);
    }
  }, []);

  const navigateLiveStream = (direction: 'next' | 'prev') => {
    const newIndex = direction === 'next' 
      ? Math.min(currentLiveIndex + 1, liveStreams.length - 1)
      : Math.max(currentLiveIndex - 1, 0);
    
    setCurrentLiveIndex(newIndex);
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: newIndex, animated: true });
    }
  };

  const renderLiveStreamItem = ({ item, index }: { item: LiveStream; index: number }) => {
    // Get the corresponding room name based on the index
    const roomName = rooms[index % rooms.length]?.name || `Room ${index + 1}`;
    
    return (
      <View style={styles.liveStreamFullPage}>
        <LiveStreamItem 
          stream={{
            ...item,
            title: `${roomName}: ${item.title}`
          }} 
          size="large" 
          fullScreen
        />
        
        <View style={styles.navigationControls}>
          {index > 0 && (
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => navigateLiveStream('prev')}
            >
              <ChevronUp size={24} color="white" />
            </TouchableOpacity>
          )}
          
          {index < liveStreams.length - 1 && (
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => navigateLiveStream('next')}
            >
              <ChevronDown size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.paginationIndicator}>
          <Text style={styles.paginationText}>
            {index + 1} / {liveStreams.length}
          </Text>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flex: 1,
    },
    scrollContentContainer: {
      padding: 12,
      paddingBottom: 24,
    },
    createButton: {
      padding: 8,
      marginRight: 8,
    },
    pageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pageHeaderTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    liveHeaderButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.shopBackground,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 8,
    },
    liveIndicatorPulse: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FF3B30',
    },
    liveHeaderButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    viewToggleContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 12,
      marginTop: 12,
      marginBottom: 16,
      backgroundColor: colors.shopBackground,
      borderRadius: 12,
      padding: 4,
    },
    viewToggleButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      flex: 1,
      alignItems: 'center',
    },
    activeViewToggleButton: {
      backgroundColor: colors.primary,
    },
    viewToggleText: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.secondaryText,
    },
    activeViewToggleText: {
      color: 'white',
      fontWeight: '600',
    },
    sectionHeader: {
      marginVertical: 12,
      paddingHorizontal: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    roomsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    roomItem: {
      width: '48%',
      height: 145,
      borderRadius: 12,
      backgroundColor: colors.shopBackground,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    roomHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
      minHeight: 48,
    },
    roomName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      marginRight: 8,
      lineHeight: 20,
    },
    liveIndicator: {
      backgroundColor: '#FF3B30',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 4,
      alignSelf: 'flex-start',
      minWidth: 32,
      alignItems: 'center',
    },
    liveText: {
      color: 'white',
      fontSize: 9,
      fontWeight: '600',
      textAlign: 'center',
    },
    roomContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 2,
    },
    membersText: {
      marginTop: 8,
      fontSize: 15,
      color: colors.secondaryText,
      textAlign: 'center',
    },
    postsContainer: {
      marginTop: 8,
    },
    liveStreamContainer: {
      flex: 1,
    },
    liveStreamFullPage: {
      height: Dimensions.get('window').height - 120,
      position: 'relative',
      paddingHorizontal: 12,
      paddingBottom: 12,
    },
    navigationControls: {
      position: 'absolute',
      right: 20,
      top: '50%',
      transform: [{ translateY: -50 }],
      zIndex: 10,
    },
    navButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 8,
    },
    paginationIndicator: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    paginationText: {
      color: 'white',
      fontWeight: '600',
    },
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Rooms",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            marginTop: insets.top,
          },
          headerRight: () => (
            <TouchableOpacity
              style={[styles.createButton, { marginTop: insets.top }]}
              onPress={handleCreateRoom}
            >
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* ヘッダー */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageHeaderTitle}>おすすめのRooms</Text>
          <TouchableOpacity
            style={styles.liveHeaderButton}
            onPress={() => toggleViewMode('live')}
          >
            <View style={styles.liveIndicatorPulse} />
            <Text style={styles.liveHeaderButtonText}>おすすめ Room LIVE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.viewToggleContainer}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'rooms' && styles.activeViewToggleButton
            ]}
            onPress={() => toggleViewMode('rooms')}
          >
            <Text style={[
              styles.viewToggleText,
              viewMode === 'rooms' && styles.activeViewToggleText
            ]}>Rooms</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'live' && styles.activeViewToggleButton
            ]}
            onPress={() => toggleViewMode('live')}
          >
            <Text style={[
              styles.viewToggleText,
              viewMode === 'live' && styles.activeViewToggleText
            ]}>Room Live</Text>
          </TouchableOpacity>
        </View>
        
        {viewMode === 'rooms' ? (
          <ScrollView 
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Rooms Grid */}
            <View style={styles.roomsGrid}>
              {rooms.map((room) => (
                <TouchableOpacity 
                  key={room.id}
                  style={styles.roomItem}
                  onPress={() => handleRoomPress(room.id)}
                >
                  <View style={styles.roomHeader}>
                    <Text style={styles.roomName} numberOfLines={2} ellipsizeMode="tail">
                      {room.name}
                    </Text>
                    {room.isLive && (
                      <View style={styles.liveIndicator}>
                        <Text style={styles.liveText}>LIVE</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.roomContent}>
                    <DoorOpen 
                      size={34} 
                      color={room.name === 'コーデQ&A Room' ? '#9ACD32' : room.name === '全身コーデ Room' ? '#FF69B4' : room.name === 'ペアルック Room' ? '#87CEEB' : room.name === 'シチュエーション Room' ? '#FFD700' : room.name === 'オススメALL Room' ? '#DDA0DD' : room.name === 'Nextトレンド Room' ? '#D2B48C' : Colors.light.text} 
                    />
                    <Text style={styles.membersText} numberOfLines={1}>
                      {room.members} members
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>オススメRoom投稿↓↓↓</Text>
            </View>
            
            {/* Room Posts List */}
            <View style={styles.postsContainer}>
              {roomPosts.map((post) => (
                <RoomPostComponent 
                  key={post.id}
                  post={post} 
                  onPress={() => handlePostPress(post.id)}
                />
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.liveStreamContainer}>
            <FlatList
              ref={flatListRef}
              data={liveStreams}
              keyExtractor={(item) => item.id}
              renderItem={renderLiveStreamItem}
              pagingEnabled
              showsVerticalScrollIndicator={false}
              snapToInterval={height - insets.top - 60} // Account for header and toggle
              decelerationRate="fast"
              onViewableItemsChanged={handleViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              initialNumToRender={1}
              maxToRenderPerBatch={2}
              windowSize={3}
              removeClippedSubviews={true}
            />
          </View>
        )}
      </View>
    </>
  );
}