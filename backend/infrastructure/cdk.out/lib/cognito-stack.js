"use strict";
/**
 * Cognito User Pool Stack
 * ユーザー認証・認可の管理
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
            advancedSecurityMode: environment === 'prod'
                ? cognito.AdvancedSecurityMode.ENFORCED
                : cognito.AdvancedSecurityMode.AUDIT,
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
            oAuth: {
                flows: {
                    authorizationCodeGrant: true,
                    implicitCodeGrant: false,
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
exports.CognitoStack = CognitoStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29nbml0by1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9jb2duaXRvLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILGlEQUFtQztBQUNuQyxpRUFBbUQ7QUFPbkQsTUFBYSxZQUFhLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFJekMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUF3QjtRQUNoRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLEVBQUUsV0FBVyxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBRTlCLHdEQUF3RDtRQUN4RCxjQUFjO1FBQ2Qsd0RBQXdEO1FBQ3hELElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUM3RCxZQUFZLEVBQUUsbUJBQW1CLFdBQVcsRUFBRTtZQUU5QyxVQUFVO1lBQ1YsYUFBYSxFQUFFO2dCQUNiLEtBQUssRUFBRSxJQUFJO2dCQUNYLFFBQVEsRUFBRSxJQUFJO2FBQ2Y7WUFFRCxPQUFPO1lBQ1AsVUFBVSxFQUFFO2dCQUNWLEtBQUssRUFBRSxJQUFJLEVBQUUsZUFBZTthQUM3QjtZQUVELGVBQWU7WUFDZixrQkFBa0IsRUFBRTtnQkFDbEIsS0FBSyxFQUFFO29CQUNMLFFBQVEsRUFBRSxJQUFJO29CQUNkLE9BQU8sRUFBRSxJQUFJO2lCQUNkO2dCQUNELFNBQVMsRUFBRTtvQkFDVCxRQUFRLEVBQUUsS0FBSztvQkFDZixPQUFPLEVBQUUsSUFBSTtpQkFDZDtnQkFDRCxVQUFVLEVBQUU7b0JBQ1YsUUFBUSxFQUFFLEtBQUs7b0JBQ2YsT0FBTyxFQUFFLElBQUk7aUJBQ2Q7Z0JBQ0QsU0FBUyxFQUFFO29CQUNULFFBQVEsRUFBRSxLQUFLO29CQUNmLE9B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QyxLQUFLLEVBQUUsdUJBQXVCLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sa0JBQWtCLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFO1lBQ25HLFdBQVcsRUFBRSwwQkFBMEI7U0FDeEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBbE9ELG9DQWtPQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBDb2duaXRvIFVzZXIgUG9vbCBTdGFja1xyXG4gKiDjg6bjg7zjgrbjg7zoqo3oqLzjg7voqo3lj6/jga7nrqHnkIZcclxuICovXHJcblxyXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xyXG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2duaXRvJztcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcblxyXG5pbnRlcmZhY2UgQ29nbml0b1N0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XHJcbiAgZW52aXJvbm1lbnQ6ICdkZXYnIHwgJ3Byb2QnO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQ29nbml0b1N0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcclxuICBwdWJsaWMgcmVhZG9ubHkgdXNlclBvb2w6IGNvZ25pdG8uVXNlclBvb2w7XHJcbiAgcHVibGljIHJlYWRvbmx5IHVzZXJQb29sQ2xpZW50OiBjb2duaXRvLlVzZXJQb29sQ2xpZW50O1xyXG5cclxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQ29nbml0b1N0YWNrUHJvcHMpIHtcclxuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgIGNvbnN0IHsgZW52aXJvbm1lbnQgfSA9IHByb3BzO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyBVc2VyIFBvb2zkvZzmiJBcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICB0aGlzLnVzZXJQb29sID0gbmV3IGNvZ25pdG8uVXNlclBvb2wodGhpcywgJ1BpZWNlQXBwVXNlclBvb2wnLCB7XHJcbiAgICAgIHVzZXJQb29sTmFtZTogYHBpZWNlLWFwcC11c2Vycy0ke2Vudmlyb25tZW50fWAsXHJcblxyXG4gICAgICAvLyDjgrXjgqTjg7PjgqTjg7PoqK3lrppcclxuICAgICAgc2lnbkluQWxpYXNlczoge1xyXG4gICAgICAgIGVtYWlsOiB0cnVlLFxyXG4gICAgICAgIHVzZXJuYW1lOiB0cnVlLFxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8g6Ieq5YuV5qSc6Ki8XHJcbiAgICAgIGF1dG9WZXJpZnk6IHtcclxuICAgICAgICBlbWFpbDogdHJ1ZSwgLy8g44Oh44O844Or44Ki44OJ44Os44K544KS6Ieq5YuV5qSc6Ki8XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyDjg6bjg7zjgrbjg7zlsZ7mgKfvvIjmqJnmupblsZ7mgKfvvIlcclxuICAgICAgc3RhbmRhcmRBdHRyaWJ1dGVzOiB7XHJcbiAgICAgICAgZW1haWw6IHtcclxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICAgICAgbXV0YWJsZTogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGdpdmVuTmFtZToge1xyXG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgbXV0YWJsZTogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZhbWlseU5hbWU6IHtcclxuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcclxuICAgICAgICAgIG11dGFibGU6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBiaXJ0aGRhdGU6IHtcclxuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcclxuICAgICAgICAgIG11dGFibGU6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIOOCq+OCueOCv+ODoOWxnuaAp++8iOWwhuadpeOBruaLoeW8teeUqO+8iVxyXG4gICAgICBjdXN0b21BdHRyaWJ1dGVzOiB7XHJcbiAgICAgICAgYWNjb3VudElkOiBuZXcgY29nbml0by5TdHJpbmdBdHRyaWJ1dGUoe1xyXG4gICAgICAgICAgbWluTGVuOiAyNixcclxuICAgICAgICAgIG1heExlbjogMjYsXHJcbiAgICAgICAgICBtdXRhYmxlOiBmYWxzZSwgLy8gVUxJROOBr+WkieabtOS4jeWPr1xyXG4gICAgICAgIH0pLFxyXG4gICAgICAgIGFjY291bnRUeXBlOiBuZXcgY29nbml0by5TdHJpbmdBdHRyaWJ1dGUoe1xyXG4gICAgICAgICAgbWluTGVuOiAxLFxyXG4gICAgICAgICAgbWF4TGVuOiAyMCxcclxuICAgICAgICAgIG11dGFibGU6IHRydWUsXHJcbiAgICAgICAgfSksXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyDjg5Hjgrnjg6/jg7zjg4njg53jg6rjgrfjg7xcclxuICAgICAgcGFzc3dvcmRQb2xpY3k6IHtcclxuICAgICAgICBtaW5MZW5ndGg6IDgsXHJcbiAgICAgICAgcmVxdWlyZUxvd2VyY2FzZTogdHJ1ZSxcclxuICAgICAgICByZXF1aXJlVXBwZXJjYXNlOiB0cnVlLFxyXG4gICAgICAgIHJlcXVpcmVEaWdpdHM6IHRydWUsXHJcbiAgICAgICAgcmVxdWlyZVN5bWJvbHM6IGZhbHNlLCAvLyDjg6Ljg5DjgqTjg6vjgqLjg5fjg6rjga7jgZ/jgoHoqJjlj7fjga/ku7vmhI9cclxuICAgICAgICB0ZW1wUGFzc3dvcmRWYWxpZGl0eTogY2RrLkR1cmF0aW9uLmRheXMoMyksXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyDjgqLjgqvjgqbjg7Pjg4jjg6rjgqvjg5Djg6rjg7xcclxuICAgICAgYWNjb3VudFJlY292ZXJ5OiBjb2duaXRvLkFjY291bnRSZWNvdmVyeS5FTUFJTF9PTkxZLFxyXG5cclxuICAgICAgLy8gTUZB6Kit5a6aXHJcbiAgICAgIG1mYTogY29nbml0by5NZmEuT1BUSU9OQUwsIC8vIOODpuODvOOCtuODvOOBjOmBuOaKnuWPr+iDvVxyXG4gICAgICBtZmFTZWNvbmRGYWN0b3I6IHtcclxuICAgICAgICBzbXM6IGZhbHNlLCAvLyBTTVPjga/pq5jjgrPjgrnjg4jjga7jgZ/jgoHnhKHlirlcclxuICAgICAgICBvdHA6IHRydWUsIC8vIFRPVFDvvIjoqo3oqLzjgqLjg5fjg6rvvInjgpLmnInlirnljJZcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIOODoeODvOODq+ioreWumlxyXG4gICAgICBlbWFpbDogY29nbml0by5Vc2VyUG9vbEVtYWlsLndpdGhDb2duaXRvKCksIC8vIENvZ25pdG/mqJnmupbjg6Hjg7zjg6vvvIjplovnmbrnkrDlooPvvIlcclxuICAgICAgLy8g5pys55Wq55Kw5aKD44Gn44GvU0VT44KS5L2/55So44GZ44KL44GT44Go44KS5o6o5aWoOlxyXG4gICAgICAvLyBlbWFpbDogY29nbml0by5Vc2VyUG9vbEVtYWlsLndpdGhTRVMoe1xyXG4gICAgICAvLyAgIGZyb21FbWFpbDogJ25vcmVwbHlAcGllY2UtYXBwLmNvbScsXHJcbiAgICAgIC8vICAgZnJvbU5hbWU6ICdQaWVjZSBBcHAnLFxyXG4gICAgICAvLyAgIHNlc1JlZ2lvbjogJ2FwLW5vcnRoZWFzdC0xJyxcclxuICAgICAgLy8gfSksXHJcblxyXG4gICAgICAvLyDjg4fjg5DjgqTjgrnjg4jjg6njg4Pjgq3jg7PjgrDvvIhSZWFjdCBOYXRpdmXlr77lv5zvvIlcclxuICAgICAgZGV2aWNlVHJhY2tpbmc6IHtcclxuICAgICAgICBjaGFsbGVuZ2VSZXF1aXJlZE9uTmV3RGV2aWNlOiB0cnVlLFxyXG4gICAgICAgIGRldmljZU9ubHlSZW1lbWJlcmVkT25Vc2VyUHJvbXB0OiB0cnVlLFxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8g6auY5bqm44Gq44K744Kt44Ol44Oq44OG44KjXHJcbiAgICAgIGFkdmFuY2VkU2VjdXJpdHlNb2RlOiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnXHJcbiAgICAgICAgPyBjb2duaXRvLkFkdmFuY2VkU2VjdXJpdHlNb2RlLkVORk9SQ0VEXHJcbiAgICAgICAgOiBjb2duaXRvLkFkdmFuY2VkU2VjdXJpdHlNb2RlLkFVRElULFxyXG5cclxuICAgICAgLy8g44Om44O844K244O85oub5b6F44Oh44OD44K744O844K4XHJcbiAgICAgIHVzZXJJbnZpdGF0aW9uOiB7XHJcbiAgICAgICAgZW1haWxTdWJqZWN0OiAnUGllY2UgQXBw44G444KI44GG44GT44Gd77yBJyxcclxuICAgICAgICBlbWFpbEJvZHk6IGBcclxuICAgICAgICAgIDxoMj5QaWVjZSBBcHDjgbjjgojjgYbjgZPjgZ08L2gyPlxyXG4gICAgICAgICAgPHA+44Ki44Kr44Km44Oz44OI44GM5L2c5oiQ44GV44KM44G+44GX44Gf44CCPC9wPlxyXG4gICAgICAgICAgPHA+44Om44O844K244O85ZCNOiB7dXNlcm5hbWV9PC9wPlxyXG4gICAgICAgICAgPHA+5Luu44OR44K544Ov44O844OJOiB7IyMjI308L3A+XHJcbiAgICAgICAgICA8cD7liJ3lm57jg63jgrDjgqTjg7PmmYLjgavjg5Hjgrnjg6/jg7zjg4njga7lpInmm7TjgYzlv4XopoHjgafjgZnjgII8L3A+XHJcbiAgICAgICAgYCxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIOODpuODvOOCtuODvOaknOiovOODoeODg+OCu+ODvOOCuFxyXG4gICAgICB1c2VyVmVyaWZpY2F0aW9uOiB7XHJcbiAgICAgICAgZW1haWxTdWJqZWN0OiAnUGllY2UgQXBwIC0g44Oh44O844Or44Ki44OJ44Os44K556K66KqNJyxcclxuICAgICAgICBlbWFpbEJvZHk6IGBcclxuICAgICAgICAgIDxoMj7jg6Hjg7zjg6vjgqLjg4njg6zjgrnjga7norroqo08L2gyPlxyXG4gICAgICAgICAgPHA+5Lul5LiL44Gu56K66KqN44Kz44O844OJ44KS5YWl5Yqb44GX44Gm44GP44Gg44GV44GEOjwvcD5cclxuICAgICAgICAgIDxoMz57IyMjI308L2gzPlxyXG4gICAgICAgIGAsXHJcbiAgICAgICAgZW1haWxTdHlsZTogY29nbml0by5WZXJpZmljYXRpb25FbWFpbFN0eWxlLkNPREUsXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyDliYrpmaTkv53orbfvvIjmnKznlarnkrDlooPvvIlcclxuICAgICAgcmVtb3ZhbFBvbGljeTogZW52aXJvbm1lbnQgPT09ICdwcm9kJ1xyXG4gICAgICAgID8gY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOXHJcbiAgICAgICAgOiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxyXG5cclxuICAgICAgLy8gTGFtYmRhIOODiOODquOCrOODvO+8iOWwhuadpeOBruaLoeW8teeUqO+8iVxyXG4gICAgICAvLyBsYW1iZGFUcmlnZ2Vyczoge1xyXG4gICAgICAvLyAgIHByZVNpZ25VcDogcHJlU2lnblVwTGFtYmRhLFxyXG4gICAgICAvLyAgIHBvc3RDb25maXJtYXRpb246IHBvc3RDb25maXJtYXRpb25MYW1iZGEsXHJcbiAgICAgIC8vICAgcHJlQXV0aGVudGljYXRpb246IHByZUF1dGhMYW1iZGEsXHJcbiAgICAgIC8vIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gVXNlciBQb29sIENsaWVudO+8iFJlYWN0IE5hdGl2ZSDjgqLjg5fjg6rnlKjvvIlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICB0aGlzLnVzZXJQb29sQ2xpZW50ID0gbmV3IGNvZ25pdG8uVXNlclBvb2xDbGllbnQodGhpcywgJ1BpZWNlQXBwQ2xpZW50Jywge1xyXG4gICAgICB1c2VyUG9vbDogdGhpcy51c2VyUG9vbCxcclxuICAgICAgdXNlclBvb2xDbGllbnROYW1lOiBgcGllY2UtYXBwLWNsaWVudC0ke2Vudmlyb25tZW50fWAsXHJcblxyXG4gICAgICAvLyDoqo3oqLzjg5Xjg63jg7xcclxuICAgICAgYXV0aEZsb3dzOiB7XHJcbiAgICAgICAgdXNlclBhc3N3b3JkOiB0cnVlLCAvLyDjg6bjg7zjgrbjg7zlkI3jg7vjg5Hjgrnjg6/jg7zjg4noqo3oqLxcclxuICAgICAgICB1c2VyU3JwOiB0cnVlLCAvLyBTUlDvvIhTZWN1cmUgUmVtb3RlIFBhc3N3b3Jk77yJ6KqN6Ki8XHJcbiAgICAgICAgY3VzdG9tOiBmYWxzZSxcclxuICAgICAgICBhZG1pblVzZXJQYXNzd29yZDogZmFsc2UsIC8vIOeuoeeQhuiAheOBq+OCiOOCi+iqjeiovOOBr+eEoeWKuVxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gT0F1dGjoqK3lrprvvIjlsIbmnaXjga7jgr3jg7zjgrfjg6Pjg6vjg63jgrDjgqTjg7PnlKjvvIlcclxuICAgICAgb0F1dGg6IHtcclxuICAgICAgICBmbG93czoge1xyXG4gICAgICAgICAgYXV0aG9yaXphdGlvbkNvZGVHcmFudDogdHJ1ZSxcclxuICAgICAgICAgIGltcGxpY2l0Q29kZUdyYW50OiBmYWxzZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNjb3BlczogW1xyXG4gICAgICAgICAgY29nbml0by5PQXV0aFNjb3BlLkVNQUlMLFxyXG4gICAgICAgICAgY29nbml0by5PQXV0aFNjb3BlLk9QRU5JRCxcclxuICAgICAgICAgIGNvZ25pdG8uT0F1dGhTY29wZS5QUk9GSUxFLFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgY2FsbGJhY2tVcmxzOiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnXHJcbiAgICAgICAgICA/IFsnaHR0cHM6Ly9waWVjZS1hcHAuY29tL2NhbGxiYWNrJywgJ3BpZWNlYXBwOi8vY2FsbGJhY2snXVxyXG4gICAgICAgICAgOiBbJ2h0dHA6Ly9sb2NhbGhvc3Q6MTkwMDYvY2FsbGJhY2snLCAncGllY2VhcHA6Ly9jYWxsYmFjayddLFxyXG4gICAgICAgIGxvZ291dFVybHM6IGVudmlyb25tZW50ID09PSAncHJvZCdcclxuICAgICAgICAgID8gWydodHRwczovL3BpZWNlLWFwcC5jb20vbG9nb3V0JywgJ3BpZWNlYXBwOi8vbG9nb3V0J11cclxuICAgICAgICAgIDogWydodHRwOi8vbG9jYWxob3N0OjE5MDA2L2xvZ291dCcsICdwaWVjZWFwcDovL2xvZ291dCddLFxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8g44OI44O844Kv44Oz6Kit5a6aXHJcbiAgICAgIGFjY2Vzc1Rva2VuVmFsaWRpdHk6IGNkay5EdXJhdGlvbi5ob3VycygxKSwgLy8g44Ki44Kv44K744K544OI44O844Kv44Oz5pyJ5Yq55pyf6ZmQXHJcbiAgICAgIGlkVG9rZW5WYWxpZGl0eTogY2RrLkR1cmF0aW9uLmhvdXJzKDEpLCAvLyBJROODiOODvOOCr+ODs+acieWKueacn+mZkFxyXG4gICAgICByZWZyZXNoVG9rZW5WYWxpZGl0eTogY2RrLkR1cmF0aW9uLmRheXMoMzApLCAvLyDjg6rjg5Xjg6zjg4Pjgrfjg6Xjg4jjg7zjgq/jg7PmnInlirnmnJ/pmZBcclxuXHJcbiAgICAgIC8vIOOCu+OCreODpeODquODhuOCo+ioreWumlxyXG4gICAgICBwcmV2ZW50VXNlckV4aXN0ZW5jZUVycm9yczogdHJ1ZSwgLy8g44Om44O844K244O85a2Y5Zyo44OB44Kn44OD44Kv5pS75pKD44KS6Ziy44GQXHJcbiAgICAgIGVuYWJsZVRva2VuUmV2b2NhdGlvbjogdHJ1ZSwgLy8g44OI44O844Kv44Oz5Y+W44KK5raI44GX5qmf6IO9XHJcblxyXG4gICAgICAvLyDoqq3jgb/lj5bjgoov5pu444GN6L6844G/5bGe5oCnXHJcbiAgICAgIHJlYWRBdHRyaWJ1dGVzOiBuZXcgY29nbml0by5DbGllbnRBdHRyaWJ1dGVzKClcclxuICAgICAgICAud2l0aFN0YW5kYXJkQXR0cmlidXRlcyh7XHJcbiAgICAgICAgICBlbWFpbDogdHJ1ZSxcclxuICAgICAgICAgIGVtYWlsVmVyaWZpZWQ6IHRydWUsXHJcbiAgICAgICAgICBnaXZlbk5hbWU6IHRydWUsXHJcbiAgICAgICAgICBmYW1pbHlOYW1lOiB0cnVlLFxyXG4gICAgICAgICAgYmlydGhkYXRlOiB0cnVlLFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLndpdGhDdXN0b21BdHRyaWJ1dGVzKCdhY2NvdW50SWQnLCAnYWNjb3VudFR5cGUnKSxcclxuXHJcbiAgICAgIHdyaXRlQXR0cmlidXRlczogbmV3IGNvZ25pdG8uQ2xpZW50QXR0cmlidXRlcygpXHJcbiAgICAgICAgLndpdGhTdGFuZGFyZEF0dHJpYnV0ZXMoe1xyXG4gICAgICAgICAgZW1haWw6IHRydWUsXHJcbiAgICAgICAgICBnaXZlbk5hbWU6IHRydWUsXHJcbiAgICAgICAgICBmYW1pbHlOYW1lOiB0cnVlLFxyXG4gICAgICAgICAgYmlydGhkYXRlOiB0cnVlLFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLndpdGhDdXN0b21BdHRyaWJ1dGVzKCdhY2NvdW50VHlwZScpLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIE91dHB1dHNcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlclBvb2xJZCcsIHtcclxuICAgICAgdmFsdWU6IHRoaXMudXNlclBvb2wudXNlclBvb2xJZCxcclxuICAgICAgZGVzY3JpcHRpb246ICdDb2duaXRvIFVzZXIgUG9vbCBJRCcsXHJcbiAgICAgIGV4cG9ydE5hbWU6IGBQaWVjZUFwcC1Vc2VyUG9vbElkLSR7ZW52aXJvbm1lbnR9YCxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVc2VyUG9vbEFybicsIHtcclxuICAgICAgdmFsdWU6IHRoaXMudXNlclBvb2wudXNlclBvb2xBcm4sXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29nbml0byBVc2VyIFBvb2wgQVJOJyxcclxuICAgICAgZXhwb3J0TmFtZTogYFBpZWNlQXBwLVVzZXJQb29sQXJuLSR7ZW52aXJvbm1lbnR9YCxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVc2VyUG9vbENsaWVudElkJywge1xyXG4gICAgICB2YWx1ZTogdGhpcy51c2VyUG9vbENsaWVudC51c2VyUG9vbENsaWVudElkLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZ25pdG8gVXNlciBQb29sIENsaWVudCBJRCcsXHJcbiAgICAgIGV4cG9ydE5hbWU6IGBQaWVjZUFwcC1Vc2VyUG9vbENsaWVudElkLSR7ZW52aXJvbm1lbnR9YCxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVc2VyUG9vbERvbWFpbicsIHtcclxuICAgICAgdmFsdWU6IGBodHRwczovL2NvZ25pdG8taWRwLiR7Y2RrLlN0YWNrLm9mKHRoaXMpLnJlZ2lvbn0uYW1hem9uYXdzLmNvbS8ke3RoaXMudXNlclBvb2wudXNlclBvb2xJZH1gLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZ25pdG8gVXNlciBQb29sIERvbWFpbicsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIl19