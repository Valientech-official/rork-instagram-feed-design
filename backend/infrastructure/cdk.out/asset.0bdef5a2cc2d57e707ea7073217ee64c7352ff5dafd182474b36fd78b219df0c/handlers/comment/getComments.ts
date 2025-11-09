/**
 * コメント一覧取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommentsResponse, AccountSummary } from '../../types/api';
import { CommentItem, AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { validatePaginationLimit } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, query, getItem } from '../../lib/dynamodb';

/**
 * コメント一覧取得Lambda関数
 * GSI1を使用して投稿のコメントを取得
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // パスパラメータから post_id を取得
    const postId = event.pathParameters?.post_id;

    if (!postId) {
      return notFoundResponse('投稿ID');
    }

    // クエリパラメータを取得
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 20;
    const nextToken = event.queryStringParameters?.nextToken;
    const parentCommentId = event.queryStringParameters?.parent_comment_id;

    // バリデーション
    const validatedLimit = validatePaginationLimit(limit);

    // GSI1を使用して投稿のコメントを取得
    // 親コメントIDが指定されている場合は返信のみを取得
    let filterExpression = 'is_deleted = :false';
    const expressionAttributeValues: Record<string, any> = {
      ':postId': postId,
      ':false': false,
    };

    if (parentCommentId) {
      filterExpression += ' AND parent_comment_id = :parentCommentId';
      expressionAttributeValues[':parentCommentId'] = parentCommentId;
    } else {
      // 親コメントのみを取得（返信は含まない）
      filterExpression += ' AND attribute_not_exists(parent_comment_id)';
    }

    const result = await query<CommentItem>({
      TableName: TableNames.COMMENT,
      IndexName: 'GSI1',
      KeyConditionExpression: 'post_id = :postId',
      ExpressionAttributeValues: expressionAttributeValues,
      FilterExpression: filterExpression,
      ScanIndexForward: true, // 古い順（投稿の流れに沿って）
      Limit: validatedLimit,
      ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) : undefined,
    });

    // コメント投稿者のアカウント情報を取得
    const accountIds = [...new Set(result.items.map((comment) => comment.account_id))];
    const accountPromises = accountIds.map((id) =>
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

    // コメントにアカウント情報を付与
    const commentsWithAuthor = result.items.map((comment) => {
      const account = accountMap.get(comment.account_id);

      if (!account) {
        return null;
      }

      const accountSummary: AccountSummary = {
        account_id: account.account_id,
        username: account.username,
        handle: account.handle,
        profile_image: account.profile_image,
        account_type: account.account_type,
        is_private: account.is_private,
      };

      return {
        ...comment,
        author: accountSummary,
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    // 次のページのトークンを生成
    const nextTokenValue = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
      : undefined;

    // レスポンス
    const response: GetCommentsResponse = {
      items: commentsWithAuthor,
      nextToken: nextTokenValue,
      total: undefined, // 全件数は計算コストが高いため省略
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getComments' });

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
    return internalErrorResponse('コメント取得中にエラーが発生しました');
  }
};
