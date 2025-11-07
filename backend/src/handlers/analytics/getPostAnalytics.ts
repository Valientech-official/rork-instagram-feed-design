/**
 * 投稿分析データ取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { PostItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, getItem, query } from '../../lib/dynamodb';

interface PostAnalytics {
  post_id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reposts: number;
  engagement_rate: number;
  recent_events: Array<{
    event_type: string;
    count: number;
  }>;
  daily_stats?: Array<{
    date: string;
    views: number;
    likes: number;
    comments: number;
  }>;
}

interface GetPostAnalyticsResponse {
  analytics: PostAnalytics;
}

/**
 * 投稿分析データ取得Lambda関数
 *
 * 特定投稿の分析データを取得（閲覧数、エンゲージメントなど）
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

    // パスパラメータから投稿IDを取得
    const postId = event.pathParameters?.post_id;

    if (!postId) {
      return notFoundResponse('投稿ID');
    }

    // 投稿が存在するか確認
    const post = await getItem<PostItem>({
      TableName: TableNames.POST,
      Key: {
        postId: postId,
      },
    });

    if (!post) {
      return notFoundResponse('投稿');
    }

    // 投稿の所有者のみアクセス可能
    if (post.accountId !== accountId) {
      return unauthorizedResponse('この投稿の分析データにアクセスする権限がありません');
    }

    // クエリパラメータから期間を取得
    const days = event.queryStringParameters?.days
      ? parseInt(event.queryStringParameters.days, 10)
      : 7;

    // 過去N日分のイベントを取得
    const startTimestamp = Date.now() - days * 24 * 60 * 60 * 1000;

    // GSI3でtarget_type='post'のイベントを取得し、target_idでフィルター
    const result = await query({
      TableName: TableNames.ANALYTICS,
      IndexName: 'GSI_target_events',
      KeyConditionExpression: 'target_type = :targetType AND #ts >= :startTimestamp',
      FilterExpression: 'target_id = :targetId',
      ExpressionAttributeNames: {
        '#ts': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':targetType': 'post',
        ':targetId': postId,
        ':startTimestamp': startTimestamp,
      },
    });

    // イベントタイプ別に集計
    const eventCounts: Record<string, number> = {};
    result.items.forEach((item: any) => {
      const eventType = item.event_type;
      eventCounts[eventType] = (eventCounts[eventType] || 0) + 1;
    });

    // recent_eventsを配列に変換
    const recentEvents = Object.entries(eventCounts).map(([event_type, count]) => ({
      event_type,
      count,
    }));

    // 総エンゲージメント数を計算
    const totalEngagement =
      (eventCounts['post_like'] || 0) +
      (eventCounts['post_comment'] || 0) +
      (eventCounts['post_share'] || 0) +
      (eventCounts['post_repost'] || 0);

    const totalViews = eventCounts['post_view'] || 0;
    const engagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

    // レスポンス
    const analytics: PostAnalytics = {
      post_id: postId,
      views: eventCounts['post_view'] || 0,
      likes: post.likeCount,
      comments: post.commentCount,
      shares: post.shareCount,
      reposts: post.repostCount,
      engagement_rate: Math.round(engagementRate * 100) / 100,
      recent_events: recentEvents,
    };

    const response: GetPostAnalyticsResponse = {
      analytics,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getPostAnalytics' });

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
    return internalErrorResponse('投稿分析データ取得中にエラーが発生しました');
  }
};
