/**
 * アカウント作成ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { CreateAccountRequest, CreateAccountResponse } from '../../types/api';
import { AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  getCurrentTimestamp,
  internalErrorResponse,
} from '../../lib/utils/response';
import {
  validateRequired,
  validateUsername,
  validateHandle,
  validateEmail,
  validatePassword,
  validatePhoneNumber,
  validateAccountType,
} from '../../lib/validators';
import { DuplicateError, logError } from '../../lib/utils/error';
import { generateULID } from '../../lib/utils/ulid';
import { TableNames, putItem, query } from '../../lib/dynamodb';

/**
 * アカウント作成Lambda関数
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // リクエストボディをパース
    const request = parseRequestBody<CreateAccountRequest>(event.body);

    // バリデーション
    validateRequired(request.username, 'ユーザー名');
    validateRequired(request.handle, 'ハンドル');
    validateRequired(request.email, 'メールアドレス');
    validateRequired(request.password, 'パスワード');
    validateRequired(request.phone_number, '電話番号');

    validateUsername(request.username);
    validateHandle(request.handle);
    validateEmail(request.email);
    validatePassword(request.password);
    validatePhoneNumber(request.phone_number);

    if (request.account_type) {
      validateAccountType(request.account_type);
    }

    // メールアドレスの重複チェック（GSI1で検索）
    const emailCheck = await query({
      TableName: TableNames.ACCOUNT,
      IndexName: 'GSI1_EmailLogin',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: {
        ':gsi1pk': `EMAIL#${request.email}`,
      },
      Limit: 1,
    });

    if (emailCheck.items.length > 0) {
      throw new DuplicateError('メールアドレス', { email: request.email });
    }

    // ハンドルの重複チェック（GSI2で検索）
    const handleCheck = await query({
      TableName: TableNames.ACCOUNT,
      IndexName: 'GSI2_HandleSearch',
      KeyConditionExpression: 'GSI2PK = :gsi2pk',
      ExpressionAttributeValues: {
        ':gsi2pk': `HANDLE#${request.handle}`,
      },
      Limit: 1,
    });

    if (handleCheck.items.length > 0) {
      throw new DuplicateError('ハンドル', { handle: request.handle });
    }

    // 電話番号の重複チェック（GSI3で検索）
    const phoneCheck = await query({
      TableName: TableNames.ACCOUNT,
      IndexName: 'GSI3_PhoneManagement',
      KeyConditionExpression: 'GSI3PK = :gsi3pk',
      ExpressionAttributeValues: {
        ':gsi3pk': `PHONE#${request.phone_number}`,
      },
      Limit: 1,
    });

    if (phoneCheck.items.length > 0) {
      throw new DuplicateError('電話番号', { phone_number: request.phone_number });
    }

    // アカウントIDを生成
    const accountId = generateULID();
    const now = getCurrentTimestamp();

    // TODO: パスワードハッシュ化（Cognitoを使用する場合はここでCognito登録）
    // const passwordHash = await hashPassword(request.password);

    // アカウントアイテムを作成
    const accountItem: AccountItem = {
      PK: `ACCOUNT#${accountId}`,
      SK: 'PROFILE',
      account_id: accountId,
      username: request.username,
      handle: request.handle,
      email: request.email,
      phone_number: request.phone_number,
      password_hash: 'TODO_IMPLEMENT_HASHING', // TODO: 実際のパスワードハッシュ化
      account_type: request.account_type || 'personal',
      is_private: false,
      phone_number_verified: false,
      email_verified: false,
      handle_change_count: 0,
      follower_count: 0,
      following_count: 0,
      created_at: now,
      updated_at: now,

      // GSI1: メールログイン用
      GSI1PK: `EMAIL#${request.email}`,
      GSI1SK: 'ACCOUNT',

      // GSI2: ハンドル検索用
      GSI2PK: `HANDLE#${request.handle}`,
      GSI2SK: 'ACCOUNT',

      // GSI3: 電話番号管理用
      GSI3PK: `PHONE#${request.phone_number}`,
      GSI3SK: `CREATED#${now}`,
    };

    // DynamoDBに保存
    await putItem({
      TableName: TableNames.ACCOUNT,
      Item: accountItem,
    });

    // レスポンス
    const response: CreateAccountResponse = {
      account_id: accountId,
      handle: request.handle,
      email: request.email,
    };

    return successResponse(response, 201);
  } catch (error: any) {
    logError(error as Error, { handler: 'createAccount' });

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
    return internalErrorResponse('アカウント作成中にエラーが発生しました');
  }
};
