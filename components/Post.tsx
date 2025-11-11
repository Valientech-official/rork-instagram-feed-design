import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MessageCircle } from 'lucide-react-native';
import { Post as PostType } from '@/types/api';
import ImageCarousel from './ImageCarousel';
import DoubleTapLike from './DoubleTapLike';
import PostDetailModal from './PostDetailModal';
import CommentModal from './CommentModal';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';
import { usePostsStore } from '@/store/postsStore';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth;

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.shopCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'center',
    width: '100%',
  },
  headerRow: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  userTextContainer: {
    flex: 1,
  },
  username: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  location: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  caption: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  moreLessButton: {
    marginTop: 4,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  statText: {
    color: colors.text,
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '500',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timestamp: {
    fontSize: 12,
    color: colors.secondaryText,
  },
});

interface PostProps {
  post: PostType;
}

const CAPTION_PREVIEW_LENGTH = 120;
const POST_IMAGE_ASPECT_RATIO: '4:5' = '4:5';

export default function Post({ post }: PostProps) {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  // Posts store for like/unlike actions
  const { likePost, unlikePost } = usePostsStore();

  // デバッグ: 投稿データを確認
  if (__DEV__) {
    console.log('[Post] Rendering post:', {
      postId: post.postId,
      author: post.author?.username,
      mediaUrls_count: post.mediaUrls?.length || 0,
      first_media_url: post.mediaUrls?.[0]?.substring(0, 50),
    });
  }

  // postIdがない場合は表示しない
  if (!post.postId) {
    console.error('[Post] postId is missing:', post);
    return null;
  }

  // Use post data from store
  const liked = post.isLiked ?? false;
  const likes = post.likeCount ?? 0;

  const handleLike = async () => {
    try {
      if (liked) {
        await unlikePost(post.postId);
      } else {
        await likePost(post.postId);
      }
    } catch (error) {
      console.error('[Post] handleLike error:', error);
    }
  };

  const handleDoubleTap = async () => {
    if (!liked) {
      setShowLikeAnimation(true);
      try {
        await likePost(post.postId);
      } catch (error) {
        console.error('[Post] handleDoubleTap error:', error);
      }
    }
  };

  const handleLikeAnimationComplete = () => {
    setShowLikeAnimation(false);
  };

  const handleImagePress = () => {
    setShowDetailModal(true);
  };

  const handleCommentPress = () => {
    setShowCommentModal(true);
  };

  const { captionToDisplay, isLongCaption } = useMemo(() => {
    const content = post.content || '';
    const isLong = content.length > CAPTION_PREVIEW_LENGTH;
    return {
      captionToDisplay: showFullCaption || !isLong
        ? content
        : `${content.substring(0, CAPTION_PREVIEW_LENGTH)}…`,
      isLongCaption: isLong,
    };
  }, [post.content, showFullCaption]);

  return (
    <>
      <View style={styles.container}>
        {/* Row 1: User Info, Caption & Actions */}
        <View style={styles.headerRow}>
          <View style={styles.topLine}>
            <View style={styles.userInfo}>
              <Image
                source={{ uri: post.author.profile_image }}
                style={styles.avatar}
                contentFit="cover"
              />
              <View style={styles.userTextContainer}>
                <Text style={styles.username}>{post.author.username}</Text>
              </View>
            </View>

            <View style={styles.stats}>
              <TouchableOpacity style={styles.statItem} onPress={handleLike}>
                <Heart
                  size={20}
                  color={liked ? colors.like : colors.icon}
                  fill={liked ? colors.like : 'transparent'}
                />
                <Text style={styles.statText}>{likes}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.statItem} onPress={handleCommentPress}>
                <MessageCircle size={20} color={colors.icon} />
                <Text style={styles.statText}>{post.commentCount}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.caption}>
            {captionToDisplay}
          </Text>
          {isLongCaption && (
            <TouchableOpacity onPress={() => setShowFullCaption(prev => !prev)}>
              <Text style={styles.moreLessButton}>
                {showFullCaption ? '閉じる' : 'もっと見る'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Row 2: Image */}
        <View style={styles.imageWrapper}>
          <ImageCarousel
            images={post.mediaUrls || []}
            onDoubleTap={handleDoubleTap}
            onPress={handleImagePress}
            width={CARD_WIDTH}
            aspectRatio={POST_IMAGE_ASPECT_RATIO}
          />
          <DoubleTapLike
            visible={showLikeAnimation}
            liked={liked}
            onAnimationComplete={handleLikeAnimationComplete}
          />
        </View>

        {/* Footer: Timestamp */}
        <View style={styles.footer}>
          <Text style={styles.timestamp}>{post.createdAt}</Text>
        </View>
      </View>

      <PostDetailModal
        visible={showDetailModal}
        post={post}
        onClose={() => setShowDetailModal(false)}
      />

      <CommentModal
        visible={showCommentModal}
        postId={post.postId}
        onClose={() => setShowCommentModal(false)}
        initialCommentCount={post.commentCount}
      />
    </>
  );
}
