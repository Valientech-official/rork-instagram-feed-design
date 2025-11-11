import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { X, Send } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Comment, PaginatedResponse } from '@/types/api';
import { getComments, createComment, getReplies } from '@/lib/api/comments';
import { handleError } from '@/lib/utils/errorHandler';
import CommentList from './CommentList';

interface CommentModalProps {
  visible: boolean;
  postId: string;
  onClose: () => void;
  initialCommentCount?: number;
}

export default function CommentModal({
  visible,
  postId,
  onClose,
  initialCommentCount = 0,
}: CommentModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});
  const inputRef = useRef<TextInput>(null);

  // 初回コメント読み込み
  useEffect(() => {
    if (visible) {
      loadComments();
    }
  }, [visible, postId]);

  const loadComments = async (refresh = false) => {
    if (loading) return;

    setLoading(true);
    if (refresh) {
      setRefreshing(true);
    }

    try {
      const response = await getComments(postId, {
        limit: 20,
        nextToken: refresh ? undefined : nextToken,
        sortBy: 'latest',
      });

      if (response.success && response.data) {
        const newComments = response.data.items;
        setComments(refresh ? newComments : [...comments, ...newComments]);
        setHasMore(!!response.data.nextToken);
        setNextToken(response.data.nextToken);
      }
    } catch (error: any) {
      const { message } = handleError(error, 'getComments');
      console.error('[CommentModal]', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setComments([]);
    setNextToken(undefined);
    loadComments(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadComments();
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || posting) return;

    setPosting(true);
    try {
      const response = await createComment(postId, {
        content: commentText.trim(),
        parent_comment_id: replyTo?.comment_id,
        reply_to_account_id: replyTo?.author.account_id,
      });

      if (response.success && response.data) {
        const newComment = response.data;

        if (replyTo) {
          // 返信の場合は親コメントのrepliesに追加
          setComments((prev) =>
            prev.map((comment) => {
              if (comment.comment_id === replyTo.comment_id) {
                return {
                  ...comment,
                  replies: comment.replies
                    ? [newComment, ...comment.replies]
                    : [newComment],
                  reply_count: comment.reply_count + 1,
                };
              }
              return comment;
            })
          );
        } else {
          // 新規コメントの場合はリストの先頭に追加
          setComments([newComment, ...comments]);
        }

        setCommentText('');
        setReplyTo(null);
      }
    } catch (error: any) {
      const { message } = handleError(error, 'createComment');
      console.error('[CommentModal]', message);
      alert('コメントの投稿に失敗しました');
    } finally {
      setPosting(false);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyTo(comment);
    inputRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyTo(null);
    setCommentText('');
  };

  const handleDeleteComment = (commentId: string) => {
    setComments((prev) => {
      const deleteRecursive = (comments: Comment[]): Comment[] => {
        return comments
          .filter((c) => c.comment_id !== commentId)
          .map((c) => ({
            ...c,
            replies: c.replies ? deleteRecursive(c.replies) : [],
            reply_count: c.replies
              ? c.replies.filter((r) => r.comment_id !== commentId).length
              : c.reply_count,
          }));
      };
      return deleteRecursive(prev);
    });
  };

  const handleLoadReplies = async (commentId: string) => {
    if (loadingReplies[commentId]) return;

    setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));

    try {
      const response = await getReplies(postId, commentId, {
        limit: 10,
        sortBy: 'latest',
      });

      if (response.success && response.data) {
        const replies = response.data.items;
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.comment_id === commentId) {
              return {
                ...comment,
                replies: replies,
              };
            }
            return comment;
          })
        );
      }
    } catch (error: any) {
      const { message } = handleError(error, 'getReplies');
      console.error('[CommentModal]', message);
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={Colors.light.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>まだコメントがありません</Text>
        <Text style={styles.emptyStateSubtext}>最初にコメントしてみましょう</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            コメント {comments.length > 0 && `(${comments.length})`}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        {/* コメントリスト */}
        <FlatList
          data={comments}
          keyExtractor={(item) => item.comment_id}
          renderItem={({ item }) => (
            <CommentList
              postId={postId}
              comments={[item]}
              onReply={handleReply}
              onDelete={handleDeleteComment}
              onLoadReplies={handleLoadReplies}
            />
          )}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />

        {/* 入力エリア */}
        <View style={styles.inputContainer}>
          {replyTo && (
            <View style={styles.replyBanner}>
              <Text style={styles.replyText}>
                @{replyTo.author.username} に返信中
              </Text>
              <TouchableOpacity onPress={handleCancelReply}>
                <X size={16} color={Colors.light.secondaryText} />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder={replyTo ? '返信を入力...' : 'コメントを入力...'}
              placeholderTextColor={Colors.light.secondaryText}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !commentText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handlePostComment}
              disabled={!commentText.trim() || posting}
            >
              {posting ? (
                <ActivityIndicator size="small" color={Colors.light.background} />
              ) : (
                <Send
                  size={20}
                  color={
                    commentText.trim()
                      ? Colors.light.background
                      : Colors.light.secondaryText
                  }
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  listContent: {
    flexGrow: 1,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.light.secondaryBackground,
  },
  replyText: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.light.text,
    backgroundColor: Colors.light.secondaryBackground,
    borderRadius: 20,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.light.secondaryBackground,
  },
});
