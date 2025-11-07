/**
 * ライブ配信情報取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { LiveStreamItem, AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, query, getItem } from '../../lib/dynamodb';

interface GetLiveStreamResponse {
  stream_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  playback_id: string;
  playback_url: string;
  status: string;
  viewer_count: number;
  peak_viewer_count: number;
  total_views: number;
  started_at?: number;
  ended_at?: number;
  created_at: number;
  streamer: {
    account_id: string;
    username: string;
    handle: string;
    profile_image?: string;
  };
  room: {
    room_id: string;
    name: string;
  };
}

/**
 * ライブ配信情報取得Lambda関数
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // パスパラメータから配信IDを取得
    const streamId = event.pathParameters?.stream_id;

    if (!streamId) {
      return notFoundResponse('配信ID');
    }

    // ライブ配信を取得（GSI3: stream_idで検索）
    const streamResult = await query({
      TableName: TableNames.LIVE_STREAM,
      KeyConditionExpression: 'stream_id = :streamId',
      ExpressionAttributeValues: {
        ':streamId': streamId,
      },
      Limit: 1,
    });

    if (!streamResult.items || streamResult.items.length === 0) {
      return notFoundResponse('ライブ配信');
    }

    const stream = streamResult.items[0] as LiveStreamItem;

    // 削除済みの配信は返さない
    if (stream.is_deleted) {
      return notFoundResponse('ライブ配信');
    }

    // 配信者情報を取得
    const streamer = await getItem<AccountItem>({
      TableName: TableNames.ACCOUNT,
      Key: {
        PK: `ACCOUNT#${stream.account_id}`,
        SK: 'PROFILE',
      },
    });

    if (!streamer) {
      return notFoundResponse('配信者');
    }

    // ルーム情報を取得
    const room = await getItem({
      TableName: TableNames.ROOM,
      Key: {
        room_id: stream.room_id,
      },
    });

    if (!room) {
      return notFoundResponse('ルーム');
    }

    // レスポンス
    const response: GetLiveStreamResponse = {
      stream_id: stream.stream_id,
      title: stream.title,
      description: stream.description,
      thumbnail_url: stream.thumbnail_url,
      playback_id: stream.mux_playback_id,
      playback_url: `https://stream.mux.com/${stream.mux_playback_id}.m3u8`,
      status: stream.status,
      viewer_count: stream.viewer_count,
      peak_viewer_count: stream.peak_viewer_count,
      total_views: stream.total_views,
      started_at: stream.started_at,
      ended_at: stream.ended_at,
      created_at: stream.created_at,
      streamer: {
        account_id: streamer.account_id,
        username: streamer.username,
        handle: streamer.handle,
        profile_image: streamer.profile_image,
      },
      room: {
        room_id: room.room_id,
        name: room.name,
      },
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getLiveStream' });

    // AppErrorの場合はそのエラー情報を使用
    if (error.code && error.statusCode) {
      return {
        statusCode: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
        },
        body: JSON.stringify({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        }),
      };
    }

    // 予期しないエラーの場合
    return internalErrorResponse('ライブ配信情報取得中にエラーが発生しました');
  }
};
