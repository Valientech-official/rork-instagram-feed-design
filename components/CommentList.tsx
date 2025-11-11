import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Heart, Trash2, MessageCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Comment } from '@/types/api';
import { useAuthStore } from '@/store/authStore';
import { likeComment, unlikeComment, deleteComment } from '@/lib/api/comments';
import { handleError } from '@/lib/utils/errorHandler';

interface CommentListProps {
  postId: string;
  comments: Comment[];
  onReply: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  onLoadReplies?: (commentId: string) => void;
  level?: number;
}

interface CommentItemProps {
  postId: string;
  comment: Comment;
  onReply: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  onLoadReplies?: (commentId: string) => void;
  level: number;
}

function CommentItem({ postId, comment, onReply, onDelete, onLoadReplies, level }: CommentItemProps) {
  const { user } = useAuthStore();
  const [liked, setLiked] = useState(comment.is_liked || false);
  const [likeCount, setLikeCount] = useState(comment.like_count);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isMyComment = user?.sub === comment.author.account_id;
  const indent = level * 24;

  const handleLike = async () => {
    if (liking) return;

    const previousLiked = liked;
    const previousCount = likeCount;

    // 楽観的UI更新
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    setLiking(true);

    try {
      if (previousLiked) {
        await unlikeComment(postId, comment.comment_id);
      } else {
        const response = await likeComment(postId, comment.comment_id);
        if (response.success && response.data) {
          setLiked(response.data.liked);
          setLikeCount(response.data.like_count);
        }
      }
    } catch (error: any) {
      // エラー時はロールバック
      setLiked(previousLiked);
      setLikeCount(previousCount);
      const { message } = handleError(error, 'likeComment');
      console.error('[CommentItem]', message);
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;

    setDeleting(true);
    try {
      await deleteComment(postId, comment.comment_id);
      onDelete(comment.comment_id);
    } catch (error: any) {
      const { message } = handleError(error, 'deleteComment');
      console.error('[CommentItem]', message);
      alert('コメントの削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}秒前`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分前`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}時間前`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}日前`;
    return date.toLocaleDateString('ja-JP');
  };

  return (
    <View style={[styles.commentItem, { marginLeft: indent }]}>
      <Image
        source={{ uri: comment.author.profile_image || 'https://via.placeholder.com/40' }}
        style={styles.avatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.username}>{comment.author.username}</Text>
          <Text style={styles.timestamp}>{formatTimestamp(comment.created_at)}</Text>
        </View>
        <Text style={styles.content}>{comment.content}</Text>

        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLike}
            disabled={liking}
          >
            <Heart
              size={16}
              color={liked ? Colors.light.error : Colors.light.secondaryText}
              fill={liked ? Colors.light.error : 'none'}
            />
            {likeCount > 0 && <Text style={styles.actionText}>{likeCount}</Text>}
          </TouchableOpacity>

          {level < 2 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onReply(comment)}
            >
              <MessageCircle size={16} color={Colors.light.secondaryText} />
              <Text style={styles.actionText}>返信</Text>
            </TouchableOpacity>
          )}

          {isMyComment && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={Colors.light.error} />
              ) : (
                <>
                  <Trash2 size={16} color={Colors.light.error} />
                  <Text style={[styles.actionText, { color: Colors.light.error }]}>削除</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {comment.reply_count > 0 && level < 2 && onLoadReplies && (
          <TouchableOpacity
            style={styles.loadRepliesButton}
            onPress={() => onLoadReplies(comment.comment_id)}
          >
            <Text style={styles.loadRepliesText}>
              返信を表示 ({comment.reply_count})
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function CommentList({
  postId,
  comments,
  onReply,
  onDelete,
  onLoadReplies,
  level = 0,
}: CommentListProps) {
  return (
    <View style={styles.container}>
      {comments.map((comment) => (
        <View key={comment.comment_id}>
          <CommentItem
            postId={postId}
            comment={comment}
            onReply={onReply}
            onDelete={onDelete}
            onLoadReplies={onLoadReplies}
            level={level}
          />
          {comment.replies && comment.replies.length > 0 && (
            <CommentList
              postId={postId}
              comments={comment.replies}
              onReply={onReply}
              onDelete={onDelete}
              onLoadReplies={onLoadReplies}
              level={level + 1}
            />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.light.secondaryText,
  },
  content: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },
  loadRepliesButton: {
    marginTop: 8,
  },
  loadRepliesText: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: '500',
  },
});
