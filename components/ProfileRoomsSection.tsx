import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { DoorOpen, FileText } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

interface RoomItem {
  id: string;
  name: string;
  postsCount: number;
  isLive: boolean;
}

const rooms: RoomItem[] = [
  { id: '1', name: 'コーデQ&A Room', postsCount: 124, isLive: true },
  { id: '2', name: '全身コーデRoom', postsCount: 256, isLive: false },
  { id: '3', name: 'ペアルックRoom', postsCount: 89, isLive: true },
  { id: '4', name: 'シチュエーションRoom', postsCount: 45, isLive: false },
  { id: '5', name: 'オススメALL Room', postsCount: 312, isLive: true },
  { id: '6', name: 'NextトレンドRoom', postsCount: 178, isLive: false },
];

const { width } = Dimensions.get('window');
// Calculate item width for 2 columns with narrower layout
const ITEM_WIDTH = (width - 56) / 2; // More narrow spacing

export default function ProfileRoomsSection() {
  const router = useRouter();
  
  const handleRoomPress = (roomId: string) => {
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

  // Create a 2x3 grid layout (2 columns, 3 rows)
  const renderGrid = () => {
    const rows = [];
    for (let i = 0; i < 3; i++) {
      const rowItems = rooms.slice(i * 2, (i + 1) * 2);
      if (rowItems.length === 0) break;
      
      rows.push(
        <View key={`row-${i}`} style={styles.row}>
          {rowItems.map((room) => (
            <TouchableOpacity
              key={room.id}
              style={styles.roomItem}
              onPress={() => handleRoomPress(room.id)}
            >
              <View style={styles.roomContent}>
                <View style={styles.iconContainer}>
                  <DoorOpen
                    size={28}
                    color={room.name === 'コーデQ&A Room' ? '#9ACD32' : room.name === '全身コーデRoom' ? '#FF69B4' : room.name === 'ペアルックRoom' ? '#87CEEB' : room.name === 'シチュエーションRoom' ? '#FFD700' : room.name === 'オススメALL Room' ? '#DDA0DD' : room.name === 'NextトレンドRoom' ? '#D2B48C' : Colors.light.text}
                  />
                </View>
                <Text style={styles.roomName} numberOfLines={2} ellipsizeMode="tail">
                  {room.name}
                </Text>
                <View style={styles.roomInfo}>
                  <View style={styles.postsContainer}>
                    <FileText size={10} color={Colors.light.secondaryText} />
                    <Text style={styles.postsText}>{room.postsCount}投稿</Text>
                  </View>
                  {room.isLive && (
                    <View style={styles.liveIndicator}>
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    return rows;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Rooms</Text>
      
      <View style={styles.gridContainer}>
        {renderGrid()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    height: 340,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 6,
  },
  gridContainer: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  roomItem: {
    width: ITEM_WIDTH,
    height: 100,
    backgroundColor: Colors.light.shopBackground,
    borderRadius: 12,
    padding: 10,
    borderWidth: 0.5,
    borderColor: Colors.light.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roomContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  roomName: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.light.text,
    textAlign: 'center',
    width: '100%',
    height: 28,
    lineHeight: 14,
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    height: 16,
    width: '100%',
  },
  postsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  postsText: {
    fontSize: 9,
    color: Colors.light.secondaryText,
    marginLeft: 2,
  },
  liveIndicator: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    position: 'absolute',
    right: 0,
    minWidth: 24,
    alignItems: 'center',
  },
  liveText: {
    color: 'white',
    fontSize: 7,
    fontWeight: '600',
    textAlign: 'center',
  },
});