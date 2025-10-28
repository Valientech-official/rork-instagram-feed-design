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
export declare class CognitoStack extends cdk.Stack {
    readonly userPool: cognito.UserPool;
    readonly userPoolClient: cognito.UserPoolClient;
    constructor(scope: Construct, id: string, props: CognitoStackProps);
}
export {};
