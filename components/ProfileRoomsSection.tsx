import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { DoorOpen, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

interface RoomItem {
  id: string;
  name: string;
  members: number;
  isLive: boolean;
}

const rooms: RoomItem[] = [
  { id: '1', name: 'コーデQ&A Room', members: 24, isLive: true },
  { id: '2', name: '全身コーデRoom', members: 56, isLive: false },
  { id: '3', name: 'ペアルックRoom', members: 12, isLive: true },
  { id: '4', name: 'シチュエーションRoom', members: 8, isLive: false },
  { id: '5', name: 'オススメALL Room', members: 32, isLive: true },
  { id: '6', name: 'NextトレンドRoom', members: 18, isLive: false },
];

const { width } = Dimensions.get('window');
// Calculate item width for 2 columns with space-between
const ITEM_WIDTH = (width - 48) / 2; // Adjusted to make cards slightly narrower

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
                    size={16} 
                    color={room.name === 'コーデQ&A Room' ? '#9ACD32' : room.name === '全身コーデRoom' ? '#FF69B4' : room.name === 'ペアルックRoom' ? '#87CEEB' : room.name === 'シチュエーションRoom' ? '#FFD700' : room.name === 'オススメALL Room' ? '#DDA0DD' : room.name === 'NextトレンドRoom' ? '#D2B48C' : Colors.light.text} 
                  />
                </View>
                <Text style={styles.roomName} numberOfLines={2} ellipsizeMode="tail">
                  {room.name}
                </Text>
                <View style={styles.roomInfo}>
                  <View style={styles.membersContainer}>
                    <Users size={10} color={Colors.light.secondaryText} />
                    <Text style={styles.membersText}>{room.members}</Text>
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
    paddingHorizontal: 14, // Increased from 10 to 14 to make section narrower
    paddingVertical: 8,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    height: 340, // Increased height to accommodate better text display
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
    justifyContent: 'space-between', // Evenly distribute cards
    marginBottom: 10,
  },
  roomItem: {
    width: ITEM_WIDTH,
    height: 90, // Increased height to accommodate 2-line text
    backgroundColor: Colors.light.shopBackground,
    borderRadius: 12,
    padding: 8,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  roomName: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.light.text,
    textAlign: 'center',
    width: '100%',
    height: 32, // Increased height for 2 lines
    lineHeight: 14, // Adjusted line height
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    height: 16,
    width: '100%',
  },
  membersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  membersText: {
    fontSize: 10,
    color: Colors.light.secondaryText,
    marginLeft: 2,
  },
  liveIndicator: {
    backgroundColor: '#FF3B30', // Changed from Colors.light.primary to red
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