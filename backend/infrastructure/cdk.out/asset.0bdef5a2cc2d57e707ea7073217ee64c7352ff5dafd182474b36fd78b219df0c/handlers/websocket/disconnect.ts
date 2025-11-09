/**
 * WebSocket切断ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { logError } from '../../lib/utils/error';

/**
 * WebSocket切断Lambda関数
 *
 * クライアントがWebSocketから切断したときに呼ばれる
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;

    if (!connectionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Connection ID not found' }),
      };
    }

    // CONNECTIONSテーブルから接続を削除
    // account_idが不明なので、connection_idだけで削除（Scanが必要）
    // 実際にはTTLで自動削除されるため、ここでは削除をスキップしても良い

    console.log(`WebSocket disconnected: ${connectionId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Disconnected' }),
    };
  } catch (error: any) {
    logError(error as Error, { handler: 'wsDisconnect' });

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to disconnect' }),
    };
  }
};
