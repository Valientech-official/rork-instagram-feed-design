/**
 * Interaction Service
 * Handles all user interaction API operations (likes, reposts, follows)
 */

import { fetchAuthSession } from 'aws-amplify/auth';
import { awsConfig } from '@/config/aws-config';

const API_BASE_URL = awsConfig.apiUrl;

export interface UserProfile {
  account_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  is_following?: boolean;
  is_verified?: boolean;
  follower_count?: number;
  following_count?: number;
  is_mutual?: boolean;
}

export interface PostItem {
  post_id: string;
  image_url: string;
  caption?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user?: UserProfile;
}

export interface LikedPost extends PostItem {
  liked_at: string;
}

export interface RepostedPost extends PostItem {
  reposted_at: string;
}

export interface PostLike {
  account_id: string;
  user: UserProfile;
  liked_at: string;
}

export interface PostRepost {
  account_id: string;
  user: UserProfile;
  reposted_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  has_more: boolean;
  next_offset?: number;
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
 * Get user's liked posts
 */
export async function getLikedPosts(
  limit: number = 30,
  offset: number = 0
): Promise<PaginatedResponse<LikedPost>> {
  try {
    const authHeader = await getAuthHeader();
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(`${API_BASE_URL}account/likes?${queryParams}`, {
      method: 'GET',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get liked posts: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      items: data.posts || [],
      total_count: data.total_count || 0,
      has_more: data.has_more || false,
      next_offset: data.next_offset,
    };
  } catch (error) {
    console.error('Error getting liked posts:', error);
    throw error;
  }
}

/**
 * Get users who liked a post
 */
export async function getPostLikes(
  postId: string,
  limit: number = 50,
  offset: number = 0
): Promise<PaginatedResponse<PostLike>> {
  try {
    const authHeader = await getAuthHeader();
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(`${API_BASE_URL}post/${postId}/likes?${queryParams}`, {
      method: 'GET',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get post likes: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      items: data.likes || [],
      total_count: data.total_count || 0,
      has_more: data.has_more || false,
      next_offset: data.next_offset,
    };
  } catch (error) {
    console.error('Error getting post likes:', error);
    throw error;
  }
}

/**
 * Unlike a post
 */
export async function unlikePost(postId: string): Promise<void> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}post/${postId}/like`, {
      method: 'DELETE',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to unlike post: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error unliking post:', error);
    throw error;
  }
}

/**
 * Get user's reposted posts
 */
export async function getRepostedPosts(
  limit: number = 30,
  offset: number = 0
): Promise<PaginatedResponse<RepostedPost>> {
  try {
    const authHeader = await getAuthHeader();
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(`${API_BASE_URL}account/reposts?${queryParams}`, {
      method: 'GET',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get reposted posts: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      items: data.posts || [],
      total_count: data.total_count || 0,
      has_more: data.has_more || false,
      next_offset: data.next_offset,
    };
  } catch (error) {
    console.error('Error getting reposted posts:', error);
    throw error;
  }
}

/**
 * Get users who reposted a post
 */
export async function getPostReposts(
  postId: string,
  limit: number = 50,
  offset: number = 0
): Promise<PaginatedResponse<PostRepost>> {
  try {
    const authHeader = await getAuthHeader();
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(`${API_BASE_URL}post/${postId}/reposts?${queryParams}`, {
      method: 'GET',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get post reposts: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      items: data.reposts || [],
      total_count: data.total_count || 0,
      has_more: data.has_more || false,
      next_offset: data.next_offset,
    };
  } catch (error) {
    console.error('Error getting post reposts:', error);
    throw error;
  }
}

/**
 * Unrepost a post
 */
export async function unrepostPost(postId: string): Promise<void> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}post/${postId}/repost`, {
      method: 'DELETE',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to unrepost post: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error unreposting post:', error);
    throw error;
  }
}

/**
 * Get user's followers
 */
export async function getFollowers(
  accountId: string,
  limit: number = 50,
  offset: number = 0
): Promise<PaginatedResponse<UserProfile>> {
  try {
    const authHeader = await getAuthHeader();
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(`${API_BASE_URL}account/${accountId}/followers?${queryParams}`, {
      method: 'GET',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get followers: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      items: data.followers || [],
      total_count: data.total_count || 0,
      has_more: data.has_more || false,
      next_offset: data.next_offset,
    };
  } catch (error) {
    console.error('Error getting followers:', error);
    throw error;
  }
}

/**
 * Get users that account is following
 */
export async function getFollowing(
  accountId: string,
  limit: number = 50,
  offset: number = 0
): Promise<PaginatedResponse<UserProfile>> {
  try {
    const authHeader = await getAuthHeader();
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(`${API_BASE_URL}account/${accountId}/following?${queryParams}`, {
      method: 'GET',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get following: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      items: data.following || [],
      total_count: data.total_count || 0,
      has_more: data.has_more || false,
      next_offset: data.next_offset,
    };
  } catch (error) {
    console.error('Error getting following:', error);
    throw error;
  }
}

/**
 * Follow/unfollow an account
 */
export async function toggleFollow(accountId: string): Promise<{ is_following: boolean }> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}account/${accountId}/follow`, {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to toggle follow: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      is_following: data.is_following,
    };
  } catch (error) {
    console.error('Error toggling follow:', error);
    throw error;
  }
}

/**
 * Remove a follower (only for own profile)
 */
export async function removeFollower(accountId: string): Promise<void> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}account/followers/${accountId}`, {
      method: 'DELETE',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to remove follower: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error removing follower:', error);
    throw error;
  }
}
