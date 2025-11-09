/**
 * 通報一覧取得ハンドラー（管理者用）
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { ReportItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  unauthorizedResponse,
} from '../../lib/utils/response';
import { validatePaginationLimit } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, query } from '../../lib/dynamodb';

interface GetReportsResponse {
  items: Array<{
    report_id: string;
    target_type: string;
    target_id: string;
    target_account_id: string;
    reporter_account_id: string;
    reason: string;
    description?: string;
    status: string;
    created_at: number;
    reviewed_at?: number;
    reviewed_by_account_id?: string;
  }>;
  nextToken?: string;
  total?: number;
}

/**
 * 通報一覧取得Lambda関数
 *
 * 管理者が通報一覧を取得
 * ステータス別・対象タイプ別でフィルタリング可能
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

    // TODO: 管理者権限チェック
    // 現在は全ユーザーがアクセス可能（開発用）
    // 本番環境では管理者かどうかをチェックする必要がある
    // const isAdmin = await checkAdminRole(accountId);
    // if (!isAdmin) {
    //   return forbiddenResponse('管理者権限が必要です');
    // }

    // クエリパラメータを取得
    const status = event.queryStringParameters?.status; // pending/reviewing/resolved/dismissed
    const targetType = event.queryStringParameters?.target_type; // post/account/comment
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 50;
    const nextToken = event.queryStringParameters?.nextToken;

    // バリデーション
    const validatedLimit = validatePaginationLimit(limit);

    let result: { items: ReportItem[]; lastEvaluatedKey?: any };

    // ステータス別フィルタ
    if (status) {
      result = await query<ReportItem>({
        TableName: TableNames.REPORT,
        IndexName: 'GSI_status_reports',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': status,
        },
        ScanIndexForward: false, // 新しい順
        Limit: validatedLimit,
        ExclusiveStartKey: nextToken
          ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
          : undefined,
      });
    }
    // 対象タイプ別フィルタ
    else if (targetType) {
      result = await query<ReportItem>({
        TableName: TableNames.REPORT,
        IndexName: 'GSI_target_reports',
        KeyConditionExpression: 'target_type = :targetType',
        ExpressionAttributeValues: {
          ':targetType': targetType,
        },
        ScanIndexForward: false, // 新しい順
        Limit: validatedLimit,
        ExclusiveStartKey: nextToken
          ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
          : undefined,
      });
    }
    // フィルタなし（全通報）
    else {
      // 全件取得の場合はステータスpendingをデフォルトとする
      result = await query<ReportItem>({
        TableName: TableNames.REPORT,
        IndexName: 'GSI_status_reports',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': 'pending',
        },
        ScanIndexForward: false,
        Limit: validatedLimit,
        ExclusiveStartKey: nextToken
          ? JSON.parse(Buffer.from(nextToken, 'base64').toString())
          : undefined,
      });
    }

    // レスポンス整形
    const reports = result.items.map((report) => ({
      report_id: report.report_id,
      target_type: report.target_type,
      target_id: report.target_id,
      target_account_id: report.target_account_id,
      reporter_account_id: report.reporter_account_id,
      reason: report.reason,
      description: report.description,
      status: report.status,
      created_at: report.created_at,
      reviewed_at: report.reviewed_at,
      reviewed_by_account_id: report.reviewed_by_account_id,
    }));

    // 次のページのトークンを生成
    const nextTokenValue = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;

    // レスポンス
    const response: GetReportsResponse = {
      items: reports,
      nextToken: nextTokenValue,
      total: undefined, // 全件数は計算コストが高いため省略
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getReports' });

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
    return internalErrorResponse('通報一覧取得中にエラーが発生しました');
  }
};
