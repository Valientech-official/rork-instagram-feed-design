/**
 * ダッシュボードデータ取得ハンドラー
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

interface DashboardData {
  overview: {
    follower_count: number;
    following_count: number;
    post_count: number;
    total_likes: number;
    total_views: number;
    engagement_rate: number;
  };
  recent_activity: Array<{
    event_type: string;
    count: number;
    last_occurred: number;
  }>;
  trending_posts: Array<{
    post_id: string;
    views: number;
    likes: number;
    engagement_rate: number;
  }>;
  audience_insights: {
    active_hours: Record<string, number>;
    top_locations?: string[];
  };
}

interface GetDashboardResponse {
  dashboard: DashboardData;
}

/**
 * ダッシュボードデータ取得Lambda関数
 *
 * アカウントのダッシュボードサマリーを取得
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

    // アカウントが存在するか確認
    const account = await getItem<AccountItem>({
      TableName: TableNames.ACCOUNT,
      Key: {
        PK: `ACCOUNT#${accountId}`,
        SK: 'PROFILE',
      },
    });

    if (!account) {
      return notFoundResponse('アカウント');
    }

    // 過去7日分のイベントを取得
    const startTimestamp = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // GSI1でアカウントのイベントを取得
    const result = await query({
      TableName: TableNames.ANALYTICS,
      IndexName: 'GSI_user_events',
      KeyConditionExpression: 'account_id = :accountId AND #ts >= :startTimestamp',
      ExpressionAttributeNames: {
        '#ts': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':accountId': accountId,
        ':startTimestamp': startTimestamp,
      },
    });

    // イベントタイプ別に集計
    const eventTypeCounts: Record<string, { count: number; lastOccurred: number }> = {};
    let totalViews = 0;
    let totalLikes = 0;

    // 時間帯別アクティビティ
    const activeHours: Record<string, number> = {};

    result.items.forEach((item: any) => {
      const eventType = item.event_type;
      const timestamp = item.timestamp;

      // イベントタイプ別カウント
      if (!eventTypeCounts[eventType]) {
        eventTypeCounts[eventType] = { count: 0, lastOccurred: 0 };
      }
      eventTypeCounts[eventType].count++;
      eventTypeCounts[eventType].lastOccurred = Math.max(
        eventTypeCounts[eventType].lastOccurred,
        timestamp
      );

      // 集計用
      if (eventType === 'post_view') totalViews++;
      if (eventType === 'post_like') totalLikes++;

      // 時間帯集計（0-23時）
      const hour = new Date(timestamp).getHours().toString();
      activeHours[hour] = (activeHours[hour] || 0) + 1;
    });

    // recent_activityを配列に変換
    const recentActivity = Object.entries(eventTypeCounts)
      .map(([event_type, data]) => ({
        event_type,
        count: data.count,
        last_occurred: data.lastOccurred,
      }))
      .sort((a, b) => b.last_occurred - a.last_occurred)
      .slice(0, 10); // 最新10件

    // エンゲージメント率を計算
    const totalEngagement = totalLikes;
    const engagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

    // レスポンス
    const dashboard: DashboardData = {
      overview: {
        follower_count: account.follower_count,
        following_count: account.following_count,
        post_count: 0, // account.post_count があれば使用
        total_likes: totalLikes,
        total_views: totalViews,
        engagement_rate: Math.round(engagementRate * 100) / 100,
      },
      recent_activity: recentActivity,
      trending_posts: [], // 実装時にtop投稿を別途取得
      audience_insights: {
        active_hours: activeHours,
        top_locations: [], // 実装時にlocation情報から集計
      },
    };

    const response: GetDashboardResponse = {
      dashboard,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getDashboard' });

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
    return internalErrorResponse('ダッシュボードデータ取得中にエラーが発生しました');
  }
};
