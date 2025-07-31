import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { liveStreams } from '@/mocks/liveStreams';
import LiveStreamItem from '@/components/LiveStreamItem';
import { Video, Camera } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function LiveStreamsScreen() {
  const [activeStreams, setActiveStreams] = useState(liveStreams);

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: "Live",
          headerTitleStyle: styles.headerTitle,
          headerRight: () => (
            <TouchableOpacity 
              style={styles.goLiveButton}
              onPress={() => {}}
            >
              <Camera size={18} color="white" />
              <Text style={styles.goLiveText}>Go Live</Text>
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={styles.container}>
        <FlatList
          data={activeStreams}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <LiveStreamItem stream={item} />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Video size={64} color={Colors.light.secondaryText} />
              <Text style={styles.emptyTitle}>No Live Streams</Text>
              <Text style={styles.emptyText}>There are no active streams right now. Check back later or start your own stream!</Text>
            </View>
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  goLiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  goLiveText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
  },
  itemContainer: {
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    marginBottom: 24,
  },
});