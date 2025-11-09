import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MessageCircle } from 'lucide-react-native';
import { Post as PostType } from '@/mocks/posts';
import ImageCarousel from './ImageCarousel';
import DoubleTapLike from './DoubleTapLike';
import PostDetailModal from './PostDetailModal';
import Colors from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

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
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const { theme } = useThemeStore();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  const handleDoubleTap = () => {
    if (!liked) {
      setLiked(true);
      setLikes(prev => prev + 1);
      setShowLikeAnimation(true);
    }
  };

  const handleLikeAnimationComplete = () => {
    setShowLikeAnimation(false);
  };

  const handleImagePress = () => {
    setShowDetailModal(true);
  };

  const { captionToDisplay, isLongCaption } = useMemo(() => {
    const isLong = post.caption.length > CAPTION_PREVIEW_LENGTH;
    return {
      captionToDisplay: showFullCaption || !isLong
        ? post.caption
        : `${post.caption.substring(0, CAPTION_PREVIEW_LENGTH)}…`,
      isLongCaption: isLong,
    };
  }, [post.caption, showFullCaption]);

  return (
    <>
      <View style={styles.container}>
        {/* Row 1: User Info, Caption & Actions */}
        <View style={styles.headerRow}>
          <View style={styles.topLine}>
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

            <View style={styles.stats}>
              <TouchableOpacity style={styles.statItem} onPress={handleLike}>
                <Heart
                  size={20}
                  color={liked ? colors.like : colors.icon}
                  fill={liked ? colors.like : 'transparent'}
                />
                <Text style={styles.statText}>{likes}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.statItem} onPress={handleImagePress}>
                <MessageCircle size={20} color={colors.icon} />
                <Text style={styles.statText}>{post.comments}</Text>
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
            images={post.images}
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
          <Text style={styles.timestamp}>{post.timestamp}</Text>
        </View>
      </View>

      <PostDetailModal
        visible={showDetailModal}
        post={{ ...post, liked, likes }}
        onClose={() => setShowDetailModal(false)}
      />
    </>
  );
}
