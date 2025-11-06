/**
 * 発見タブフィード取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { PostItem, AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
} from '../../lib/utils/response';
import { validatePaginationLimit } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, query, getItem } from '../../lib/dynamodb';

interface DiscoveryPost {
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
  like_count: number;
  comment_count: number;
  share_count: number;
  repost_count: number;
  hashtags?: string[];
  created_at: number;
  post_type: string;
  wave_video_url?: string;
  wave_duration?: number;
  wave_thumbnail_url?: string;
}

interface GetDiscoveryFeedResponse {
  items: DiscoveryPost[];
  nextToken?: string;
  total?: number;
}

/**
 * 発見タブフィード取得Lambda関数
 *
 * パブリック投稿を時系列で取得（発見タブ用）
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // クエリパラメータを取得
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 50;
    const nextToken = event.queryStringParameters?.nextToken;
    const postType = event.queryStringParameters?.post_type; // 'normal' | 'wave' | undefined

    // バリデーション
    const validatedLimit = validatePaginationLimit(limit);

    // GSI2でパブリック投稿を取得（visibility = 'public' + createdAt）
    const queryParams: any = {
      TableName: TableNames.POST,
      IndexName: 'GSI2',
      KeyConditionExpression: 'visibility = :visibility',
      ExpressionAttributeValues: {
        ':visibility': 'public',
        ':isDeleted': false,
      },
      FilterExpression: 'isDeleted = :isDeleted',
      ScanIndexForward: false, // 新しい順
      Limit: validatedLimit,
      ExclusiveStartKey: nextToken
        ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
        : undefined,
    };

    // 投稿タイプでフィルター
    if (postType && (postType === 'normal' || postType === 'wave')) {
      queryParams.FilterExpression += ' AND post_type = :postType';
      queryParams.ExpressionAttributeValues[':postType'] = postType;
    }

    const result = await query(queryParams);

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
    const posts: DiscoveryPost[] = result.items
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
          like_count: item.likeCount,
          comment_count: item.commentCount,
          share_count: item.shareCount,
          repost_count: item.repostCount,
          hashtags: item.hashtags ? Array.from(item.hashtags) : undefined,
          created_at: item.createdAt,
          post_type: item.post_type,
          wave_video_url: item.wave_video_url,
          wave_duration: item.wave_duration,
          wave_thumbnail_url: item.wave_thumbnail_url,
        };
      })
      .filter((item): item is DiscoveryPost => item !== null);

    // 次のページのトークンを生成
    const nextTokenValue = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;

    // レスポンス
    const response: GetDiscoveryFeedResponse = {
      items: posts,
      nextToken: nextTokenValue,
      total: undefined,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getDiscoveryFeed' });

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
    return internalErrorResponse('発見フィード取得中にエラーが発生しました');
  }
};
