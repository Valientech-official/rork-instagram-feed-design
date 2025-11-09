/**
 * WebSocketメッセージハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';
import { getCurrentTimestamp } from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, query, updateItem } from '../../lib/dynamodb';

interface WebSocketMessage {
  action: string;
  stream_id?: string;
  data?: any;
}

/**
 * WebSocketメッセージLambda関数
 *
 * クライアントからメッセージを受信し、処理
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const domain = event.requestContext.domainName;
    const stage = event.requestContext.stage;

    if (!connectionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Connection ID not found' }),
      };
    }

    // メッセージをパース
    let message: WebSocketMessage;
    try {
      message = JSON.parse(event.body || '{}');
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid message format' }),
      };
    }

    const now = getCurrentTimestamp();

    // アクションに応じて処理
    switch (message.action) {
      case 'ping': {
        // 接続維持用のping
        await updateItem({
          TableName: TableNames.CONNECTIONS,
          Key: {
            connection_id: connectionId,
            account_id: '', // account_idが不明なのでGSIを使う必要がある
          },
          UpdateExpression: 'SET last_ping_at = :now',
          ExpressionAttributeValues: {
            ':now': now,
          },
        }).catch((err) => {
          // 更新失敗は無視（接続が削除されている可能性）
          console.warn('Failed to update ping:', err);
        });

        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'pong' }),
        };
      }

      case 'join_stream': {
        // ライブ配信に参加
        const streamId = message.stream_id;
        if (!streamId) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'stream_id required' }),
          };
        }

        // stream_idを接続に紐付け
        await updateItem({
          TableName: TableNames.CONNECTIONS,
          Key: {
            connection_id: connectionId,
            account_id: '', // TODO: 実際のaccount_idを使用
          },
          UpdateExpression: 'SET stream_id = :streamId, last_ping_at = :now',
          ExpressionAttributeValues: {
            ':streamId': streamId,
            ':now': now,
          },
        }).catch((err) => {
          console.warn('Failed to update stream_id:', err);
        });

        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'joined' }),
        };
      }

      case 'leave_stream': {
        // ライブ配信から退出
        await updateItem({
          TableName: TableNames.CONNECTIONS,
          Key: {
            connection_id: connectionId,
            account_id: '', // TODO: 実際のaccount_idを使用
          },
          UpdateExpression: 'REMOVE stream_id SET last_ping_at = :now',
          ExpressionAttributeValues: {
            ':now': now,
          },
        }).catch((err) => {
          console.warn('Failed to remove stream_id:', err);
        });

        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'left' }),
        };
      }

      case 'broadcast': {
        // 特定の配信の視聴者全員にメッセージを配信
        const streamId = message.stream_id;
        if (!streamId || !message.data) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'stream_id and data required' }),
          };
        }

        // 配信に接続している全ユーザーを取得
        const connections = await query({
          TableName: TableNames.CONNECTIONS,
          IndexName: 'GSI_live_connections',
          KeyConditionExpression: 'stream_id = :streamId',
          ExpressionAttributeValues: {
            ':streamId': streamId,
          },
        });

        // API Gateway Management APIクライアント
        const apiClient = new ApiGatewayManagementApiClient({
          endpoint: `https://${domain}/${stage}`,
        });

        // 各接続にメッセージを送信
        const sendPromises = connections.items.map(async (conn: any) => {
          try {
            await apiClient.send(
              new PostToConnectionCommand({
                ConnectionId: conn.connection_id,
                Data: Buffer.from(JSON.stringify(message.data)),
              })
            );
          } catch (error: any) {
            // 接続が切れている場合は削除
            if (error.statusCode === 410) {
              console.log(`Stale connection: ${conn.connection_id}`);
            }
          }
        });

        await Promise.all(sendPromises);

        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'broadcasted', count: connections.items.length }),
        };
      }

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Unknown action' }),
        };
    }
  } catch (error: any) {
    logError(error as Error, { handler: 'wsMessage' });

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process message' }),
    };
  }
};
