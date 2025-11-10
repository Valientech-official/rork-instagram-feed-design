/**
 * Hashtag Service
 * Handles all hashtag-related API operations
 */

import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.API_URL || 'https://b6om6sz99f.execute-api.ap-northeast-1.amazonaws.com/dev/';

export interface Post {
  post_id: string;
  account_id: string;
  media_urls: string[];
  caption?: string;
  created_at: string;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

export interface HashtagInfo {
  tag: string;
  post_count: number;
  is_following: boolean;
}

export interface GetHashtagPostsRequest {
  tag: string;
  sort?: 'top' | 'recent';
  limit?: number;
  offset?: number;
}

export interface GetHashtagPostsResponse {
  posts: Post[];
  total_count: number;
  has_more: boolean;
}

/**
 * Get authorization header with mock token (Cognito disabled for Expo Go)
 */
async function getAuthHeader(): Promise<{ Authorization: string }> {
  console.log('⚠️ Using mock auth token (Cognito disabled for Expo Go)');
  return { Authorization: `Bearer mock_token_for_expo_go` };
}

/**
 * Get hashtag information
 */
export async function getHashtagInfo(tag: string): Promise<HashtagInfo> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}hashtag/${encodeURIComponent(tag)}`, {
      method: 'GET',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get hashtag info: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      tag: data.tag,
      post_count: data.post_count || 0,
      is_following: data.is_following || false,
    };
  } catch (error) {
    console.error('Error getting hashtag info:', error);
    throw error;
  }
}

/**
 * Get posts for a specific hashtag
 */
export async function getHashtagPosts(params: GetHashtagPostsRequest): Promise<GetHashtagPostsResponse> {
  try {
    const authHeader = await getAuthHeader();
    const queryParams = new URLSearchParams({
      sort: params.sort || 'recent',
      limit: (params.limit || 30).toString(),
      offset: (params.offset || 0).toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}hashtag/${encodeURIComponent(params.tag)}/posts?${queryParams}`,
      {
        method: 'GET',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get hashtag posts: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      posts: data.posts || [],
      total_count: data.total_count || 0,
      has_more: data.has_more || false,
    };
  } catch (error) {
    console.error('Error getting hashtag posts:', error);
    throw error;
  }
}

/**
 * Follow/unfollow a hashtag
 */
export async function followHashtag(tag: string): Promise<{ is_following: boolean }> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}hashtag/${encodeURIComponent(tag)}/follow`, {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to follow hashtag: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      is_following: data.is_following,
    };
  } catch (error) {
    console.error('Error following hashtag:', error);
    throw error;
  }
}
