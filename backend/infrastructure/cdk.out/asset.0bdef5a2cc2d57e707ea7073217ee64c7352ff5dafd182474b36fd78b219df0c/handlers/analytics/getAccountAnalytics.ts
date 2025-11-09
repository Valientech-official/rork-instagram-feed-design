/**
 * アカウント分析データ取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, getItem, query } from '../../lib/dynamodb';

interface AccountAnalytics {
  account_id: string;
  follower_count: number;
  following_count: number;
  post_count: number;
  total_likes: number;
  total_comments: number;
  total_views: number;
  engagement_rate: number;
  growth: {
    followers_last_7_days: number;
    followers_last_30_days: number;
    posts_last_7_days: number;
    posts_last_30_days: number;
  };
  top_posts: Array<{
    post_id: string;
    views: number;
    likes: number;
    comments: number;
  }>;
}

interface GetAccountAnalyticsResponse {
  analytics: AccountAnalytics;
}

/**
 * アカウント分析データ取得Lambda関数
 *
 * アカウント全体の分析データを取得
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

    // パスパラメータから対象アカウントIDを取得（省略時は自分）
    const targetAccountId = event.pathParameters?.account_id || accountId;

    // 自分以外のアカウントの分析データは閲覧不可
    if (targetAccountId !== accountId) {
      return unauthorizedResponse('他のアカウントの分析データにアクセスする権限がありません');
    }

    // アカウントが存在するか確認
    const account = await getItem<AccountItem>({
      TableName: TableNames.ACCOUNT,
      Key: {
        PK: `ACCOUNT#${targetAccountId}`,
        SK: 'PROFILE',
      },
    });

    if (!account) {
      return notFoundResponse('アカウント');
    }

    // 過去30日分のイベントを取得
    const startTimestamp = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // GSI1でアカウントのイベントを取得
    const result = await query({
      TableName: TableNames.ANALYTICS,
      IndexName: 'GSI_user_events',
      KeyConditionExpression: 'account_id = :accountId AND #ts >= :startTimestamp',
      ExpressionAttributeNames: {
        '#ts': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':accountId': targetAccountId,
        ':startTimestamp': startTimestamp,
      },
    });

    // イベントタイプ別に集計
    const eventCounts: Record<string, number> = {};
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;

    result.items.forEach((item: any) => {
      const eventType = item.event_type;
      eventCounts[eventType] = (eventCounts[eventType] || 0) + 1;

      if (eventType === 'post_view') totalViews++;
      if (eventType === 'post_like') totalLikes++;
      if (eventType === 'post_comment') totalComments++;
    });

    // 7日前と30日前のタイムスタンプ
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // フォロワー増加数を計算（簡易版：イベントから推定）
    const followersLast7Days = result.items.filter(
      (item: any) => item.event_type === 'account_follow' && item.timestamp >= sevenDaysAgo
    ).length;

    const followersLast30Days = result.items.filter(
      (item: any) => item.event_type === 'account_follow'
    ).length;

    // 投稿数を計算
    const postsLast7Days = result.items.filter(
      (item: any) => item.event_type === 'post_create' && item.timestamp >= sevenDaysAgo
    ).length;

    const postsLast30Days = result.items.filter(
      (item: any) => item.event_type === 'post_create'
    ).length;

    // エンゲージメント率を計算
    const totalEngagement = totalLikes + totalComments;
    const engagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

    // レスポンス
    const analytics: AccountAnalytics = {
      account_id: targetAccountId,
      follower_count: account.follower_count,
      following_count: account.following_count,
      post_count: 0, // account.post_count があれば使用
      total_likes: totalLikes,
      total_comments: totalComments,
      total_views: totalViews,
      engagement_rate: Math.round(engagementRate * 100) / 100,
      growth: {
        followers_last_7_days: followersLast7Days,
        followers_last_30_days: followersLast30Days,
        posts_last_7_days: postsLast7Days,
        posts_last_30_days: postsLast30Days,
      },
      top_posts: [], // 実装時にtarget_typeでフィルターして集計
    };

    const response: GetAccountAnalyticsResponse = {
      analytics,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getAccountAnalytics' });

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
    return internalErrorResponse('アカウント分析データ取得中にエラーが発生しました');
  }
};
