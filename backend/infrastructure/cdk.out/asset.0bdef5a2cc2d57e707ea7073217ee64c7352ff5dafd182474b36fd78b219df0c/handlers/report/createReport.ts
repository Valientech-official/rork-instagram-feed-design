/**
 * 通報作成ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { ReportItem, PostItem, AccountItem, CommentItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '../../lib/utils/response';
import { validateRequired } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { generateULID } from '../../lib/utils/ulid';
import { TableNames, putItem, getItem } from '../../lib/dynamodb';

interface CreateReportRequest {
  target_type: 'post' | 'account' | 'comment';
  target_id: string;
  reason: string;
  description?: string;
}

interface CreateReportResponse {
  report_id: string;
  target_type: string;
  target_id: string;
  reporter_account_id: string;
  status: string;
  created_at: number;
}

/**
 * 通報作成Lambda関数
 *
 * 不適切な投稿・アカウント・コメントを通報
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

    // リクエストボディをパース
    const request = parseRequestBody<CreateReportRequest>(event.body);

    // バリデーション
    validateRequired(request.target_type, '通報対象タイプ');
    validateRequired(request.target_id, '通報対象ID');
    validateRequired(request.reason, '通報理由');

    // target_typeのバリデーション
    const validTargetTypes = ['post', 'account', 'comment'];
    if (!validTargetTypes.includes(request.target_type)) {
      return validationErrorResponse('通報対象タイプが不正です（post/account/commentのいずれか）');
    }

    // 説明文の長さチェック
    if (request.description && request.description.length > 1000) {
      return validationErrorResponse('説明は1000文字以内で入力してください');
    }

    // 通報対象が存在するか確認 + スナップショット取得
    let targetAccountId: string;
    let snapshot: any;

    switch (request.target_type) {
      case 'post':
        const post = await getItem<PostItem>({
          TableName: TableNames.POST,
          Key: { postId: request.target_id },
        });
        if (!post) {
          return validationErrorResponse('通報対象の投稿が見つかりません');
        }
        targetAccountId = post.accountId;
        snapshot = {
          content: post.content,
          mediaUrls: post.mediaUrls,
          visibility: post.visibility,
          isDeleted: post.isDeleted,
        };
        break;

      case 'account':
        const account = await getItem<AccountItem>({
          TableName: TableNames.ACCOUNT,
          Key: {
            PK: `ACCOUNT#${request.target_id}`,
            SK: 'PROFILE',
          },
        });
        if (!account) {
          return validationErrorResponse('通報対象のアカウントが見つかりません');
        }
        targetAccountId = account.account_id;
        snapshot = {
          username: account.username,
          handle: account.handle,
          bio: account.bio,
          profile_image: account.profile_image,
        };
        break;

      case 'comment':
        const comment = await getItem<CommentItem>({
          TableName: TableNames.COMMENT,
          Key: { comment_id: request.target_id },
        });
        if (!comment) {
          return validationErrorResponse('通報対象のコメントが見つかりません');
        }
        targetAccountId = comment.account_id;
        snapshot = {
          content: comment.content,
          post_id: comment.post_id,
          is_deleted: comment.is_deleted,
        };
        break;

      default:
        return validationErrorResponse('通報対象タイプが不正です');
    }

    // 自分自身を通報することはできない（アカウント通報の場合）
    if (request.target_type === 'account' && targetAccountId === accountId) {
      return validationErrorResponse('自分自身を通報することはできません');
    }

    // 通報を作成
    const now = getCurrentTimestamp();
    const reportId = generateULID();

    const reportItem: ReportItem = {
      report_id: reportId,
      created_at: now,
      reporter_account_id: accountId,
      target_type: request.target_type,
      target_id: request.target_id,
      target_account_id: targetAccountId,
      reason: request.reason as any,
      description: request.description,
      snapshot,
      status: 'pending',
      updated_at: now,
      ttl: now + 180 * 24 * 60 * 60, // 180日後に削除
    };

    // DynamoDBに保存
    await putItem({
      TableName: TableNames.REPORT,
      Item: reportItem,
    });

    // レスポンス
    const response: CreateReportResponse = {
      report_id: reportId,
      target_type: request.target_type,
      target_id: request.target_id,
      reporter_account_id: accountId,
      status: 'pending',
      created_at: now,
    };

    return successResponse(response, 201);
  } catch (error: any) {
    logError(error as Error, { handler: 'createReport' });

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
    return internalErrorResponse('通報作成中にエラーが発生しました');
  }
};
