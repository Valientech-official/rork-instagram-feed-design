/**
 * ルーム投稿一覧取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { PostItem, AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { validatePaginationLimit } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, query, getItem } from '../../lib/dynamodb';

interface RoomPost {
  post_id: string;
  account_id: string;
  author: {
    username: string;
    handle: string;
    profile_image?: string;
  };
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
  post_type: string;
  wave_video_url?: string;
  wave_duration?: number;
  wave_thumbnail_url?: string;
}

interface GetRoomPostsResponse {
  room_id: string;
  items: RoomPost[];
  nextToken?: string;
  total?: number;
}

/**
 * ルーム投稿一覧取得Lambda関数
 *
 * 特定ルーム内の投稿を時系列で取得
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // パスパラメータからルームIDを取得
    const roomId = event.pathParameters?.room_id;

    if (!roomId) {
      return notFoundResponse('ルームID');
    }

    // クエリパラメータを取得
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 50;
    const nextToken = event.queryStringParameters?.nextToken;

    // バリデーション
    const validatedLimit = validatePaginationLimit(limit);

    // GSI3でルームの投稿を取得（room_id + createdAt）
    const result = await query({
      TableName: TableNames.POST,
      IndexName: 'GSI3',
      KeyConditionExpression: 'room_id = :roomId',
      ExpressionAttributeValues: {
        ':roomId': roomId,
        ':isDeleted': false,
      },
      FilterExpression: 'isDeleted = :isDeleted',
      ScanIndexForward: false, // 新しい順
      Limit: validatedLimit,
      ExclusiveStartKey: nextToken
        ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
        : undefined,
    });

    // 投稿者のアカウント情報を取得
    const accountIds = Array.from(new Set(result.items.map((item: PostItem) => item.accountId)));
    const accountPromises = accountIds.map((id: string) =>
      getItem<AccountItem>({
        TableName: TableNames.ACCOUNT,
        Key: {
          PK: `ACCOUNT#${id}`,
          SK: 'PROFILE',
        },
      })
    );

    const accounts = await Promise.all(accountPromises);
    const accountMap = new Map<string, AccountItem>();
    accounts.forEach((account) => {
      if (account) {
        accountMap.set(account.account_id, account);
      }
    });

    // レスポンス整形
    const posts: RoomPost[] = result.items
      .map((item: PostItem) => {
        const author = accountMap.get(item.accountId);

        if (!author) {
          return null;
        }

        return {
          post_id: item.postId,
          account_id: item.accountId,
          author: {
            username: author.username,
            handle: author.handle,
            profile_image: author.profile_image,
          },
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
          post_type: item.post_type,
          wave_video_url: item.wave_video_url,
          wave_duration: item.wave_duration,
          wave_thumbnail_url: item.wave_thumbnail_url,
        };
      })
      .filter((item): item is RoomPost => item !== null);

    // 次のページのトークンを生成
    const nextTokenValue = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;

    // レスポンス
    const response: GetRoomPostsResponse = {
      room_id: roomId,
      items: posts,
      nextToken: nextTokenValue,
      total: undefined,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getRoomPosts' });

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
    return internalErrorResponse('ルーム投稿一覧取得中にエラーが発生しました');
  }
};
