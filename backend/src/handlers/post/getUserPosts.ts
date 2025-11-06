/**
 * ユーザー投稿一覧取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { PostItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { validatePaginationLimit } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, query } from '../../lib/dynamodb';

interface UserPost {
  post_id: string;
  account_id: string;
  content: string;
  media_urls?: string[];
  media_type?: string;
  thumbnail_url?: string;
  visibility: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  repost_count: number;
  hashtags?: string[];
  created_at: number;
  updated_at?: number;
  is_edited: boolean;
  edit_count: number;
  post_type: string;
  wave_video_url?: string;
  wave_duration?: number;
  wave_thumbnail_url?: string;
  room_id?: string;
}

interface GetUserPostsResponse {
  account_id: string;
  items: UserPost[];
  nextToken?: string;
  total?: number;
}

/**
 * ユーザー投稿一覧取得Lambda関数
 *
 * 特定ユーザーの投稿を時系列で取得
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // パスパラメータからアカウントIDを取得
    const targetAccountId = event.pathParameters?.account_id;

    if (!targetAccountId) {
      return notFoundResponse('アカウントID');
    }

    // クエリパラメータを取得
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 50;
    const nextToken = event.queryStringParameters?.nextToken;
    const includePrivate = event.queryStringParameters?.include_private === 'true';

    // バリデーション
    const validatedLimit = validatePaginationLimit(limit);

    // GSI1でユーザーの投稿を取得（accountId + createdAt）
    const queryParams: any = {
      TableName: TableNames.POST,
      IndexName: 'GSI1',
      KeyConditionExpression: 'accountId = :accountId',
      ExpressionAttributeValues: {
        ':accountId': targetAccountId,
        ':isDeleted': false,
      },
      FilterExpression: 'isDeleted = :isDeleted',
      ScanIndexForward: false, // 新しい順
      Limit: validatedLimit,
      ExclusiveStartKey: nextToken
        ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
        : undefined,
    };

    // プライベート投稿を除外する場合
    if (!includePrivate) {
      queryParams.FilterExpression += ' AND visibility <> :private';
      queryParams.ExpressionAttributeValues[':private'] = 'private';
    }

    const result = await query(queryParams);

    // レスポンス整形
    const posts: UserPost[] = result.items.map((item: PostItem) => ({
      post_id: item.postId,
      account_id: item.accountId,
      content: item.content,
      media_urls: item.mediaUrls,
      media_type: item.mediaType,
      thumbnail_url: item.thumbnailUrl,
      visibility: item.visibility,
      like_count: item.likeCount,
      comment_count: item.commentCount,
      share_count: item.shareCount,
      repost_count: item.repostCount,
      hashtags: item.hashtags ? Array.from(item.hashtags) : undefined,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      is_edited: item.isEdited,
      edit_count: item.editCount,
      post_type: item.post_type,
      wave_video_url: item.wave_video_url,
      wave_duration: item.wave_duration,
      wave_thumbnail_url: item.wave_thumbnail_url,
      room_id: item.room_id,
    }));

    // 次のページのトークンを生成
    const nextTokenValue = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;

    // レスポンス
    const response: GetUserPostsResponse = {
      account_id: targetAccountId,
      items: posts,
      nextToken: nextTokenValue,
      total: undefined,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getUserPosts' });

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
    return internalErrorResponse('ユーザー投稿一覧取得中にエラーが発生しました');
  }
};
