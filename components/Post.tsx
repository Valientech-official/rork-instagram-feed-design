import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MessageCircle } from 'lucide-react-native';
import { Post as PostType } from '@/mocks/posts';
import ProfileCommentModal from './ProfileCommentModal';
import Colors from '@/constants/colors';

interface PostProps {
  post: PostType;
}

export default function Post({ post }: PostProps) {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [showCommentModal, setShowCommentModal] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  const handleCommentPress = () => {
    setShowCommentModal(true);
  };

  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '…';
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.contentRow}>
          {/* Left: Image */}
          <View style={styles.imageSection}>
            <Image
              source={{ uri: post.images[0] }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          </View>

          {/* Right: User Info & Caption */}
          <View style={styles.infoSection}>
            <View style={styles.userInfo}>
              <Image
                source={{ uri: post.user.avatar }}
                style={styles.avatar}
                contentFit="cover"
              />
              <View style={styles.userTextContainer}>
                <Text style={styles.username}>{post.user.username}</Text>
                {post.location && (
                  <Text style={styles.location}>{post.location}</Text>
                )}
              </View>
            </View>

            <Text style={styles.caption} numberOfLines={3}>
              {truncateText(post.caption)}
            </Text>

            <View style={styles.stats}>
              <TouchableOpacity style={styles.statItem} onPress={handleLike}>
                <Heart
                  size={18}
                  color={liked ? Colors.light.like : Colors.light.icon}
                  fill={liked ? Colors.light.like : 'transparent'}
                />
                <Text style={styles.statText}>{likes}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.statItem} onPress={handleCommentPress}>
                <MessageCircle size={18} color={Colors.light.icon} />
                <Text style={styles.statText}>{post.comments}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.timestamp}>{post.timestamp}</Text>
          </View>
        </View>
      </View>

      <ProfileCommentModal
        visible={showCommentModal}
        postId={post.id}
        onClose={() => setShowCommentModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  contentRow: {
    flexDirection: 'row',
  },
  imageSection: {
    width: '50%',
  },
  image: {
    width: '100%',
    height: 280,
  },
  infoSection: {
    width: '50%',
    padding: 12,
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  userTextContainer: {
    flex: 1,
  },
  username: {
    color: Colors.light.text,
    fontWeight: '600',
    fontSize: 14,
  },
  location: {
    fontSize: 11,
    color: Colors.light.secondaryText,
    marginTop: 2,
  },
  caption: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    color: Colors.light.text,
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 11,
    color: Colors.light.secondaryText,
  },
});