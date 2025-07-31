import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Hand, MessageCircle, Video } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { roomPosts } from '@/mocks/roomPosts';
import ProfileCommentModal from '@/components/ProfileCommentModal';

const { width } = Dimensions.get('window');

export default function NextTrendRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const nextTrendPosts = roomPosts.filter(post => post.roomName === 'NextトレンドRoom');
  const [peacedPosts, setPeacedPosts] = useState<{[key: string]: boolean}>({});
  const [postComments, setPostComments] = useState<{[key: string]: any[]}>({});
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');

  // Initialize comments for each post
  React.useEffect(() => {
    const initialComments: {[key: string]: any[]} = {};
    nextTrendPosts.forEach(post => {
      initialComments[post.id] = [
        { id: '1', username: 'ユーザー1', text: 'このトレンド気になります！どこで買えますか？', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face' },
        { id: '2', username: 'ユーザー2', text: '来シーズンに取り入れたいです✨参考になります', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' },
        { id: '3', username: 'ユーザー3', text: 'すごくおしゃれですね！', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face' },
      ];
    });
    setPostComments(initialComments);
  }, []);

  const handlePeace = (postId: string) => {
    setPeacedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleCommentPress = (postId: string) => {
    setSelectedPostId(postId);
    setCommentModalVisible(true);
  };

  const handleCloseCommentModal = () => {
    setCommentModalVisible(false);
    setSelectedPostId('');
  };

  const getAdditionalContent = (index: number): string => {
    switch (index) {
      case 0:
        return `

2025年春夏の最新トレンドをチェック！
パステルカラーとオーバーサイズが注目です🌸
皆さんはどのトレンドが気になりますか？`;
      case 1:
        return `

Y2Kファッションが再ブーム！
メタリック素材とローライズが復活中✨
90年代〜2000年代のアイテムを取り入れてみませんか？`;
      case 2:
        return `

サステナブルファッションがトレンド！
環境に優しい素材とリサイクル素材が人気🌱
エシカルなブランドもチェックしてみて！`;
      default:
        return "";
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: "",
          headerStyle: {
            backgroundColor: Colors.light.background,
          },
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>NextトレンドRoom</Text>
          <TouchableOpacity 
            style={styles.liveButton}
            onPress={() => router.push('/live')}
          >
            <Video size={16} color="white" />
            <Text style={styles.liveButtonText}>Live</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Posts List */}
          {nextTrendPosts.map((post, index) => (
            <View key={post.id}>
              {/* Post Display Section */}
              <View style={styles.postSection}>
                <View style={styles.postImageContainer}>
                  <Image 
                    source={{ uri: post.images?.[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000' }} 
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                </View>
                
                <View style={styles.postInfoContainer}>
                  <View style={styles.authorSection}>
                    <Image 
                      source={{ uri: post.user?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80' }} 
                      style={styles.authorAvatar}
                    />
                    <View style={styles.authorInfo}>
                      <Text style={styles.authorName}>{post.user?.username || 'ユーザー'}</Text>
                      <Text style={styles.postTime}>{post.timestamp}</Text>
                    </View>
                  </View>
                  
                  <ScrollView style={styles.postCommentContainer} showsVerticalScrollIndicator={false}>
                    <Text style={styles.postComment}>
                      {post.caption}{getAdditionalContent(index)}
                    </Text>
                  </ScrollView>
                </View>
              </View>
              
              {/* Action Buttons */}
              <View style={styles.actionSection}>
                <View style={styles.actionButtonContainer}>
                  <TouchableOpacity 
                    style={[styles.iconButton, peacedPosts[post.id] && styles.peacedIconButton]} 
                    onPress={() => handlePeace(post.id)}
                  >
                    <Hand size={20.8} color={peacedPosts[post.id] ? 'white' : Colors.light.secondaryText} />
                  </TouchableOpacity>
                  <Text style={[styles.actionText, peacedPosts[post.id] && styles.peacedText]}>
                    ピース {(post.likes || 0) + (peacedPosts[post.id] ? 1 : 0)}
                  </Text>
                </View>
                
                <View style={styles.actionButtonContainer}>
                  <TouchableOpacity 
                    style={styles.iconButton}
                    onPress={() => handleCommentPress(post.id)}
                  >
                    <MessageCircle size={20.8} color={Colors.light.secondaryText} />
                  </TouchableOpacity>
                  <Text style={styles.actionText}>コメント {(postComments[post.id] || []).length}</Text>
                </View>
              </View>
              
              {/* Comments Preview */}
              <View style={styles.commentsPreview}>
                {(postComments[post.id] || []).slice(0, 2).map((comment, commentIndex) => {
                  const displayText = comment.text.length > 50 ? comment.text.substring(0, 50) + '...' : comment.text;
                  return (
                    <View key={comment.id} style={styles.commentItem}>
                      <Image 
                        source={{ uri: comment.avatar }} 
                        style={styles.commentAvatar}
                      />
                      <View style={styles.commentContent}>
                        <Text style={styles.commentUsername}>{comment.username}</Text>
                        <Text style={styles.commentText}>{displayText}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
              
              {/* Separator between posts */}
              {index < nextTrendPosts.length - 1 && <View style={styles.postSeparator} />}
            </View>
          ))}
        </ScrollView>
      </View>
      
      <ProfileCommentModal
        visible={commentModalVisible}
        postId={selectedPostId}
        onClose={handleCloseCommentModal}
      />
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
    marginLeft: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  liveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FF4444',
  },
  liveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  postSection: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,

  },
  postImageContainer: {
    width: width * 0.45,
    aspectRatio: 1 / 1.2,
    marginRight: 16,
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  postInfoContainer: {
    flex: 1,
    height: width * 0.45 * 1.2,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  postTime: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    marginTop: 2,
  },
  postCommentContainer: {
    flex: 1,
  },
  postComment: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  actionSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 9.6,
  },
  actionButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  iconButton: {
    padding: 6.4,
    borderRadius: 16,
    backgroundColor: Colors.light.shopBackground,
    marginRight: 6.4,
  },
  peacedIconButton: {
    backgroundColor: '#FF4444',
  },
  actionText: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },
  peacedText: {
    color: Colors.light.primary,
  },

  postSeparator: {
    height: 8,
    backgroundColor: Colors.light.separator,
    marginVertical: 16,
  },
  commentsPreview: {
    paddingHorizontal: 16,
    paddingBottom: 9.6,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6.4,
  },
  commentAvatar: {
    width: 19.2,
    height: 19.2,
    borderRadius: 9.6,
    marginRight: 6.4,
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    lineHeight: 16,
  },
});