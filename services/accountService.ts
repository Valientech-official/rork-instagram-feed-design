/**
 * Account Service
 * Handles all account-related API operations including search
 */

import { fetchAuthSession } from 'aws-amplify/auth';
import { awsConfig } from '@/config/aws-config';

const API_BASE_URL = awsConfig.apiUrl;

export interface SearchAccountResult {
  account_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  is_following?: boolean;
  is_verified?: boolean;
  follower_count?: number;
  following_count?: number;
}

export interface SearchAccountsRequest {
  query: string;
  limit?: number;
  offset?: number;
}

export interface SearchAccountsResponse {
  accounts: SearchAccountResult[];
  total_count: number;
  has_more: boolean;
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
 * Search accounts by username or handle
 */
export async function searchAccounts(params: SearchAccountsRequest): Promise<SearchAccountsResponse> {
  try {
    const authHeader = await getAuthHeader();
    const queryParams = new URLSearchParams({
      query: params.query,
      limit: (params.limit || 20).toString(),
      offset: (params.offset || 0).toString(),
    });

    const response = await fetch(`${API_BASE_URL}account/search?${queryParams}`, {
      method: 'GET',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to search accounts: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accounts: data.accounts || [],
      total_count: data.total_count || 0,
      has_more: data.has_more || false,
    };
  } catch (error) {
    console.error('Error searching accounts:', error);
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
