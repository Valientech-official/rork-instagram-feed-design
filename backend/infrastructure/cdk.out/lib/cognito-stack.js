"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitoStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const cognito = __importStar(require("aws-cdk-lib/aws-cognito"));
class CognitoStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const { environment, postConfirmationLambda } = props;
        // =====================================================
        // User Pool作成
        // =====================================================
        this.userPool = new cognito.UserPool(this, 'PieceAppUserPool', {
            userPoolName: `piece-app-users-${environment}`,
            // セルフサービスサインアップを有効化
            selfSignUpEnabled: true,
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
                phoneNumber: {
                    required: false, // SMS認証を使わないため必須ではない
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
                handle: new cognito.StringAttribute({
                    minLen: 3,
                    maxLen: 30,
                    mutable: true, // ハンドルは後で変更可能（制限あり）
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
                ? cognito.AdvancedSecurityMode.ENFORCED // 本番: セキュリティ重視
                : cognito.AdvancedSecurityMode.OFF, // 開発: 課金回避のためOFF
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
            // Lambda トリガー
            lambdaTriggers: {
                postConfirmation: postConfirmationLambda, // メール確認後、DynamoDBにアカウント作成
                // 将来の拡張用:
                // preSignUp: preSignUpLambda,
                // preAuthentication: preAuthLambda,
            },
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
                    authorizationCodeGrant: true, // 無料
                    implicitCodeGrant: false, // 無料
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
                phoneNumber: true,
                phoneNumberVerified: true,
                givenName: true,
                familyName: true,
                birthdate: true,
            })
                .withCustomAttributes('accountId', 'handle', 'accountType'),
            writeAttributes: new cognito.ClientAttributes()
                .withStandardAttributes({
                email: true,
                phoneNumber: true,
                givenName: true,
                familyName: true,
                birthdate: true,
            })
                .withCustomAttributes('handle', 'accountType'),
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
exports.CognitoStack = CognitoStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29nbml0by1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9jb2duaXRvLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7Ozs7R0FjRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsaURBQW1DO0FBQ25DLGlFQUFtRDtBQVNuRCxNQUFhLFlBQWEsU0FBUSxHQUFHLENBQUMsS0FBSztJQUl6QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXdCO1FBQ2hFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sRUFBRSxXQUFXLEVBQUUsc0JBQXNCLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFFdEQsd0RBQXdEO1FBQ3hELGNBQWM7UUFDZCx3REFBd0Q7UUFDeEQsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQzdELFlBQVksRUFBRSxtQkFBbUIsV0FBVyxFQUFFO1lBRTlDLG9CQUFvQjtZQUNwQixpQkFBaUIsRUFBRSxJQUFJO1lBRXZCLFVBQVU7WUFDVixhQUFhLEVBQUU7Z0JBQ2IsS0FBSyxFQUFFLElBQUk7Z0JBQ1gsUUFBUSxFQUFFLElBQUk7YUFDZjtZQUVELE9BQU87WUFDUCxVQUFVLEVBQUU7Z0JBQ1YsS0FBSyxFQUFFLElBQUksRUFBRSxlQUFlO2FBQzdCO1lBRUQsZUFBZTtZQUNmLGtCQUFrQixFQUFFO2dCQUNsQixLQUFLLEVBQUU7b0JBQ0wsUUFBUSxFQUFFLElBQUk7b0JBQ2QsT0FBTyxFQUFFLElBQUk7aUJBQ2Q7Z0JBQ0QsV0FBVyxFQUFFO29CQUNYLFFBQVEsRUFBRSxLQUFLLEVBQUUscUJBQXFCO29CQUN0QyxPQUFPLEVBQUUsSUFBSTtpQkFDZDtnQkFDRCxTQUFTLEVBQUU7b0JBQ1QsUUFBUSxFQUFFLEtBQUs7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SSxDQUFDLFFBQVEsQ0FBQyxVQUFVO1lBQy9CLFdBQVcsRUFBRSxzQkFBc0I7WUFDbkMsVUFBVSxFQUFFLHVCQUF1QixXQUFXLEVBQUU7U0FDakQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDckMsS0FBSyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVztZQUNoQyxXQUFXLEVBQUUsdUJBQXVCO1lBQ3BDLFVBQVUsRUFBRSx3QkFBd0IsV0FBVyxFQUFFO1NBQ2xELENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDMUMsS0FBSyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsZ0JBQWdCO1lBQzNDLFdBQVcsRUFBRSw2QkFBNkI7WUFDMUMsVUFBVSxFQUFFLDZCQUE2QixXQUFXLEVBQUU7U0FDdkQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUN4QyxLQUFLLEVBQUUsdUJBQXVCLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sa0JBQWtCLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFO1lBQ25HLFdBQVcsRUFBRSwwQkFBMEI7U0FDeEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBdFBELG9DQXNQQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBDb2duaXRvIFVzZXIgUG9vbCBTdGFja1xyXG4gKiDjg6bjg7zjgrbjg7zoqo3oqLzjg7voqo3lj6/jga7nrqHnkIZcclxuICpcclxuICog4pqg77iPIOiqsumHkeOBq+mWouOBmeOCi+azqOaEj+S6i+mghTpcclxuICogMS4g5pyA5Yid44GuIDEwLDAwMCBNQVXvvIjmnIjplpPjgqLjgq/jg4bjgqPjg5bjg6bjg7zjgrbjg7zvvInjgb7jgafnhKHmlplcclxuICogMi4gQWR2YW5jZWQgU2VjdXJpdHkgTW9kZSAoQVVESVQvRU5GT1JDRUQpOiAkMC4wNS9NQVUg6Kqy6YeRXHJcbiAqICAgIOKGkiDplovnmbrnkrDlooPjgafjga8gT0ZGIOOBq+ioreWumlxyXG4gKiAzLiBPQXV0aCBDbGllbnQgQ3JlZGVudGlhbHMg44OV44Ot44O8OiAkNi4wMC/mnIggcGVyIOOCr+ODqeOCpOOCouODs+ODiFxyXG4gKiAgICDihpIgTTJN6KqN6Ki855So44CB44GT44Gu44Ki44OX44Oq44Gn44Gv5L2/55So44GX44Gq44GEXHJcbiAqIDQuIFNNUyBNRkE6IFNNU+mAgeS/oeOBlOOBqOOBq+iqsumHkVxyXG4gKiAgICDihpIgVE9UUO+8iOiqjeiovOOCouODl+ODqu+8ieOBruOBv+S9v+eUqFxyXG4gKiA1LiDjg6Hjg7zjg6vpgIHkv6E6IOacgOWIneOBrjUw6YCaL+aciOOBvuOBp+eEoeaWmeOAgeS7pemZjeiqsumHkVxyXG4gKiAgICDihpIg5pys55Wq55Kw5aKD44Gn44GvU0VT5L2/55So44KS5o6o5aWoXHJcbiAqL1xyXG5cclxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0ICogYXMgY29nbml0byBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29nbml0byc7XHJcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcblxyXG5pbnRlcmZhY2UgQ29nbml0b1N0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XHJcbiAgZW52aXJvbm1lbnQ6ICdkZXYnIHwgJ3Byb2QnO1xyXG4gIHBvc3RDb25maXJtYXRpb25MYW1iZGE6IGxhbWJkYS5GdW5jdGlvbjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENvZ25pdG9TdGFjayBleHRlbmRzIGNkay5TdGFjayB7XHJcbiAgcHVibGljIHJlYWRvbmx5IHVzZXJQb29sOiBjb2duaXRvLlVzZXJQb29sO1xyXG4gIHB1YmxpYyByZWFkb25seSB1c2VyUG9vbENsaWVudDogY29nbml0by5Vc2VyUG9vbENsaWVudDtcclxuXHJcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IENvZ25pdG9TdGFja1Byb3BzKSB7XHJcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuXHJcbiAgICBjb25zdCB7IGVudmlyb25tZW50LCBwb3N0Q29uZmlybWF0aW9uTGFtYmRhIH0gPSBwcm9wcztcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gVXNlciBQb29s5L2c5oiQXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgdGhpcy51c2VyUG9vbCA9IG5ldyBjb2duaXRvLlVzZXJQb29sKHRoaXMsICdQaWVjZUFwcFVzZXJQb29sJywge1xyXG4gICAgICB1c2VyUG9vbE5hbWU6IGBwaWVjZS1hcHAtdXNlcnMtJHtlbnZpcm9ubWVudH1gLFxyXG5cclxuICAgICAgLy8g44K744Or44OV44K144O844OT44K544K144Kk44Oz44Ki44OD44OX44KS5pyJ5Yq55YyWXHJcbiAgICAgIHNlbGZTaWduVXBFbmFibGVkOiB0cnVlLFxyXG5cclxuICAgICAgLy8g44K144Kk44Oz44Kk44Oz6Kit5a6aXHJcbiAgICAgIHNpZ25JbkFsaWFzZXM6IHtcclxuICAgICAgICBlbWFpbDogdHJ1ZSxcclxuICAgICAgICB1c2VybmFtZTogdHJ1ZSxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIOiHquWLleaknOiovFxyXG4gICAgICBhdXRvVmVyaWZ5OiB7XHJcbiAgICAgICAgZW1haWw6IHRydWUsIC8vIOODoeODvOODq+OCouODieODrOOCueOCkuiHquWLleaknOiovFxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8g44Om44O844K244O85bGe5oCn77yI5qiZ5rqW5bGe5oCn77yJXHJcbiAgICAgIHN0YW5kYXJkQXR0cmlidXRlczoge1xyXG4gICAgICAgIGVtYWlsOiB7XHJcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgICAgIG11dGFibGU6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBwaG9uZU51bWJlcjoge1xyXG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLCAvLyBTTVPoqo3oqLzjgpLkvb/jgo/jgarjgYTjgZ/jgoHlv4XpoIjjgafjga/jgarjgYRcclxuICAgICAgICAgIG11dGFibGU6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBnaXZlbk5hbWU6IHtcclxuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcclxuICAgICAgICAgIG11dGFibGU6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBmYW1pbHlOYW1lOiB7XHJcbiAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXHJcbiAgICAgICAgICBtdXRhYmxlOiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYmlydGhkYXRlOiB7XHJcbiAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXHJcbiAgICAgICAgICBtdXRhYmxlOiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyDjgqvjgrnjgr/jg6DlsZ7mgKfvvIjlsIbmnaXjga7mi6HlvLXnlKjvvIlcclxuICAgICAgY3VzdG9tQXR0cmlidXRlczoge1xyXG4gICAgICAgIGFjY291bnRJZDogbmV3IGNvZ25pdG8uU3RyaW5nQXR0cmlidXRlKHtcclxuICAgICAgICAgIG1pbkxlbjogMjYsXHJcbiAgICAgICAgICBtYXhMZW46IDI2LFxyXG4gICAgICAgICAgbXV0YWJsZTogZmFsc2UsIC8vIFVMSUTjga/lpInmm7TkuI3lj69cclxuICAgICAgICB9KSxcclxuICAgICAgICBoYW5kbGU6IG5ldyBjb2duaXRvLlN0cmluZ0F0dHJpYnV0ZSh7XHJcbiAgICAgICAgICBtaW5MZW46IDMsXHJcbiAgICAgICAgICBtYXhMZW46IDMwLFxyXG4gICAgICAgICAgbXV0YWJsZTogdHJ1ZSwgLy8g44OP44Oz44OJ44Or44Gv5b6M44Gn5aSJ5pu05Y+v6IO977yI5Yi26ZmQ44GC44KK77yJXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgYWNjb3VudFR5cGU6IG5ldyBjb2duaXRvLlN0cmluZ0F0dHJpYnV0ZSh7XHJcbiAgICAgICAgICBtaW5MZW46IDEsXHJcbiAgICAgICAgICBtYXhMZW46IDIwLFxyXG4gICAgICAgICAgbXV0YWJsZTogdHJ1ZSxcclxuICAgICAgICB9KSxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIOODkeOCueODr+ODvOODieODneODquOCt+ODvFxyXG4gICAgICBwYXNzd29yZFBvbGljeToge1xyXG4gICAgICAgIG1pbkxlbmd0aDogOCxcclxuICAgICAgICByZXF1aXJlTG93ZXJjYXNlOiB0cnVlLFxyXG4gICAgICAgIHJlcXVpcmVVcHBlcmNhc2U6IHRydWUsXHJcbiAgICAgICAgcmVxdWlyZURpZ2l0czogdHJ1ZSxcclxuICAgICAgICByZXF1aXJlU3ltYm9sczogZmFsc2UsIC8vIOODouODkOOCpOODq+OCouODl+ODquOBruOBn+OCgeiomOWPt+OBr+S7u+aEj1xyXG4gICAgICAgIHRlbXBQYXNzd29yZFZhbGlkaXR5OiBjZGsuRHVyYXRpb24uZGF5cygzKSxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIOOCouOCq+OCpuODs+ODiOODquOCq+ODkOODquODvFxyXG4gICAgICBhY2NvdW50UmVjb3Zlcnk6IGNvZ25pdG8uQWNjb3VudFJlY292ZXJ5LkVNQUlMX09OTFksXHJcblxyXG4gICAgICAvLyBNRkHoqK3lrppcclxuICAgICAgbWZhOiBjb2duaXRvLk1mYS5PUFRJT05BTCwgLy8g44Om44O844K244O844GM6YG45oqe5Y+v6IO9XHJcbiAgICAgIG1mYVNlY29uZEZhY3Rvcjoge1xyXG4gICAgICAgIHNtczogZmFsc2UsIC8vIFNNU+OBr+mrmOOCs+OCueODiOOBruOBn+OCgeeEoeWKuVxyXG4gICAgICAgIG90cDogdHJ1ZSwgLy8gVE9UUO+8iOiqjeiovOOCouODl+ODqu+8ieOCkuacieWKueWMllxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8g44Oh44O844Or6Kit5a6aXHJcbiAgICAgIGVtYWlsOiBjb2duaXRvLlVzZXJQb29sRW1haWwud2l0aENvZ25pdG8oKSwgLy8gQ29nbml0b+aomea6luODoeODvOODq++8iOmWi+eZuueSsOWig++8iVxyXG4gICAgICAvLyDmnKznlarnkrDlooPjgafjga9TRVPjgpLkvb/nlKjjgZnjgovjgZPjgajjgpLmjqjlpag6XHJcbiAgICAgIC8vIGVtYWlsOiBjb2duaXRvLlVzZXJQb29sRW1haWwud2l0aFNFUyh7XHJcbiAgICAgIC8vICAgZnJvbUVtYWlsOiAnbm9yZXBseUBwaWVjZS1hcHAuY29tJyxcclxuICAgICAgLy8gICBmcm9tTmFtZTogJ1BpZWNlIEFwcCcsXHJcbiAgICAgIC8vICAgc2VzUmVnaW9uOiAnYXAtbm9ydGhlYXN0LTEnLFxyXG4gICAgICAvLyB9KSxcclxuXHJcbiAgICAgIC8vIOODh+ODkOOCpOOCueODiOODqeODg+OCreODs+OCsO+8iFJlYWN0IE5hdGl2ZeWvvuW/nO+8iVxyXG4gICAgICBkZXZpY2VUcmFja2luZzoge1xyXG4gICAgICAgIGNoYWxsZW5nZVJlcXVpcmVkT25OZXdEZXZpY2U6IHRydWUsXHJcbiAgICAgICAgZGV2aWNlT25seVJlbWVtYmVyZWRPblVzZXJQcm9tcHQ6IHRydWUsXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyDpq5jluqbjgarjgrvjgq3jg6Xjg6rjg4bjgqNcclxuICAgICAgLy8g4pqg77iPIOiqsumHkeazqOaEjzogQVVESVTjgahFTkZPUkNFROOBryAkMC4wNS9NQVUg6Kqy6YeR44GV44KM44G+44GZXHJcbiAgICAgIC8vIOmWi+eZuueSsOWig+OBp+OBr+iqsumHkeOCkumBv+OBkeOCi+OBn+OCgU9GRuOBq+ioreWumlxyXG4gICAgICBhZHZhbmNlZFNlY3VyaXR5TW9kZTogZW52aXJvbm1lbnQgPT09ICdwcm9kJ1xyXG4gICAgICAgID8gY29nbml0by5BZHZhbmNlZFNlY3VyaXR5TW9kZS5FTkZPUkNFRCAgLy8g5pys55WqOiDjgrvjgq3jg6Xjg6rjg4bjgqPph43oppZcclxuICAgICAgICA6IGNvZ25pdG8uQWR2YW5jZWRTZWN1cml0eU1vZGUuT0ZGLCAgICAgICAvLyDplovnmbo6IOiqsumHkeWbnumBv+OBruOBn+OCgU9GRlxyXG5cclxuICAgICAgLy8g44Om44O844K244O85oub5b6F44Oh44OD44K744O844K4XHJcbiAgICAgIHVzZXJJbnZpdGF0aW9uOiB7XHJcbiAgICAgICAgZW1haWxTdWJqZWN0OiAnUGllY2UgQXBw44G444KI44GG44GT44Gd77yBJyxcclxuICAgICAgICBlbWFpbEJvZHk6IGBcclxuICAgICAgICAgIDxoMj5QaWVjZSBBcHDjgbjjgojjgYbjgZPjgZ08L2gyPlxyXG4gICAgICAgICAgPHA+44Ki44Kr44Km44Oz44OI44GM5L2c5oiQ44GV44KM44G+44GX44Gf44CCPC9wPlxyXG4gICAgICAgICAgPHA+44Om44O844K244O85ZCNOiB7dXNlcm5hbWV9PC9wPlxyXG4gICAgICAgICAgPHA+5Luu44OR44K544Ov44O844OJOiB7IyMjI308L3A+XHJcbiAgICAgICAgICA8cD7liJ3lm57jg63jgrDjgqTjg7PmmYLjgavjg5Hjgrnjg6/jg7zjg4njga7lpInmm7TjgYzlv4XopoHjgafjgZnjgII8L3A+XHJcbiAgICAgICAgYCxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIOODpuODvOOCtuODvOaknOiovOODoeODg+OCu+ODvOOCuFxyXG4gICAgICB1c2VyVmVyaWZpY2F0aW9uOiB7XHJcbiAgICAgICAgZW1haWxTdWJqZWN0OiAnUGllY2UgQXBwIC0g44Oh44O844Or44Ki44OJ44Os44K556K66KqNJyxcclxuICAgICAgICBlbWFpbEJvZHk6IGBcclxuICAgICAgICAgIDxoMj7jg6Hjg7zjg6vjgqLjg4njg6zjgrnjga7norroqo08L2gyPlxyXG4gICAgICAgICAgPHA+5Lul5LiL44Gu56K66KqN44Kz44O844OJ44KS5YWl5Yqb44GX44Gm44GP44Gg44GV44GEOjwvcD5cclxuICAgICAgICAgIDxoMz57IyMjI308L2gzPlxyXG4gICAgICAgIGAsXHJcbiAgICAgICAgZW1haWxTdHlsZTogY29nbml0by5WZXJpZmljYXRpb25FbWFpbFN0eWxlLkNPREUsXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyDliYrpmaTkv53orbfvvIjmnKznlarnkrDlooPvvIlcclxuICAgICAgcmVtb3ZhbFBvbGljeTogZW52aXJvbm1lbnQgPT09ICdwcm9kJ1xyXG4gICAgICAgID8gY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOXHJcbiAgICAgICAgOiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxyXG5cclxuICAgICAgLy8gTGFtYmRhIOODiOODquOCrOODvFxyXG4gICAgICBsYW1iZGFUcmlnZ2Vyczoge1xyXG4gICAgICAgIHBvc3RDb25maXJtYXRpb246IHBvc3RDb25maXJtYXRpb25MYW1iZGEsIC8vIOODoeODvOODq+eiuuiqjeW+jOOAgUR5bmFtb0RC44Gr44Ki44Kr44Km44Oz44OI5L2c5oiQXHJcbiAgICAgICAgLy8g5bCG5p2l44Gu5ouh5by155SoOlxyXG4gICAgICAgIC8vIHByZVNpZ25VcDogcHJlU2lnblVwTGFtYmRhLFxyXG4gICAgICAgIC8vIHByZUF1dGhlbnRpY2F0aW9uOiBwcmVBdXRoTGFtYmRhLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIFVzZXIgUG9vbCBDbGllbnTvvIhSZWFjdCBOYXRpdmUg44Ki44OX44Oq55So77yJXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgdGhpcy51c2VyUG9vbENsaWVudCA9IG5ldyBjb2duaXRvLlVzZXJQb29sQ2xpZW50KHRoaXMsICdQaWVjZUFwcENsaWVudCcsIHtcclxuICAgICAgdXNlclBvb2w6IHRoaXMudXNlclBvb2wsXHJcbiAgICAgIHVzZXJQb29sQ2xpZW50TmFtZTogYHBpZWNlLWFwcC1jbGllbnQtJHtlbnZpcm9ubWVudH1gLFxyXG5cclxuICAgICAgLy8g6KqN6Ki844OV44Ot44O8XHJcbiAgICAgIGF1dGhGbG93czoge1xyXG4gICAgICAgIHVzZXJQYXNzd29yZDogdHJ1ZSwgLy8g44Om44O844K244O85ZCN44O744OR44K544Ov44O844OJ6KqN6Ki8XHJcbiAgICAgICAgdXNlclNycDogdHJ1ZSwgLy8gU1JQ77yIU2VjdXJlIFJlbW90ZSBQYXNzd29yZO+8ieiqjeiovFxyXG4gICAgICAgIGN1c3RvbTogZmFsc2UsXHJcbiAgICAgICAgYWRtaW5Vc2VyUGFzc3dvcmQ6IGZhbHNlLCAvLyDnrqHnkIbogIXjgavjgojjgovoqo3oqLzjga/nhKHlirlcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIE9BdXRo6Kit5a6a77yI5bCG5p2l44Gu44K944O844K344Oj44Or44Ot44Kw44Kk44Oz55So77yJXHJcbiAgICAgIC8vIOKaoO+4jyDoqrLph5Hms6jmhI86IGNsaWVudENyZWRlbnRpYWxzIOODleODreODvOOBryAkNi4wMC/mnIgg6Kqy6YeR44GV44KM44G+44GZ77yI6Kit5a6a44GX44Gm44GE44G+44Gb44KT77yJXHJcbiAgICAgIG9BdXRoOiB7XHJcbiAgICAgICAgZmxvd3M6IHtcclxuICAgICAgICAgIGF1dGhvcml6YXRpb25Db2RlR3JhbnQ6IHRydWUsICAgLy8g54Sh5paZXHJcbiAgICAgICAgICBpbXBsaWNpdENvZGVHcmFudDogZmFsc2UsICAgICAgICAvLyDnhKHmlplcclxuICAgICAgICAgIC8vIGNsaWVudENyZWRlbnRpYWxzOiBmYWxzZSwgICAgIC8vIOKdjCBNMk3oqo3oqLzjga8gJDYuMDAv5pyIIOiqsumHke+8geS9v+eUqOemgeatolxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2NvcGVzOiBbXHJcbiAgICAgICAgICBjb2duaXRvLk9BdXRoU2NvcGUuRU1BSUwsXHJcbiAgICAgICAgICBjb2duaXRvLk9BdXRoU2NvcGUuT1BFTklELFxyXG4gICAgICAgICAgY29nbml0by5PQXV0aFNjb3BlLlBST0ZJTEUsXHJcbiAgICAgICAgXSxcclxuICAgICAgICBjYWxsYmFja1VybHM6IGVudmlyb25tZW50ID09PSAncHJvZCdcclxuICAgICAgICAgID8gWydodHRwczovL3BpZWNlLWFwcC5jb20vY2FsbGJhY2snLCAncGllY2VhcHA6Ly9jYWxsYmFjayddXHJcbiAgICAgICAgICA6IFsnaHR0cDovL2xvY2FsaG9zdDoxOTAwNi9jYWxsYmFjaycsICdwaWVjZWFwcDovL2NhbGxiYWNrJ10sXHJcbiAgICAgICAgbG9nb3V0VXJsczogZW52aXJvbm1lbnQgPT09ICdwcm9kJ1xyXG4gICAgICAgICAgPyBbJ2h0dHBzOi8vcGllY2UtYXBwLmNvbS9sb2dvdXQnLCAncGllY2VhcHA6Ly9sb2dvdXQnXVxyXG4gICAgICAgICAgOiBbJ2h0dHA6Ly9sb2NhbGhvc3Q6MTkwMDYvbG9nb3V0JywgJ3BpZWNlYXBwOi8vbG9nb3V0J10sXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyDjg4jjg7zjgq/jg7PoqK3lrppcclxuICAgICAgYWNjZXNzVG9rZW5WYWxpZGl0eTogY2RrLkR1cmF0aW9uLmhvdXJzKDEpLCAvLyDjgqLjgq/jgrvjgrnjg4jjg7zjgq/jg7PmnInlirnmnJ/pmZBcclxuICAgICAgaWRUb2tlblZhbGlkaXR5OiBjZGsuRHVyYXRpb24uaG91cnMoMSksIC8vIElE44OI44O844Kv44Oz5pyJ5Yq55pyf6ZmQXHJcbiAgICAgIHJlZnJlc2hUb2tlblZhbGlkaXR5OiBjZGsuRHVyYXRpb24uZGF5cygzMCksIC8vIOODquODleODrOODg+OCt+ODpeODiOODvOOCr+ODs+acieWKueacn+mZkFxyXG5cclxuICAgICAgLy8g44K744Kt44Ol44Oq44OG44Kj6Kit5a6aXHJcbiAgICAgIHByZXZlbnRVc2VyRXhpc3RlbmNlRXJyb3JzOiB0cnVlLCAvLyDjg6bjg7zjgrbjg7zlrZjlnKjjg4Hjgqfjg4Pjgq/mlLvmkoPjgpLpmLLjgZBcclxuICAgICAgZW5hYmxlVG9rZW5SZXZvY2F0aW9uOiB0cnVlLCAvLyDjg4jjg7zjgq/jg7Plj5bjgormtojjgZfmqZ/og71cclxuXHJcbiAgICAgIC8vIOiqreOBv+WPluOCii/mm7jjgY3ovrzjgb/lsZ7mgKdcclxuICAgICAgcmVhZEF0dHJpYnV0ZXM6IG5ldyBjb2duaXRvLkNsaWVudEF0dHJpYnV0ZXMoKVxyXG4gICAgICAgIC53aXRoU3RhbmRhcmRBdHRyaWJ1dGVzKHtcclxuICAgICAgICAgIGVtYWlsOiB0cnVlLFxyXG4gICAgICAgICAgZW1haWxWZXJpZmllZDogdHJ1ZSxcclxuICAgICAgICAgIHBob25lTnVtYmVyOiB0cnVlLFxyXG4gICAgICAgICAgcGhvbmVOdW1iZXJWZXJpZmllZDogdHJ1ZSxcclxuICAgICAgICAgIGdpdmVuTmFtZTogdHJ1ZSxcclxuICAgICAgICAgIGZhbWlseU5hbWU6IHRydWUsXHJcbiAgICAgICAgICBiaXJ0aGRhdGU6IHRydWUsXHJcbiAgICAgICAgfSlcclxuICAgICAgICAud2l0aEN1c3RvbUF0dHJpYnV0ZXMoJ2FjY291bnRJZCcsICdoYW5kbGUnLCAnYWNjb3VudFR5cGUnKSxcclxuXHJcbiAgICAgIHdyaXRlQXR0cmlidXRlczogbmV3IGNvZ25pdG8uQ2xpZW50QXR0cmlidXRlcygpXHJcbiAgICAgICAgLndpdGhTdGFuZGFyZEF0dHJpYnV0ZXMoe1xyXG4gICAgICAgICAgZW1haWw6IHRydWUsXHJcbiAgICAgICAgICBwaG9uZU51bWJlcjogdHJ1ZSxcclxuICAgICAgICAgIGdpdmVuTmFtZTogdHJ1ZSxcclxuICAgICAgICAgIGZhbWlseU5hbWU6IHRydWUsXHJcbiAgICAgICAgICBiaXJ0aGRhdGU6IHRydWUsXHJcbiAgICAgICAgfSlcclxuICAgICAgICAud2l0aEN1c3RvbUF0dHJpYnV0ZXMoJ2hhbmRsZScsICdhY2NvdW50VHlwZScpLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIE91dHB1dHNcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlclBvb2xJZCcsIHtcclxuICAgICAgdmFsdWU6IHRoaXMudXNlclBvb2wudXNlclBvb2xJZCxcclxuICAgICAgZGVzY3JpcHRpb246ICdDb2duaXRvIFVzZXIgUG9vbCBJRCcsXHJcbiAgICAgIGV4cG9ydE5hbWU6IGBQaWVjZUFwcC1Vc2VyUG9vbElkLSR7ZW52aXJvbm1lbnR9YCxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVc2VyUG9vbEFybicsIHtcclxuICAgICAgdmFsdWU6IHRoaXMudXNlclBvb2wudXNlclBvb2xBcm4sXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29nbml0byBVc2VyIFBvb2wgQVJOJyxcclxuICAgICAgZXhwb3J0TmFtZTogYFBpZWNlQXBwLVVzZXJQb29sQXJuLSR7ZW52aXJvbm1lbnR9YCxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVc2VyUG9vbENsaWVudElkJywge1xyXG4gICAgICB2YWx1ZTogdGhpcy51c2VyUG9vbENsaWVudC51c2VyUG9vbENsaWVudElkLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZ25pdG8gVXNlciBQb29sIENsaWVudCBJRCcsXHJcbiAgICAgIGV4cG9ydE5hbWU6IGBQaWVjZUFwcC1Vc2VyUG9vbENsaWVudElkLSR7ZW52aXJvbm1lbnR9YCxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVc2VyUG9vbERvbWFpbicsIHtcclxuICAgICAgdmFsdWU6IGBodHRwczovL2NvZ25pdG8taWRwLiR7Y2RrLlN0YWNrLm9mKHRoaXMpLnJlZ2lvbn0uYW1hem9uYXdzLmNvbS8ke3RoaXMudXNlclBvb2wudXNlclBvb2xJZH1gLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZ25pdG8gVXNlciBQb29sIERvbWFpbicsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIl19