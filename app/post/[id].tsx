import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { ChevronLeft, Heart, MessageCircle, Send, Bookmark } from 'lucide-react-native';
import { profilePosts } from '@/mocks/profilePosts';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const post = profilePosts.find(p => p.id === id);
  const [liked, setLiked] = useState(false);

  if (!post) {
    return (
      <View style={styles.notFound}>
        <Text>Post not found</Text>
      </View>
    );
  }

  const handleBack = () => {
    router.back();
  };

  const handleLike = () => {
    setLiked(!liked);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: 'Post',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={styles.container}>
        <View style={styles.postHeader}>
          <Image 
            source={{ uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80" }} 
            style={styles.avatar} 
          />
          <View style={styles.headerInfo}>
            <Text style={styles.username}>username</Text>
            <Text style={styles.location}>Location</Text>
          </View>
        </View>
        
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
          contentFit="cover"
        />
        
        <View style={styles.actionsContainer}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Heart 
                size={24} 
                color={liked ? Colors.light.like : Colors.light.icon} 
                fill={liked ? Colors.light.like : 'transparent'} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <MessageCircle size={24} color={Colors.light.icon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Send size={24} color={Colors.light.icon} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.actionButton}>
            <Bookmark size={24} color={Colors.light.icon} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.postInfo}>
          <Text style={styles.likes}>{post.likes} likes</Text>
          <View style={styles.captionContainer}>
            <Text style={styles.captionUsername}>username</Text>
            <Text style={styles.caption}>This is a sample caption for this post. #hashtag #sample</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.comments}>View all {post.comments} comments</Text>
          </TouchableOpacity>
          <Text style={styles.timestamp}>2 DAYS AGO</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerInfo: {
    marginLeft: 10,
  },
  username: {
    fontWeight: '600',
    fontSize: 14,
    color: Colors.light.text,
  },
  location: {
    fontSize: 12,
    color: Colors.light.secondaryText,
  },
  postImage: {
    width: width,
    height: width,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  leftActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginRight: 16,
  },
  postInfo: {
    paddingHorizontal: 12,
  },
  likes: {
    fontWeight: '600',
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 6,
  },
  captionContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  captionUsername: {
    fontWeight: '600',
    fontSize: 14,
    color: Colors.light.text,
    marginRight: 4,
  },
  caption: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  comments: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    textTransform: 'uppercase',
  },
});