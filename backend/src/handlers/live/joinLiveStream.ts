/**
 * ライブ配信参加ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { LiveStreamItem, LiveViewerItem } from '../../types/dynamodb';
import {
  successResponse,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, query, getItem, putItem, updateItem } from '../../lib/dynamodb';

interface JoinLiveStreamResponse {
  stream_id: string;
  playback_url: string;
  viewer_count: number;
  joined_at: number;
}

/**
 * ライブ配信参加Lambda関数
 *
 * 視聴者数をインクリメント、LIVE_VIEWERに記録
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

    // パスパラメータから配信IDを取得
    const streamId = event.pathParameters?.stream_id;

    if (!streamId) {
      return notFoundResponse('配信ID');
    }

    // ライブ配信を取得
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

    // 削除済み
    if (stream.is_deleted) {
      return notFoundResponse('ライブ配信');
    }

    // アクティブな配信のみ参加可能
    if (stream.status !== 'active') {
      return validationErrorResponse('この配信は現在視聴できません');
    }

    const now = getCurrentTimestamp();
    const viewerKey = `${streamId}#${accountId}`;

    // 既存の視聴記録を確認
    const existingViewer = await getItem<LiveViewerItem>({
      TableName: TableNames.LIVE_VIEWER,
      Key: {
        viewer_key: viewerKey,
        joined_at: 0, // 最新の記録を取得する場合はGSIを使用
      },
    });

    if (existingViewer && existingViewer.is_active) {
      // すでに視聴中の場合はpingを更新するだけ
      await updateItem({
        TableName: TableNames.LIVE_VIEWER,
        Key: {
          viewer_key: viewerKey,
          joined_at: existingViewer.joined_at,
        },
        UpdateExpression: 'SET last_ping_at = :now, updated_at = :now',
        ExpressionAttributeValues: {
          ':now': now,
        },
      });

      const response: JoinLiveStreamResponse = {
        stream_id: streamId,
        playback_url: `https://stream.mux.com/${stream.mux_playback_id}.m3u8`,
        viewer_count: stream.viewer_count,
        joined_at: existingViewer.joined_at,
      };

      return successResponse(response);
    }

    // 新規参加または再参加
    const totalRejoins = existingViewer ? existingViewer.total_rejoins + 1 : 0;

    // LIVE_VIEWERに記録
    const viewerItem: LiveViewerItem = {
      viewer_key: viewerKey,
      joined_at: now,
      stream_id: streamId,
      account_id: accountId,
      is_active: true,
      last_ping_at: now,
      watch_duration: 0,
      total_rejoins: totalRejoins,
      created_at: now,
      updated_at: now,
      ttl: now + 7 * 24 * 60 * 60, // 7日後削除
    };

    await putItem({
      TableName: TableNames.LIVE_VIEWER,
      Item: viewerItem,
    });

    // LIVE_STREAMのviewer_countをインクリメント
    const updateResult = await updateItem({
      TableName: TableNames.LIVE_STREAM,
      Key: {
        stream_id: streamId,
        created_at: stream.created_at,
      },
      UpdateExpression: 'SET viewer_count = viewer_count + :one, peak_viewer_count = if_not_exists(peak_viewer_count, :zero), total_views = total_views + :one, updated_at = :now',
      ExpressionAttributeValues: {
        ':one': 1,
        ':zero': 0,
        ':now': now,
      },
      ReturnValues: 'ALL_NEW',
    });

    const updatedStream = updateResult.Attributes as LiveStreamItem;

    // ピーク視聴者数を更新
    if (updatedStream.viewer_count > updatedStream.peak_viewer_count) {
      await updateItem({
        TableName: TableNames.LIVE_STREAM,
        Key: {
          stream_id: streamId,
          created_at: stream.created_at,
        },
        UpdateExpression: 'SET peak_viewer_count = :viewerCount',
        ExpressionAttributeValues: {
          ':viewerCount': updatedStream.viewer_count,
        },
      });
    }

    // レスポンス
    const response: JoinLiveStreamResponse = {
      stream_id: streamId,
      playback_url: `https://stream.mux.com/${stream.mux_playback_id}.m3u8`,
      viewer_count: updatedStream.viewer_count,
      joined_at: now,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'joinLiveStream' });

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
    return internalErrorResponse('ライブ配信参加中にエラーが発生しました');
  }
};
