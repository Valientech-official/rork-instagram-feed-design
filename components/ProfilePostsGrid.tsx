import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Play } from 'lucide-react-native';
import { ProfilePost } from '@/mocks/profilePosts';
import { useFavoritesStore } from '@/store/favoritesStore';
import Colors from '@/constants/colors';
import ProfileCommentModal from './ProfileCommentModal';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 3;
const ITEM_HEIGHT = ITEM_WIDTH;

interface ProfilePostsGridProps {
  posts: ProfilePost[];
}

export default function ProfilePostsGrid({ posts }: ProfilePostsGridProps) {
  const router = useRouter();
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');

  const handlePostPress = (postId: string) => {
    // Navigate to post detail
    router.push(`/post/${postId}`);
  };

  const renderPost = ({ item }: { item: ProfilePost }) => {
    return (
      <TouchableOpacity 
        style={styles.postItem}
        onPress={() => handlePostPress(item.id)}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.postImage}
          contentFit="cover"
        />
        {item.isVideo && (
          <View style={styles.videoIndicator}>
            <Play size={16} color="white" fill="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>投稿</Text>
      
      <FlatList
        key="profile-posts-grid"
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        numColumns={3}
        scrollEnabled={false}
        contentContainerStyle={styles.gridContainer}
      />

      <ProfileCommentModal
        visible={commentModalVisible}
        postId={selectedPostId}
        onClose={() => setCommentModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
    paddingHorizontal: 12,
  },
  gridContainer: {
    width: '100%',
  },
  postItem: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderWidth: 0.5,
    borderColor: 'white',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});