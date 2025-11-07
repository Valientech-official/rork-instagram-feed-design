/**
 * ライブ配信作成ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { LiveStreamItem, RoomItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
} from '../../lib/utils/response';
import { validateRequired } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { generateULID } from '../../lib/utils/ulid';
import { TableNames, putItem, getItem } from '../../lib/dynamodb';
import { getMuxClient, handleMuxError } from '../../lib/utils/mux';

interface CreateLiveStreamRequest {
  room_id: string;
  title: string;
  description?: string;
}

interface CreateLiveStreamResponse {
  stream_id: string;
  stream_key: string;
  playback_id: string;
  rtmp_url: string;
  created_at: number;
}

/**
 * ライブ配信作成Lambda関数
 *
 * ルームオーナーまたはモデレーターがライブ配信を作成可能
 * Mux Live Stream APIを使用
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // TODO: JWTトークンから account_id を取得
    // const accountId = event.requestContext.authorizer?.claims?.sub;

    // 現在はヘッダーから取得（開発用）
    const accountId = event.headers['x-account-id'];

    if (!accountId) {
      return unauthorizedResponse('アカウントIDが取得できません');
    }

    // リクエストボディをパース
    const request = parseRequestBody<CreateLiveStreamRequest>(event.body);

    // バリデーション
    validateRequired(request.room_id, 'ルームID');
    validateRequired(request.title, 'タイトル');

    // タイトルの長さ
    if (request.title.length < 1 || request.title.length > 100) {
      return validationErrorResponse('タイトルは1-100文字で入力してください');
    }

    // 説明文の長さ
    if (request.description && request.description.length > 500) {
      return validationErrorResponse('説明文は500文字以内で入力してください');
    }

    // ルームが存在するか確認
    const room = await getItem<RoomItem>({
      TableName: TableNames.ROOM,
      Key: {
        room_id: request.room_id,
      },
    });

    if (!room) {
      return notFoundResponse('ルーム');
    }

    // ルームのオーナーまたはモデレーターのみライブ配信を作成可能
    // TODO: モデレーター権限チェックも追加
    if (room.owner_account_id !== accountId) {
      return unauthorizedResponse('このルームでライブ配信を作成する権限がありません');
    }

    // Muxクライアントを取得
    const muxClient = await getMuxClient();

    // Mux Live Streamを作成
    let muxLiveStream;
    try {
      muxLiveStream = await muxClient.video.liveStreams.create({
        playback_policy: ['public'],
        reconnect_window: 60, // 60秒間の再接続を許可
        new_asset_settings: {
          playback_policy: ['public'],
        },
      });
    } catch (error) {
      const muxError = handleMuxError(error);
      logError(muxError, { handler: 'createLiveStream', phase: 'mux_create' });
      return internalErrorResponse('ライブ配信の作成に失敗しました');
    }

    if (!muxLiveStream.id || !muxLiveStream.stream_key || !muxLiveStream.playback_ids?.[0]?.id) {
      return internalErrorResponse('Muxからの応答が不正です');
    }

    const now = getCurrentTimestamp();
    const streamId = generateULID();

    // DynamoDBにライブ配信レコードを保存
    const liveStreamItem: LiveStreamItem = {
      stream_id: streamId,
      created_at: now,
      account_id: accountId,
      room_id: request.room_id,
      title: request.title,
      description: request.description,
      mux_live_stream_id: muxLiveStream.id,
      mux_stream_key: muxLiveStream.stream_key,
      mux_playback_id: muxLiveStream.playback_ids[0].id,
      status: 'idle', // 初期状態はidle
      viewer_count: 0,
      peak_viewer_count: 0,
      total_views: 0,
      updated_at: now,
      is_archived: false,
      is_deleted: false,
    };

    await putItem({
      TableName: TableNames.LIVE_STREAM,
      Item: liveStreamItem,
    });

    // レスポンス
    const response: CreateLiveStreamResponse = {
      stream_id: streamId,
      stream_key: muxLiveStream.stream_key,
      playback_id: muxLiveStream.playback_ids[0].id,
      rtmp_url: `rtmps://global-live.mux.com:443/app/${muxLiveStream.stream_key}`,
      created_at: now,
    };

    return successResponse(response, 201);
  } catch (error: any) {
    logError(error as Error, { handler: 'createLiveStream' });

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
    return internalErrorResponse('ライブ配信作成中にエラーが発生しました');
  }
};
