/**
 * Cognito Post Confirmation Trigger
 * ユーザーがメール確認を完了した後、DynamoDBにアカウントを作成
 */

import { PostConfirmationTriggerHandler } from 'aws-lambda';
import { AccountItem } from '../../types/dynamodb';
import { getCurrentTimestamp } from '../../lib/utils/response';
import { validateHandle, validateEmail, validatePhoneNumber } from '../../lib/validators';
import { DuplicateError, logError } from '../../lib/utils/error';
import { generateULID } from '../../lib/utils/ulid';
import { TableNames, putItem, query } from '../../lib/dynamodb';
import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({});

/**
 * Post Confirmation Trigger Handler
 *
 * トリガー発火条件:
 * - PostConfirmation_ConfirmSignUp: ユーザーがメール確認コードを入力して確認完了
 * - PostConfirmation_ConfirmForgotPassword: パスワードリセット後の確認完了
 */
export const handler: PostConfirmationTriggerHandler = async (event) => {
  console.log('Post Confirmation Trigger started:', JSON.stringify(event, null, 2));

  const { userPoolId, userName, request } = event;
  const { userAttributes } = request;

  try {
    // ユーザー属性を取得
    const email = userAttributes.email;
    const phoneNumber = userAttributes.phone_number || '';
    const handle = userAttributes['custom:handle'] || '';
    const accountType = (userAttributes['custom:accountType'] || 'personal') as 'personal' | 'business' | 'shop' | 'verified' | 'admin';

    // バリデーション
    if (!email) {
      throw new Error('メールアドレスが必要です');
    }
    validateEmail(email);

    if (!handle) {
      throw new Error('ハンドルが必要です');
    }
    validateHandle(handle);

    if (phoneNumber) {
      validatePhoneNumber(phoneNumber);
    }

    // メールアドレスの重複チェック（GSI1で検索）
    const emailCheck = await query({
      TableName: TableNames.ACCOUNT,
      IndexName: 'GSI1_EmailLogin',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: {
        ':gsi1pk': `EMAIL#${email}`,
      },
      Limit: 1,
    });

    if (emailCheck.items.length > 0) {
      throw new DuplicateError('メールアドレス', { email });
    }

    // ハンドルの重複チェック（GSI2で検索）
    const handleCheck = await query({
      TableName: TableNames.ACCOUNT,
      IndexName: 'GSI2_HandleSearch',
      KeyConditionExpression: 'GSI2PK = :gsi2pk',
      ExpressionAttributeValues: {
        ':gsi2pk': `HANDLE#${handle}`,
      },
      Limit: 1,
    });

    if (handleCheck.items.length > 0) {
      throw new DuplicateError('ハンドル', { handle });
    }

    // 電話番号の3アカウント制限チェック（GSI3で検索）
    if (phoneNumber) {
      const phoneCheck = await query({
        TableName: TableNames.ACCOUNT,
        IndexName: 'GSI3_PhoneManagement',
        KeyConditionExpression: 'GSI3PK = :gsi3pk',
        ExpressionAttributeValues: {
          ':gsi3pk': `PHONE#${phoneNumber}`,
        },
      });

      if (phoneCheck.items.length >= 3) {
        throw new Error('この電話番号は既に3つのアカウントに使用されています');
      }
    }

    // アカウントIDを生成
    const accountId = generateULID();
    const now = getCurrentTimestamp();

    // アカウントアイテムを作成
    const accountItem: AccountItem = {
      PK: `ACCOUNT#${accountId}`,
      SK: 'PROFILE',
      account_id: accountId,
      username: userName, // Cognitoのusername
      handle: handle,
      email: email,
      ...(phoneNumber && { phone_number: phoneNumber }),
      password_hash: 'COGNITO_MANAGED', // Cognito管理
      account_type: accountType,
      is_private: false,
      phone_number_verified: false, // SMS認証未実装のためfalse
      email_verified: true, // Post Confirmationが発火している時点でメール確認済み
      handle_change_count: 0,
      follower_count: 0,
      following_count: 0,
      created_at: now,
      updated_at: now,

      // GSI1: メールログイン用
      GSI1PK: `EMAIL#${email}`,
      GSI1SK: 'ACCOUNT',

      // GSI2: ハンドル検索用
      GSI2PK: `HANDLE#${handle}`,
      GSI2SK: 'ACCOUNT',

      // GSI3: 電話番号管理用（電話番号がある場合のみ）
      ...(phoneNumber && {
        GSI3PK: `PHONE#${phoneNumber}`,
        GSI3SK: `CREATED#${now}`,
      }),
    };

    // DynamoDBに保存
    await putItem({
      TableName: TableNames.ACCOUNT,
      Item: accountItem,
    });

    // Cognitoのカスタム属性にaccountIdを設定
    // Note: Post Confirmationトリガー内では属性更新できないため、
    // 次回ログイン時にPre Authenticationトリガーで更新する
    // または、フロントエンドからupdateUserAttributes()で更新する

    console.log(`Account created successfully: ${accountId}`);
    return event; // トリガーは必ずeventを返す
  } catch (error: any) {
    logError(error as Error, {
      handler: 'postConfirmation',
      userName,
      userPoolId,
    });

    // エラーが発生した場合、Cognitoユーザーを削除（ロールバック）
    try {
      await cognitoClient.send(
        new AdminDeleteUserCommand({
          UserPoolId: userPoolId,
          Username: userName,
        })
      );
      console.log(`Cognito user deleted due to error: ${userName}`);
    } catch (deleteError) {
      logError(deleteError as Error, {
        handler: 'postConfirmation-rollback',
        userName,
      });
    }

    // トリガーでエラーを投げると、Cognitoの確認処理全体が失敗する
    throw new Error(`アカウント作成に失敗しました: ${error.message}`);
  }
};
