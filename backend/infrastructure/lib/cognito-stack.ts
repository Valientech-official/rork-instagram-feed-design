/**
 * Cognito User Pool Stack
 * ユーザー認証・認可の管理
 *
 * ⚠️ 課金に関する注意事項:
 * 1. 最初の 10,000 MAU（月間アクティブユーザー）まで無料
 * 2. Advanced Security Mode (AUDIT/ENFORCED): $0.05/MAU 課金
 *    → 開発環境では OFF に設定
 * 3. OAuth Client Credentials フロー: $6.00/月 per クライアント
 *    → M2M認証用、このアプリでは使用しない
 * 4. SMS MFA: SMS送信ごとに課金
 *    → TOTP（認証アプリ）のみ使用
 * 5. メール送信: 最初の50通/月まで無料、以降課金
 *    → 本番環境ではSES使用を推奨
 */

import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

interface CognitoStackProps extends cdk.StackProps {
  environment: 'dev' | 'prod';
}

export class CognitoStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: CognitoStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // =====================================================
    // User Pool作成
    // =====================================================
    this.userPool = new cognito.UserPool(this, 'PieceAppUserPool', {
      userPoolName: `piece-app-users-${environment}`,

      // サインイン設定
      signInAliases: {
        email: true,
        username: true,
      },

      // 自動検証
      autoVerify: {
        email: true, // メールアドレスを自動検証
      },

      // ユーザー属性（標準属性）
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: false,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
        birthdate: {
          required: false,
          mutable: true,
        },
      },

      // カスタム属性（将来の拡張用）
      customAttributes: {
        accountId: new cognito.StringAttribute({
          minLen: 26,
          maxLen: 26,
          mutable: false, // ULIDは変更不可
        }),
        accountType: new cognito.StringAttribute({
          minLen: 1,
          maxLen: 20,
          mutable: true,
        }),
      },

      // パスワードポリシー
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false, // モバイルアプリのため記号は任意
        tempPasswordValidity: cdk.Duration.days(3),
      },

      // アカウントリカバリー
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,

      // MFA設定
      mfa: cognito.Mfa.OPTIONAL, // ユーザーが選択可能
      mfaSecondFactor: {
        sms: false, // SMSは高コストのため無効
        otp: true, // TOTP（認証アプリ）を有効化
      },

      // メール設定
      email: cognito.UserPoolEmail.withCognito(), // Cognito標準メール（開発環境）
      // 本番環境ではSESを使用することを推奨:
      // email: cognito.UserPoolEmail.withSES({
      //   fromEmail: 'noreply@piece-app.com',
      //   fromName: 'Piece App',
      //   sesRegion: 'ap-northeast-1',
      // }),

      // デバイストラッキング（React Native対応）
      deviceTracking: {
        challengeRequiredOnNewDevice: true,
        deviceOnlyRememberedOnUserPrompt: true,
      },

      // 高度なセキュリティ
      // ⚠️ 課金注意: AUDITとENFORCEDは $0.05/MAU 課金されます
      // 開発環境では課金を避けるためOFFに設定
      advancedSecurityMode: environment === 'prod'
        ? cognito.AdvancedSecurityMode.ENFORCED  // 本番: セキュリティ重視
        : cognito.AdvancedSecurityMode.OFF,       // 開発: 課金回避のためOFF

      // ユーザー招待メッセージ
      userInvitation: {
        emailSubject: 'Piece Appへようこそ！',
        emailBody: `
          <h2>Piece Appへようこそ</h2>
          <p>アカウントが作成されました。</p>
          <p>ユーザー名: {username}</p>
          <p>仮パスワード: {####}</p>
          <p>初回ログイン時にパスワードの変更が必要です。</p>
        `,
      },

      // ユーザー検証メッセージ
      userVerification: {
        emailSubject: 'Piece App - メールアドレス確認',
        emailBody: `
          <h2>メールアドレスの確認</h2>
          <p>以下の確認コードを入力してください:</p>
          <h3>{####}</h3>
        `,
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },

      // 削除保護（本番環境）
      removalPolicy: environment === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,

      // Lambda トリガー（将来の拡張用）
      // lambdaTriggers: {
      //   preSignUp: preSignUpLambda,
      //   postConfirmation: postConfirmationLambda,
      //   preAuthentication: preAuthLambda,
      // },
    });

    // =====================================================
    // User Pool Client（React Native アプリ用）
    // =====================================================
    this.userPoolClient = new cognito.UserPoolClient(this, 'PieceAppClient', {
      userPool: this.userPool,
      userPoolClientName: `piece-app-client-${environment}`,

      // 認証フロー
      authFlows: {
        userPassword: true, // ユーザー名・パスワード認証
        userSrp: true, // SRP（Secure Remote Password）認証
        custom: false,
        adminUserPassword: false, // 管理者による認証は無効
      },

      // OAuth設定（将来のソーシャルログイン用）
      // ⚠️ 課金注意: clientCredentials フローは $6.00/月 課金されます（設定していません）
      oAuth: {
        flows: {
          authorizationCodeGrant: true,   // 無料
          implicitCodeGrant: false,        // 無料
          // clientCredentials: false,     // ❌ M2M認証は $6.00/月 課金！使用禁止
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: environment === 'prod'
          ? ['https://piece-app.com/callback', 'pieceapp://callback']
          : ['http://localhost:19006/callback', 'pieceapp://callback'],
        logoutUrls: environment === 'prod'
          ? ['https://piece-app.com/logout', 'pieceapp://logout']
          : ['http://localhost:19006/logout', 'pieceapp://logout'],
      },

      // トークン設定
      accessTokenValidity: cdk.Duration.hours(1), // アクセストークン有効期限
      idTokenValidity: cdk.Duration.hours(1), // IDトークン有効期限
      refreshTokenValidity: cdk.Duration.days(30), // リフレッシュトークン有効期限

      // セキュリティ設定
      preventUserExistenceErrors: true, // ユーザー存在チェック攻撃を防ぐ
      enableTokenRevocation: true, // トークン取り消し機能

      // 読み取り/書き込み属性
      readAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          email: true,
          emailVerified: true,
          givenName: true,
          familyName: true,
          birthdate: true,
        })
        .withCustomAttributes('accountId', 'accountType'),

      writeAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          email: true,
          givenName: true,
          familyName: true,
          birthdate: true,
        })
        .withCustomAttributes('accountType'),
    });

    // =====================================================
    // Outputs
    // =====================================================
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `PieceApp-UserPoolId-${environment}`,
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: this.userPool.userPoolArn,
      description: 'Cognito User Pool ARN',
      exportName: `PieceApp-UserPoolArn-${environment}`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `PieceApp-UserPoolClientId-${environment}`,
    });

    new cdk.CfnOutput(this, 'UserPoolDomain', {
      value: `https://cognito-idp.${cdk.Stack.of(this).region}.amazonaws.com/${this.userPool.userPoolId}`,
      description: 'Cognito User Pool Domain',
    });
  }
}
