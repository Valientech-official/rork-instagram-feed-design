/**
 * ライブ配信一覧取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { LiveStreamItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  validationErrorResponse,
} from '../../lib/utils/response';
import { validatePaginationLimit } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, query } from '../../lib/dynamodb';

interface GetLiveStreamsResponse {
  items: Array<{
    stream_id: string;
    title: string;
    description?: string;
    thumbnail_url?: string;
    playback_id: string;
    status: string;
    viewer_count: number;
    started_at?: number;
    created_at: number;
    account_id: string;
    room_id: string;
  }>;
  nextToken?: string;
  count: number;
}

/**
 * ライブ配信一覧取得Lambda関数
 *
 * フィルタ: room_id, account_id, status
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // クエリパラメータを取得
    const roomId = event.queryStringParameters?.room_id;
    const accountId = event.queryStringParameters?.account_id;
    const status = event.queryStringParameters?.status;
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 20;
    const nextToken = event.queryStringParameters?.nextToken;

    // バリデーション
    const validatedLimit = validatePaginationLimit(limit, 100);

    // 複数のフィルタは指定不可
    const filterCount = [roomId, accountId, status].filter(Boolean).length;
    if (filterCount > 1) {
      return validationErrorResponse('フィルタはroom_id、account_id、statusのいずれか1つのみ指定できます');
    }

    // ステータスのバリデーション
    if (status) {
      const validStatuses = ['idle', 'active', 'disabled'];
      if (!validStatuses.includes(status)) {
        return validationErrorResponse('ステータスはidle/active/disabledのいずれかを指定してください');
      }
    }

    let result: any;

    // フィルタに応じてクエリ
    if (roomId) {
      // GSI1: ルームの配信一覧
      result = await query({
        TableName: TableNames.LIVE_STREAM,
        IndexName: 'GSI_room_lives',
        KeyConditionExpression: 'room_id = :roomId',
        ExpressionAttributeValues: {
          ':roomId': roomId,
          ':isDeleted': false,
        },
        FilterExpression: 'is_deleted = :isDeleted',
        ScanIndexForward: false, // 新しい順
        Limit: validatedLimit,
        ExclusiveStartKey: nextToken
          ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
          : undefined,
      });
    } else if (accountId) {
      // GSI2: アカウントの配信履歴
      result = await query({
        TableName: TableNames.LIVE_STREAM,
        IndexName: 'GSI_account_lives',
        KeyConditionExpression: 'account_id = :accountId',
        ExpressionAttributeValues: {
          ':accountId': accountId,
          ':isDeleted': false,
        },
        FilterExpression: 'is_deleted = :isDeleted',
        ScanIndexForward: false, // 新しい順
        Limit: validatedLimit,
        ExclusiveStartKey: nextToken
          ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
          : undefined,
      });
    } else if (status) {
      // GSI3: ステータス別
      result = await query({
        TableName: TableNames.LIVE_STREAM,
        IndexName: 'GSI_active_lives',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': status,
          ':isDeleted': false,
        },
        FilterExpression: 'is_deleted = :isDeleted',
        ScanIndexForward: false, // 新しい順
        Limit: validatedLimit,
        ExclusiveStartKey: nextToken
          ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
          : undefined,
      });
    } else {
      // デフォルト: アクティブな配信のみ
      result = await query({
        TableName: TableNames.LIVE_STREAM,
        IndexName: 'GSI_active_lives',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': 'active',
          ':isDeleted': false,
        },
        FilterExpression: 'is_deleted = :isDeleted',
        ScanIndexForward: false, // 新しい順
        Limit: validatedLimit,
        ExclusiveStartKey: nextToken
          ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
          : undefined,
      });
    }

    // 次のページのトークンを生成
    const nextTokenValue = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;

    // レスポンスを整形
    const items = (result.items as LiveStreamItem[]).map((stream) => ({
      stream_id: stream.stream_id,
      title: stream.title,
      description: stream.description,
      thumbnail_url: stream.thumbnail_url,
      playback_id: stream.mux_playback_id,
      status: stream.status,
      viewer_count: stream.viewer_count,
      started_at: stream.started_at,
      created_at: stream.created_at,
      account_id: stream.account_id,
      room_id: stream.room_id,
    }));

    // レスポンス
    const response: GetLiveStreamsResponse = {
      items,
      nextToken: nextTokenValue,
      count: items.length,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getLiveStreams' });

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
    return internalErrorResponse('ライブ配信一覧取得中にエラーが発生しました');
  }
};
