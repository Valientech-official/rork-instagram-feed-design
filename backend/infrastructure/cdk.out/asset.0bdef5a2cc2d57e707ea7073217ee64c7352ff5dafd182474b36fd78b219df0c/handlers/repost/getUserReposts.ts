/**
 * ユーザーのリポスト一覧取得ハンドラー
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
import { TableNames, query, getItem } from '../../lib/dynamodb';

interface RepostedPost {
  repost_id: string;
  original_post_id: string;
  account_id: string;
  post_content: string;
  post_media_urls?: string[];
  post_media_type?: string;
  post_author_id: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  repost_count: number;
  hashtags?: string[];
  post_created_at: number;
  post_type: string;
  wave_video_url?: string;
  wave_duration?: number;
  reposted_at: number;
  comment?: string;
}

interface GetUserRepostsResponse {
  account_id: string;
  items: RepostedPost[];
  nextToken?: string;
  total?: number;
}

/**
 * ユーザーのリポスト一覧取得Lambda関数
 *
 * 特定ユーザーがリポストした投稿一覧を取得
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // パスパラメータからアカウントIDを取得
    const accountId = event.pathParameters?.account_id;

    if (!accountId) {
      return notFoundResponse('アカウントID');
    }

    // クエリパラメータを取得
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 50;
    const nextToken = event.queryStringParameters?.nextToken;

    // バリデーション
    const validatedLimit = validatePaginationLimit(limit);

    // GSI1でユーザーのリポストを取得（account_id + created_at）
    const result = await query({
      TableName: TableNames.REPOST,
      IndexName: 'GSI1',
      KeyConditionExpression: 'account_id = :accountId',
      ExpressionAttributeValues: {
        ':accountId': accountId,
      },
      ScanIndexForward: false, // 新しい順
      Limit: validatedLimit,
      ExclusiveStartKey: nextToken
        ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
        : undefined,
    });

    // リポストした投稿の情報を取得
    const postIds = result.items.map((item: any) => item.original_post_id);
    const postPromises = postIds.map((id: string) =>
      getItem<PostItem>({
        TableName: TableNames.POST,
        Key: {
          postId: id,
        },
      })
    );

    const posts = await Promise.all(postPromises);

    // リポスト情報と投稿情報をマージ
    const repostedPosts = result.items
      .map((repostItem: any) => {
        const post = posts.find((p) => p?.postId === repostItem.original_post_id);

        // 投稿が削除されている場合はスキップ
        if (!post || post.isDeleted) {
          return null;
        }

        return {
          repost_id: repostItem.repost_id,
          original_post_id: post.postId,
          account_id: repostItem.account_id,
          post_content: post.content,
          post_media_urls: post.mediaUrls,
          post_media_type: post.mediaType,
          post_author_id: post.accountId,
          like_count: post.likeCount,
          comment_count: post.commentCount,
          share_count: post.shareCount,
          repost_count: post.repostCount,
          hashtags: post.hashtags ? Array.from(post.hashtags) : undefined,
          post_created_at: post.createdAt,
          post_type: post.post_type,
          wave_video_url: post.wave_video_url,
          wave_duration: post.wave_duration,
          reposted_at: repostItem.created_at,
          comment: repostItem.comment,
        } as RepostedPost;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // 次のページのトークンを生成
    const nextTokenValue = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;

    // レスポンス
    const response: GetUserRepostsResponse = {
      account_id: accountId,
      items: repostedPosts,
      nextToken: nextTokenValue,
      total: undefined,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getUserReposts' });

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
    return internalErrorResponse('ユーザーのリポスト一覧取得中にエラーが発生しました');
  }
};
