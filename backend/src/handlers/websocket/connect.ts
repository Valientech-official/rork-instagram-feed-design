/**
 * WebSocket接続ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { ConnectionItem } from '../../types/dynamodb';
import { getCurrentTimestamp } from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, putItem } from '../../lib/dynamodb';

/**
 * WebSocket接続Lambda関数
 *
 * クライアントがWebSocketに接続したときに呼ばれる
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const accountId = event.queryStringParameters?.account_id;

    if (!connectionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Connection ID not found' }),
      };
    }

    if (!accountId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Account ID required' }),
      };
    }

    const now = getCurrentTimestamp();

    // CONNECTIONSテーブルに接続を記録
    const connectionItem: ConnectionItem = {
      connection_id: connectionId,
      account_id: accountId,
      connected_at: now,
      last_ping_at: now,
      ttl: now + 24 * 60 * 60, // 24時間後削除
    };

    await putItem({
      TableName: TableNames.CONNECTIONS,
      Item: connectionItem,
    });

    console.log(`WebSocket connected: ${connectionId} (account: ${accountId})`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Connected' }),
    };
  } catch (error: any) {
    logError(error as Error, { handler: 'wsConnect' });

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to connect' }),
    };
  }
};
