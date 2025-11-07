/**
 * Mux Webhookハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { LiveStreamItem } from '../../types/dynamodb';
import {
  successResponse,
  getCurrentTimestamp,
  internalErrorResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, query, updateItem } from '../../lib/dynamodb';
import { verifyMuxWebhook } from '../../lib/utils/mux';

/**
 * Mux Webhook受信Lambda関数
 *
 * Muxからのイベント通知を処理
 * - video.live_stream.active: 配信開始
 * - video.live_stream.idle: 配信終了
 * - video.live_stream.recording: 録画開始
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Webhook署名を検証
    let webhookEvent;
    try {
      webhookEvent = await verifyMuxWebhook(
        event.body || '',
        event.headers as Record<string, string>
      );
    } catch (error) {
      console.error('Webhook verification failed:', error);
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }

    console.log('Received Mux webhook:', {
      type: webhookEvent.type,
      data: webhookEvent.data,
    });

    const now = getCurrentTimestamp();

    // イベントタイプに応じて処理
    switch (webhookEvent.type) {
      case 'video.live_stream.active': {
        // 配信開始
        const liveStreamId = webhookEvent.data.id;

        // mux_live_stream_idで配信を検索
        const streamResult = await query({
          TableName: TableNames.LIVE_STREAM,
          IndexName: 'GSI_mux_live_stream',
          KeyConditionExpression: 'mux_live_stream_id = :muxId',
          ExpressionAttributeValues: {
            ':muxId': liveStreamId,
          },
          Limit: 1,
        });

        if (streamResult.items && streamResult.items.length > 0) {
          const stream = streamResult.items[0] as LiveStreamItem;

          await updateItem({
            TableName: TableNames.LIVE_STREAM,
            Key: {
              stream_id: stream.stream_id,
              created_at: stream.created_at,
            },
            UpdateExpression: 'SET #status = :status, started_at = :startedAt, updated_at = :now',
            ExpressionAttributeNames: {
              '#status': 'status',
            },
            ExpressionAttributeValues: {
              ':status': 'active',
              ':startedAt': now,
              ':now': now,
            },
          });

          console.log(`Live stream ${stream.stream_id} started`);
        }
        break;
      }

      case 'video.live_stream.idle': {
        // 配信終了
        const liveStreamId = webhookEvent.data.id;

        const streamResult = await query({
          TableName: TableNames.LIVE_STREAM,
          IndexName: 'GSI_mux_live_stream',
          KeyConditionExpression: 'mux_live_stream_id = :muxId',
          ExpressionAttributeValues: {
            ':muxId': liveStreamId,
          },
          Limit: 1,
        });

        if (streamResult.items && streamResult.items.length > 0) {
          const stream = streamResult.items[0] as LiveStreamItem;

          await updateItem({
            TableName: TableNames.LIVE_STREAM,
            Key: {
              stream_id: stream.stream_id,
              created_at: stream.created_at,
            },
            UpdateExpression: 'SET #status = :status, ended_at = :endedAt, updated_at = :now, viewer_count = :zero',
            ExpressionAttributeNames: {
              '#status': 'status',
            },
            ExpressionAttributeValues: {
              ':status': 'idle',
              ':endedAt': now,
              ':now': now,
              ':zero': 0,
            },
          });

          console.log(`Live stream ${stream.stream_id} ended`);
        }
        break;
      }

      case 'video.live_stream.recording': {
        // 録画開始（将来の機能）
        console.log('Live stream recording started');
        break;
      }

      case 'video.asset.ready': {
        // VODアセット作成完了
        const assetId = webhookEvent.data.id;
        const playbackIds = webhookEvent.data.playback_ids || [];

        console.log(`Video asset ready: ${assetId}`, playbackIds);
        // TODO: VODアセット情報をLIVE_STREAMのrecent_asset_idsに追加
        break;
      }

      default:
        console.log(`Unhandled webhook type: ${webhookEvent.type}`);
    }

    return successResponse({ received: true });
  } catch (error: any) {
    logError(error as Error, { handler: 'muxWebhook' });
    return internalErrorResponse('Webhook処理中にエラーが発生しました');
  }
};
