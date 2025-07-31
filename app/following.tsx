import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { users } from '@/mocks/users';
import { User } from '@/mocks/users';

export default function FollowingScreen() {
  const router = useRouter();
  
  const handleBack = () => {
    router.back();
  };

  const renderFollowing = ({ item }: { item: User }) => (
    <View style={styles.followingItem}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.followingInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.userStatus}>{item.verified ? 'Verified' : 'User'}</Text>
      </View>
      <TouchableOpacity style={styles.followingButton}>
        <Text style={styles.followingButtonText}>Following</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: "Following",
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={styles.container}>
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderFollowing}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>Not following anyone</Text>
              <Text style={styles.emptyStateText}>When you follow people, they'll appear here.</Text>
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
  backButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  followingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  followingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  userStatus: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  followingButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.border,
  },
  followingButtonText: {
    color: Colors.light.text,
    fontWeight: '500',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    textAlign: 'center',
  },
});