/**
 * Comment Service
 * Handles all comment-related API operations
 */

import { fetchAuthSession } from 'aws-amplify/auth';
import { awsConfig } from '@/config/aws-config';

const API_BASE_URL = awsConfig.apiUrl;

export interface Comment {
  comment_id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  likes_count: number;
  replies_count: number;
  created_at: string;
  user?: {
    username: string;
    avatar_url: string;
  };
  liked_by_current_user?: boolean;
  replies?: Comment[];
}

export interface AddCommentRequest {
  post_id: string;
  content: string;
  parent_comment_id?: string;
}

/**
 * Get authorization header with JWT token
 */
async function getAuthHeader(): Promise<{ Authorization: string }> {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (!token) {
      throw new Error('No authentication token available');
    }
    return { Authorization: `Bearer ${token}` };
  } catch (error) {
    console.error('Failed to get auth token:', error);
    throw error;
  }
}

/**
 * Fetch comments for a post
 */
export async function getComments(postId: string): Promise<Comment[]> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}post/${postId}/comments`, {
      method: 'GET',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`);
    }

    const data = await response.json();
    return data.comments || [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
}

/**
 * Add a new comment or reply
 */
export async function addComment(request: AddCommentRequest): Promise<Comment> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}post/${request.post_id}/comment`, {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: request.content,
        parent_comment_id: request.parent_comment_id || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add comment: ${response.statusText}`);
    }

    const data = await response.json();
    return data.comment;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string): Promise<void> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}comment/${commentId}`, {
      method: 'DELETE',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete comment: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}

/**
 * Like/unlike a comment
 */
export async function likeComment(commentId: string): Promise<{ liked: boolean; likes_count: number }> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}comment/${commentId}/like`, {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to like comment: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      liked: data.liked,
      likes_count: data.likes_count,
    };
  } catch (error) {
    console.error('Error liking comment:', error);
    throw error;
  }
}

/**
 * Organize comments into a nested thread structure
 */
export function organizeCommentsIntoThreads(comments: Comment[]): Comment[] {
  const commentMap = new Map<string, Comment>();
  const topLevelComments: Comment[] = [];

  // First pass: create map of all comments
  comments.forEach(comment => {
    commentMap.set(comment.comment_id, { ...comment, replies: [] });
  });

  // Second pass: organize into threads
  comments.forEach(comment => {
    const commentWithReplies = commentMap.get(comment.comment_id);
    if (!commentWithReplies) return;

    if (comment.parent_comment_id) {
      // This is a reply
      const parentComment = commentMap.get(comment.parent_comment_id);
      if (parentComment && parentComment.replies) {
        parentComment.replies.push(commentWithReplies);
      }
    } else {
      // This is a top-level comment
      topLevelComments.push(commentWithReplies);
    }
  });

  // Sort by created_at (newest first for top-level, oldest first for replies)
  topLevelComments.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  topLevelComments.forEach(comment => {
    if (comment.replies) {
      comment.replies.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }
  });

  return topLevelComments;
}
