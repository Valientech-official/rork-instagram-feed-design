/**
 * プロフィール更新ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { UpdateProfileRequest } from '../../types/api';
import { AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
} from '../../lib/utils/response';
import {
  validateUsername,
  validateBio,
  validateWebsite,
  validateURL,
} from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, updateFields, getItemRequired } from '../../lib/dynamodb';

/**
 * プロフィール更新Lambda関数
 *
 * 注意: 実際の実装では、JWT トークンから account_id を取得して
 * 本人確認を行う必要があります（認証ミドルウェア）
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // TODO: JWTトークンから account_id を取得
    // const accountId = event.requestContext.authorizer?.claims?.sub;

    // 現在はパスパラメータから取得（開発用）
    const accountId = event.pathParameters?.account_id;

    if (!accountId) {
      return unauthorizedResponse('アカウントIDが取得できません');
    }

    // リクエストボディをパース
    const request = parseRequestBody<UpdateProfileRequest>(event.body);

    // バリデーション
    if (request.username) {
      validateUsername(request.username);
    }

    if (request.bio) {
      validateBio(request.bio);
    }

    if (request.website) {
      validateWebsite(request.website);
    }

    if (request.profile_image) {
      validateURL(request.profile_image, 'プロフィール画像URL');
    }

    if (request.profile_banner) {
      validateURL(request.profile_banner, 'バナー画像URL');
    }

    // アカウントが存在するか確認
    await getItemRequired<AccountItem>(
      {
        TableName: TableNames.ACCOUNT,
        Key: {
          PK: `ACCOUNT#${accountId}`,
          SK: 'PROFILE',
        },
      },
      'アカウント'
    );

    // 更新するフィールドを準備
    const updates: Record<string, any> = {
      updated_at: getCurrentTimestamp(),
    };

    if (request.username !== undefined) {
      updates.username = request.username;
    }

    if (request.bio !== undefined) {
      updates.bio = request.bio;
    }

    if (request.website !== undefined) {
      updates.website = request.website;
    }

    if (request.profile_image !== undefined) {
      updates.profile_image = request.profile_image;
    }

    if (request.profile_banner !== undefined) {
      updates.profile_banner = request.profile_banner;
    }

    // DynamoDBを更新
    const updatedAccount = await updateFields(
      TableNames.ACCOUNT,
      {
        PK: `ACCOUNT#${accountId}`,
        SK: 'PROFILE',
      },
      updates
    );

    return successResponse({ account: updatedAccount });
  } catch (error: any) {
    logError(error as Error, { handler: 'updateProfile' });

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
    return internalErrorResponse('プロフィール更新中にエラーが発生しました');
  }
};
