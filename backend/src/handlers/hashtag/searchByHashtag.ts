/**
 * ハッシュタグ検索ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  successResponse,
  internalErrorResponse,
  validationErrorResponse,
} from '../../lib/utils/response';
import { validatePaginationLimit } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, query } from '../../lib/dynamodb';

interface HashtagPost {
  post_id: string;
  account_id: string;
  created_at: number;
}

interface SearchByHashtagResponse {
  hashtag: string;
  items: HashtagPost[];
  nextToken?: string;
  total?: number;
}

/**
 * ハッシュタグ検索Lambda関数
 *
 * 特定のハッシュタグが付いた投稿を検索
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // パスパラメータまたはクエリパラメータからハッシュタグを取得
    const hashtag = event.pathParameters?.hashtag || event.queryStringParameters?.hashtag;

    if (!hashtag) {
      return validationErrorResponse('ハッシュタグを指定してください');
    }

    // ハッシュタグを小文字化（#は除去）
    const normalizedHashtag = hashtag.toLowerCase().replace(/^#/, '');

    // クエリパラメータを取得
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 50;
    const nextToken = event.queryStringParameters?.nextToken;

    // バリデーション
    const validatedLimit = validatePaginationLimit(limit);

    // ハッシュタグ検索
    const result = await query({
      TableName: TableNames.HASHTAG_INDEX,
      KeyConditionExpression: 'hashtag = :hashtag',
      ExpressionAttributeValues: {
        ':hashtag': normalizedHashtag,
      },
      FilterExpression: 'isDeleted = :isDeleted',
      ExpressionAttributeNames: {
        ':isDeleted': false,
      },
      ScanIndexForward: false, // 新しい順
      Limit: validatedLimit,
      ExclusiveStartKey: nextToken
        ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
        : undefined,
    });

    // 次のページのトークンを生成
    const nextTokenValue = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;

    // レスポンス
    const response: SearchByHashtagResponse = {
      hashtag: normalizedHashtag,
      items: result.items as HashtagPost[],
      nextToken: nextTokenValue,
      total: undefined,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'searchByHashtag' });

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
    return internalErrorResponse('ハッシュタグ検索中にエラーが発生しました');
  }
};
