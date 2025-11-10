/**
 * プロフィール取得ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetProfileResponse } from '../../types/api';
import { AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  internalErrorResponse,
  notFoundResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, getItem } from '../../lib/dynamodb';

/**
 * プロフィール取得Lambda関数
 * pathParametersから account_id を取得
 * account_id === 'me' の場合は認証ユーザーの情報を返す
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // パスパラメータから account_id を取得
    let accountId = event.pathParameters?.account_id;

    if (!accountId) {
      return notFoundResponse('アカウントID');
    }

    // 'me' の場合は認証ユーザーのIDを使用
    if (accountId === 'me') {
      const userId = event.requestContext.authorizer?.claims?.sub;
      if (!userId) {
        return {
          statusCode: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
          },
          body: JSON.stringify({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: '認証情報が取得できません',
            },
          }),
        };
      }

      // userId (Cognito sub) から accountId を取得する必要がある
      // TODO: userId から accountId への変換処理
      // 現時点では userId をそのまま accountId として使用
      accountId = userId;
    }

    // DynamoDBからアカウント情報を取得
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

    // TODO: 統計情報を追加取得
    // - posts_count: POSTテーブルから集計
    // - waves_count: WAVEテーブルから集計（実装されている場合）
    // 現時点では account に含まれる follower_count, following_count のみ使用

    // レスポンス
    const response: GetProfileResponse = {
      account: {
        ...account,
        // 統計情報を追加（現時点ではダミー値）
        posts_count: 0,  // TODO: 実際の投稿数を取得
        waves_count: 0,  // TODO: 実際のWave数を取得
      },
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getProfile' });

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
    return internalErrorResponse('プロフィール取得中にエラーが発生しました');
  }
};
