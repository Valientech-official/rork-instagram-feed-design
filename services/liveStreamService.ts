/**
 * Live Stream Service
 * Handles all live streaming API operations with Mux integration
 */

import { fetchAuthSession } from 'aws-amplify/auth';
import { awsConfig } from '@/config/aws-config';

const API_BASE_URL = awsConfig.apiUrl;

export interface LiveStream {
  stream_id: string;
  account_id: string;
  title: string;
  description?: string;
  status: 'preparing' | 'live' | 'ended';
  privacy: 'public' | 'followers_only';
  viewer_count: number;
  peak_viewers: number;
  total_likes: number;
  stream_key?: string;
  playback_url?: string;
  mux_stream_id?: string;
  mux_playback_id?: string;
  thumbnail_url?: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LiveStreamStats {
  stream_id: string;
  current_viewers: number;
  peak_viewers: number;
  total_likes: number;
  total_comments: number;
  average_watch_time: number;
  duration: number;
}

export interface LiveComment {
  comment_id: string;
  stream_id: string;
  account_id: string;
  username: string;
  avatar_url?: string;
  text: string;
  is_pinned: boolean;
  created_at: string;
}

export interface CreateLiveStreamRequest {
  title: string;
  description?: string;
  privacy?: 'public' | 'followers_only';
}

export interface CreateLiveStreamResponse {
  stream: LiveStream;
  stream_key: string;
  rtmp_url: string;
  playback_url: string;
}

export interface LiveStreamHistoryItem {
  stream_id: string;
  title: string;
  thumbnail_url?: string;
  peak_viewers: number;
  total_views: number;
  duration: number;
  started_at: string;
  ended_at?: string;
  has_replay: boolean;
  replay_url?: string;
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
 * Create a new live stream
 */
export async function createLiveStream(
  request: CreateLiveStreamRequest
): Promise<CreateLiveStreamResponse> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}live/create`, {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to create live stream: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating live stream:', error);
    throw error;
  }
}

/**
 * Get live stream details and playback URL
 */
export async function getLiveStream(streamId: string): Promise<LiveStream> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}live/${streamId}`, {
      method: 'GET',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch live stream: ${response.statusText}`);
    }

    const data = await response.json();
    return data.stream;
  } catch (error) {
    console.error('Error fetching live stream:', error);
    throw error;
  }
}

/**
 * Get live stream statistics
 */
export async function getLiveStreamStats(
  streamId: string
): Promise<LiveStreamStats> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}live/${streamId}/stats`, {
      method: 'GET',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stream stats: ${response.statusText}`);
    }

    const data = await response.json();
    return data.stats;
  } catch (error) {
    console.error('Error fetching stream stats:', error);
    throw error;
  }
}

/**
 * Get real-time comments for a live stream
 */
export async function getLiveComments(
  streamId: string,
  limit: number = 50
): Promise<LiveComment[]> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(
      `${API_BASE_URL}live/${streamId}/comments?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
      }
    );

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
 * Send a comment to a live stream
 */
export async function sendLiveComment(
  streamId: string,
  text: string
): Promise<LiveComment> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}live/${streamId}/comment`, {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send comment: ${response.statusText}`);
    }

    const data = await response.json();
    return data.comment;
  } catch (error) {
    console.error('Error sending comment:', error);
    throw error;
  }
}

/**
 * Like a live stream
 */
export async function likeLiveStream(streamId: string): Promise<void> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}live/${streamId}/like`, {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to like stream: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error liking stream:', error);
    throw error;
  }
}

/**
 * End a live stream
 */
export async function endLiveStream(streamId: string): Promise<void> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}live/${streamId}/end`, {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to end stream: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error ending stream:', error);
    throw error;
  }
}

/**
 * Update live stream settings
 */
export async function updateLiveStreamSettings(
  streamId: string,
  settings: {
    title?: string;
    description?: string;
    privacy?: 'public' | 'followers_only';
  }
): Promise<void> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}live/${streamId}/settings`, {
      method: 'PUT',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error(`Failed to update settings: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}

/**
 * Delete a live stream comment
 */
export async function deleteLiveComment(
  streamId: string,
  commentId: string
): Promise<void> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(
      `${API_BASE_URL}live/${streamId}/comment/${commentId}`,
      {
        method: 'DELETE',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete comment: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}

/**
 * Get live stream history
 */
export async function getLiveStreamHistory(): Promise<LiveStreamHistoryItem[]> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}live/history`, {
      method: 'GET',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.statusText}`);
    }

    const data = await response.json();
    return data.streams || [];
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
}

/**
 * Delete a live stream
 */
export async function deleteLiveStream(streamId: string): Promise<void> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}live/${streamId}`, {
      method: 'DELETE',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete stream: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting stream:', error);
    throw error;
  }
}

/**
 * Get replay URL for a past stream
 */
export async function getLiveStreamReplay(streamId: string): Promise<string> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}live/${streamId}/replay`, {
      method: 'GET',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get replay URL: ${response.statusText}`);
    }

    const data = await response.json();
    return data.replay_url;
  } catch (error) {
    console.error('Error getting replay URL:', error);
    throw error;
  }
}
