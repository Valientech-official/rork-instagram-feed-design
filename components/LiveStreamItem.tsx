import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LiveStream } from '@/mocks/liveStreams';
import { User } from '@/mocks/users';
import { Eye, MessageCircle, Heart, Share2 } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface LiveStreamItemProps {
  stream: LiveStream;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

const { width, height } = Dimensions.get('window');

export default function LiveStreamItem({ stream, size = 'large', fullScreen = false }: LiveStreamItemProps) {
  const router = useRouter();
  const isSmall = size === 'small';
  
  const itemWidth = isSmall ? (width / 3) - 16 : width - 32; // Changed from width/2 to width/3
  const imageHeight = fullScreen ? height * 0.6 : (isSmall ? 125 : 200); // Reduced height for small items

  const handlePress = () => {
    router.push(`/live/${stream.id}`);
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { width: fullScreen ? '100%' : itemWidth },
        isSmall && styles.smallContainer,
        fullScreen && styles.fullScreenContainer
      ]} 
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={[styles.imageContainer, { height: imageHeight }]}>
        <Image
          source={{ uri: stream.thumbnail }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
        />
        
        <View style={styles.liveIndicator}>
          <View style={styles.liveIndicatorDot} />
          <Text style={styles.liveText}>{stream.id === "live1" ? "ウェーブ" : "Live"}</Text>
        </View>
        
        <View style={styles.viewersContainer}>
          <Eye size={14} color="white" />
          <Text style={styles.viewersText}>{stream.viewers.toLocaleString()}</Text>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: stream.user.avatar }}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.textContainer}>
            <Text style={styles.username} numberOfLines={1}>{stream.user.username}</Text>
            <Text style={styles.title} numberOfLines={isSmall ? 1 : 2}>{stream.title}</Text>
          </View>
        </View>
        
        {!isSmall && (
          <View style={styles.tagsContainer}>
            {stream.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
        
        {fullScreen && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Heart size={24} color={Colors.light.text} />
              <Text style={styles.actionText}>{Math.floor(Math.random() * 500) + 100}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <MessageCircle size={24} color={Colors.light.text} />
              <Text style={styles.actionText}>{Math.floor(Math.random() * 200) + 50}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Share2 size={24} color={Colors.light.text} />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {fullScreen && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            {stream.title} - Join our {stream.tags.join(", ")} session!{stream.isActive ? " Currently streaming live!" : " Replay available now."}
          </Text>
          <Text style={styles.timeText}>Started {stream.startedAt}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  smallContainer: {
    marginHorizontal: 4,
  },
  fullScreenContainer: {
    shadowOpacity: 0,
    elevation: 0,
    marginBottom: 0,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  liveIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    marginRight: 4,
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  viewersContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewersText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  infoContainer: {
    padding: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.secondaryText,
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: Colors.light.shopBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    color: Colors.light.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.light.secondaryText,
  },
  descriptionContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  timeText: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    marginTop: 4,
  },
});