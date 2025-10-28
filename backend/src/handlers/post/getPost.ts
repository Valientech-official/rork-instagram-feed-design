/**
 * 投稿取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetPostResponse, AccountSummary } from '../../types/api';
import { PostItem, AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { ContentDeletedError, logError } from '../../lib/utils/error';
import { TableNames, getItem } from '../../lib/dynamodb';

/**
 * 投稿取得Lambda関数
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // パスパラメータから post_id を取得
    const postId = event.pathParameters?.post_id;

    if (!postId) {
      return notFoundResponse('投稿ID');
    }

    // DynamoDBから投稿を取得
    const post = await getItem<PostItem>({
      TableName: TableNames.POST,
      Key: {
        postId,
      },
    });

    if (!post) {
      return notFoundResponse('投稿');
    }

    // 削除済みチェック
    if (post.isDeleted) {
      throw new ContentDeletedError('投稿');
    }

    // 投稿者のアカウント情報を取得
    const account = await getItem<AccountItem>({
      TableName: TableNames.ACCOUNT,
      Key: {
        PK: `ACCOUNT#${post.accountId}`,
        SK: 'PROFILE',
      },
    });

    if (!account) {
      throw new Error('投稿者のアカウントが見つかりません');
    }

    // アカウントサマリーを作成
    const accountSummary: AccountSummary = {
      account_id: account.account_id,
      username: account.username,
      handle: account.handle,
      profile_image: account.profile_image,
      account_type: account.account_type,
      is_private: account.is_private,
    };

    // レスポンス
    const response: GetPostResponse = {
      post: {
        ...post,
        author: accountSummary,
      },
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getPost' });

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
    return internalErrorResponse('投稿取得中にエラーが発生しました');
  }
};
