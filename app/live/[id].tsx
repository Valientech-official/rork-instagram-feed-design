import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { liveStreams } from '@/mocks/liveStreams';
import { liveComments } from '@/mocks/liveComments';
import LiveCommentsList from '@/components/LiveCommentsList';
import LiveControls from '@/components/LiveControls';
import Colors from '@/constants/colors';

const { width, height } = Dimensions.get('window');

export default function LiveStreamViewerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const stream = liveStreams.find(s => s.id === id);
  const [comments, setComments] = useState(liveComments);

  useEffect(() => {
    if (!stream) {
      router.back();
    }
  }, [stream, router]);

  if (!stream) {
    return null;
  }

  const handleClose = () => {
    router.back();
  };

  const handleSendComment = (text: string) => {
    const newComment = {
      id: `new-${Date.now()}`,
      userId: 'current-user',
      username: 'you',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80',
      text,
      timestamp: 'Just now'
    };
    
    setComments([newComment, ...comments]);
  };

  return (
    <View style={styles.container}>
      {/* Stream Video/Image */}
      <Image
        source={{ uri: stream.thumbnail }}
        style={styles.streamImage}
        contentFit="cover"
      />
      
      {/* Comments List */}
      <View style={styles.commentsContainer}>
        <LiveCommentsList comments={comments} />
      </View>
      
      {/* Controls Overlay */}
      <LiveControls onClose={handleClose} onSendComment={handleSendComment} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  streamImage: {
    width,
    height: Platform.OS === 'web' ? height - 100 : height,
    position: 'absolute',
  },
  commentsContainer: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    maxHeight: 300,
  },
});