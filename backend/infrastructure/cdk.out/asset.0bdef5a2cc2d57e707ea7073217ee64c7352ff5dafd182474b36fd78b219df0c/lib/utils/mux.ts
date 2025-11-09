/**
 * Mux API クライアントユーティリティ
 *
 * Secrets Managerから認証情報を取得し、Muxクライアントを初期化
 */

import Mux from '@mux/mux-node';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

interface MuxCredentials {
  accessTokenId: string;
  secretKey: string;
  webhookSecret: string;
}

let cachedCredentials: MuxCredentials | null = null;
let muxClientCache: Mux | null = null;

/**
 * Secrets ManagerからMux認証情報を取得
 */
async function getMuxCredentials(): Promise<MuxCredentials> {
  if (cachedCredentials) {
    return cachedCredentials;
  }

  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION || 'ap-northeast-1',
  });

  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: 'rork/mux-credentials',
      })
    );

    if (!response.SecretString) {
      throw new Error('Mux credentials not found in Secrets Manager');
    }

    cachedCredentials = JSON.parse(response.SecretString) as MuxCredentials;
    return cachedCredentials;
  } catch (error) {
    console.error('Failed to get Mux credentials:', error);
    throw new Error('Failed to retrieve Mux credentials');
  }
}

/**
 * Muxクライアントを取得（キャッシュ付き）
 */
export async function getMuxClient(): Promise<Mux> {
  if (muxClientCache) {
    return muxClientCache;
  }

  const credentials = await getMuxCredentials();

  // Mux v7 API
  muxClientCache = new Mux(
    credentials.accessTokenId,
    credentials.secretKey
  );

  return muxClientCache;
}

/**
 * Webhook署名を検証
 */
export async function verifyMuxWebhook(
  payload: string,
  headers: Record<string, string | string[] | undefined>
): Promise<any> {
  const credentials = await getMuxCredentials();

  try {
    // Mux v7 SDK のWebhooks APIを使用
    const { Webhooks } = Mux;
    const event = Webhooks.verifyHeader(payload, headers['mux-signature'] as string, credentials.webhookSecret);
    return event;
  } catch (error) {
    console.error('Webhook verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
}

/**
 * Muxエラーハンドリング
 */
export function handleMuxError(error: unknown): Error {
  // Mux v7ではエラーハンドリングが異なる
  if (error instanceof Error) {
    console.error('Mux Error:', {
      name: error.name,
      message: error.message,
    });
    return new Error(`Mux error: ${error.message}`);
  }

  return new Error('Unknown Mux error occurred');
}
