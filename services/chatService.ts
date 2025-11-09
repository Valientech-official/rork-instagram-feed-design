/**
 * Chat Service
 * Handles all chat/conversation-related API operations
 */

import { fetchAuthSession } from 'aws-amplify/auth';
import { awsConfig } from '@/config/aws-config';

const API_BASE_URL = awsConfig.apiUrl;

export interface Conversation {
  conversation_id: string;
  participant_ids: string[];
  participant_usernames?: string[];
  participant_avatars?: string[];
  last_message?: string;
  last_message_timestamp?: string;
  unread_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateConversationRequest {
  participant_id: string;
}

export interface CreateConversationResponse {
  conversation: Conversation;
  is_new: boolean;
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
 * Create a new conversation or get existing one
 */
export async function createConversation(
  request: CreateConversationRequest
): Promise<CreateConversationResponse> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}chat/conversation/create`, {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        participant_id: request.participant_id,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create conversation: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      conversation: data.conversation,
      is_new: data.is_new || false,
    };
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

/**
 * Get list of all conversations for the current user
 */
export async function getConversations(): Promise<Conversation[]> {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}chat/conversations`, {
      method: 'GET',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch conversations: ${response.statusText}`);
    }

    const data = await response.json();
    return data.conversations || [];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}
