import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import { profilePosts, ProfilePost } from '@/mocks/profilePosts';

export default function SavedScreen() {
  const router = useRouter();
  
  const handleBack = () => {
    router.back();
  };

  const renderSavedItem = ({ item }: { item: ProfilePost }) => (
    <TouchableOpacity 
      style={styles.savedItem}
      onPress={() => router.push(`/post/${item.id}`)}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.itemImage}
        contentFit="cover"
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemLikes}>{item.likes} likes</Text>
        <Text style={styles.itemComments}>{item.comments} comments</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: "Saved Items",
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={styles.container}>
        <FlatList
          data={profilePosts}
          keyExtractor={(item) => item.id}
          renderItem={renderSavedItem}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No saved items</Text>
              <Text style={styles.emptyStateText}>Items you save will appear here.</Text>
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
    padding: 8,
  },
  savedItem: {
    flex: 1,
    margin: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.light.shopCard,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemImage: {
    width: '100%',
    height: 150,
  },
  itemInfo: {
    padding: 8,
  },
  itemLikes: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
  },
  itemComments: {
    fontSize: 12,
    color: Colors.light.secondaryText,
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