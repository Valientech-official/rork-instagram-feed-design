/**
 * トレンドハッシュタグ取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  successResponse,
  internalErrorResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, query } from '../../lib/dynamodb';

interface TrendingHashtag {
  hashtag: string;
  count: number;
  period: string;
}

interface GetTrendingHashtagsResponse {
  hashtags: TrendingHashtag[];
  period: string;
}

/**
 * トレンドハッシュタグ取得Lambda関数
 *
 * 人気のハッシュタグランキングを取得
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // クエリパラメータから期間を取得（daily/weekly/all_time）
    const period = event.queryStringParameters?.period || 'daily';
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 10;

    // 期間のバリデーション
    const validPeriods = ['daily', 'weekly', 'all_time'];
    const validatedPeriod = validPeriods.includes(period) ? period : 'daily';

    // GSI1でカウント数の多い順に取得
    const result = await query({
      TableName: TableNames.HASHTAG_COUNT,
      IndexName: 'GSI1',
      KeyConditionExpression: 'period = :period',
      ExpressionAttributeValues: {
        ':period': validatedPeriod,
      },
      ScanIndexForward: false, // カウント数の多い順
      Limit: Math.min(limit, 50), // 最大50件
    });

    // レスポンス整形
    const hashtags = result.items.map((item: any) => ({
      hashtag: item.hashtag,
      count: item.count,
      period: item.period,
    }));

    // レスポンス
    const response: GetTrendingHashtagsResponse = {
      hashtags,
      period: validatedPeriod,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getTrendingHashtags' });

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
    return internalErrorResponse('トレンドハッシュタグ取得中にエラーが発生しました');
  }
};
