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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29nbml0by1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9jb2duaXRvLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7Ozs7R0FjRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsaURBQW1DO0FBQ25DLGlFQUFtRDtBQU9uRCxNQUFhLFlBQWEsU0FBUSxHQUFHLENBQUMsS0FBSztJQUl6QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXdCO1FBQ2hFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sRUFBRSxXQUFXLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFFOUIsd0RBQXdEO1FBQ3hELGNBQWM7UUFDZCx3REFBd0Q7UUFDeEQsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQzdELFlBQVksRUFBRSxtQkFBbUIsV0FBVyxFQUFFO1lBRTlDLFVBQVU7WUFDVixhQUFhLEVBQUU7Z0JBQ2IsS0FBSyxFQUFFLElBQUk7Z0JBQ1gsUUFBUSxFQUFFLElBQUk7YUFDZjtZQUVELE9BQU87WUFDUCxVQUFVLEVBQUU7Z0JBQ1YsS0FBSyxFQUFFLElBQUksRUFBRSxlQUFlO2FBQzdCO1lBRUQsZUFBZTtZQUNmLGtCQUFrQixFQUFFO2dCQUNsQixLQUFLLEVBQUU7b0JBQ0wsUUFBUSxFQUFFLElBQUk7b0JBQ2QsT0FBTyxFQUFFLElBQUk7aUJBQ2Q7Z0JBQ0QsU0FBUyxFQUFFO29CQUNULFFBQVEsRUFBRSxLQUFLO29CQUNmLE9BQU8sRUFBRSxJQUFJO2lCQUNkO2dCQUNELFVBQVUsRUFBRTtvQkFDVixRQUFRLEVBQUUsS0FBSztvQkFDZixPQUFPLEVBQUUsSUFBSTtpQkFDZDtnQkFDRCxTQUFTLEVBQUU7b0JBQ1QsUUFBUSxFQUFFLEtB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O1lBQzFDLFVBQVUsRUFBRSw2QkFBNkIsV0FBVyxFQUFFO1NBQ3ZELENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDeEMsS0FBSyxFQUFFLHVCQUF1QixHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLGtCQUFrQixJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRTtZQUNuRyxXQUFXLEVBQUUsMEJBQTBCO1NBQ3hDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXRPRCxvQ0FzT0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ29nbml0byBVc2VyIFBvb2wgU3RhY2tcclxuICog44Om44O844K244O86KqN6Ki844O76KqN5Y+v44Gu566h55CGXHJcbiAqXHJcbiAqIOKaoO+4jyDoqrLph5HjgavplqLjgZnjgovms6jmhI/kuovpoIU6XHJcbiAqIDEuIOacgOWIneOBriAxMCwwMDAgTUFV77yI5pyI6ZaT44Ki44Kv44OG44Kj44OW44Om44O844K244O877yJ44G+44Gn54Sh5paZXHJcbiAqIDIuIEFkdmFuY2VkIFNlY3VyaXR5IE1vZGUgKEFVRElUL0VORk9SQ0VEKTogJDAuMDUvTUFVIOiqsumHkVxyXG4gKiAgICDihpIg6ZaL55m655Kw5aKD44Gn44GvIE9GRiDjgavoqK3lrppcclxuICogMy4gT0F1dGggQ2xpZW50IENyZWRlbnRpYWxzIOODleODreODvDogJDYuMDAv5pyIIHBlciDjgq/jg6njgqTjgqLjg7Pjg4hcclxuICogICAg4oaSIE0yTeiqjeiovOeUqOOAgeOBk+OBruOCouODl+ODquOBp+OBr+S9v+eUqOOBl+OBquOBhFxyXG4gKiA0LiBTTVMgTUZBOiBTTVPpgIHkv6HjgZTjgajjgavoqrLph5FcclxuICogICAg4oaSIFRPVFDvvIjoqo3oqLzjgqLjg5fjg6rvvInjga7jgb/kvb/nlKhcclxuICogNS4g44Oh44O844Or6YCB5L+hOiDmnIDliJ3jga41MOmAmi/mnIjjgb7jgafnhKHmlpnjgIHku6XpmY3oqrLph5FcclxuICogICAg4oaSIOacrOeVqueSsOWig+OBp+OBr1NFU+S9v+eUqOOCkuaOqOWlqFxyXG4gKi9cclxuXHJcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XHJcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZ25pdG8nO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuXHJcbmludGVyZmFjZSBDb2duaXRvU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcclxuICBlbnZpcm9ubWVudDogJ2RldicgfCAncHJvZCc7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDb2duaXRvU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gIHB1YmxpYyByZWFkb25seSB1c2VyUG9vbDogY29nbml0by5Vc2VyUG9vbDtcclxuICBwdWJsaWMgcmVhZG9ubHkgdXNlclBvb2xDbGllbnQ6IGNvZ25pdG8uVXNlclBvb2xDbGllbnQ7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBDb2duaXRvU3RhY2tQcm9wcykge1xyXG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XHJcblxyXG4gICAgY29uc3QgeyBlbnZpcm9ubWVudCB9ID0gcHJvcHM7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIFVzZXIgUG9vbOS9nOaIkFxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIHRoaXMudXNlclBvb2wgPSBuZXcgY29nbml0by5Vc2VyUG9vbCh0aGlzLCAnUGllY2VBcHBVc2VyUG9vbCcsIHtcclxuICAgICAgdXNlclBvb2xOYW1lOiBgcGllY2UtYXBwLXVzZXJzLSR7ZW52aXJvbm1lbnR9YCxcclxuXHJcbiAgICAgIC8vIOOCteOCpOODs+OCpOODs+ioreWumlxyXG4gICAgICBzaWduSW5BbGlhc2VzOiB7XHJcbiAgICAgICAgZW1haWw6IHRydWUsXHJcbiAgICAgICAgdXNlcm5hbWU6IHRydWUsXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyDoh6rli5XmpJzoqLxcclxuICAgICAgYXV0b1ZlcmlmeToge1xyXG4gICAgICAgIGVtYWlsOiB0cnVlLCAvLyDjg6Hjg7zjg6vjgqLjg4njg6zjgrnjgpLoh6rli5XmpJzoqLxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIOODpuODvOOCtuODvOWxnuaAp++8iOaomea6luWxnuaAp++8iVxyXG4gICAgICBzdGFuZGFyZEF0dHJpYnV0ZXM6IHtcclxuICAgICAgICBlbWFpbDoge1xyXG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgICBtdXRhYmxlOiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZ2l2ZW5OYW1lOiB7XHJcbiAgICAgICAgICByZXF1aXJlZDogZmFsc2UsXHJcbiAgICAgICAgICBtdXRhYmxlOiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZmFtaWx5TmFtZToge1xyXG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgbXV0YWJsZTogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJpcnRoZGF0ZToge1xyXG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgbXV0YWJsZTogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8g44Kr44K544K/44Og5bGe5oCn77yI5bCG5p2l44Gu5ouh5by155So77yJXHJcbiAgICAgIGN1c3RvbUF0dHJpYnV0ZXM6IHtcclxuICAgICAgICBhY2NvdW50SWQ6IG5ldyBjb2duaXRvLlN0cmluZ0F0dHJpYnV0ZSh7XHJcbiAgICAgICAgICBtaW5MZW46IDI2LFxyXG4gICAgICAgICAgbWF4TGVuOiAyNixcclxuICAgICAgICAgIG11dGFibGU6IGZhbHNlLCAvLyBVTElE44Gv5aSJ5pu05LiN5Y+vXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgYWNjb3VudFR5cGU6IG5ldyBjb2duaXRvLlN0cmluZ0F0dHJpYnV0ZSh7XHJcbiAgICAgICAgICBtaW5MZW46IDEsXHJcbiAgICAgICAgICBtYXhMZW46IDIwLFxyXG4gICAgICAgICAgbXV0YWJsZTogdHJ1ZSxcclxuICAgICAgICB9KSxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIOODkeOCueODr+ODvOODieODneODquOCt+ODvFxyXG4gICAgICBwYXNzd29yZFBvbGljeToge1xyXG4gICAgICAgIG1pbkxlbmd0aDogOCxcclxuICAgICAgICByZXF1aXJlTG93ZXJjYXNlOiB0cnVlLFxyXG4gICAgICAgIHJlcXVpcmVVcHBlcmNhc2U6IHRydWUsXHJcbiAgICAgICAgcmVxdWlyZURpZ2l0czogdHJ1ZSxcclxuICAgICAgICByZXF1aXJlU3ltYm9sczogZmFsc2UsIC8vIOODouODkOOCpOODq+OCouODl+ODquOBruOBn+OCgeiomOWPt+OBr+S7u+aEj1xyXG4gICAgICAgIHRlbXBQYXNzd29yZFZhbGlkaXR5OiBjZGsuRHVyYXRpb24uZGF5cygzKSxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIOOCouOCq+OCpuODs+ODiOODquOCq+ODkOODquODvFxyXG4gICAgICBhY2NvdW50UmVjb3Zlcnk6IGNvZ25pdG8uQWNjb3VudFJlY292ZXJ5LkVNQUlMX09OTFksXHJcblxyXG4gICAgICAvLyBNRkHoqK3lrppcclxuICAgICAgbWZhOiBjb2duaXRvLk1mYS5PUFRJT05BTCwgLy8g44Om44O844K244O844GM6YG45oqe5Y+v6IO9XHJcbiAgICAgIG1mYVNlY29uZEZhY3Rvcjoge1xyXG4gICAgICAgIHNtczogZmFsc2UsIC8vIFNNU+OBr+mrmOOCs+OCueODiOOBruOBn+OCgeeEoeWKuVxyXG4gICAgICAgIG90cDogdHJ1ZSwgLy8gVE9UUO+8iOiqjeiovOOCouODl+ODqu+8ieOCkuacieWKueWMllxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8g44Oh44O844Or6Kit5a6aXHJcbiAgICAgIGVtYWlsOiBjb2duaXRvLlVzZXJQb29sRW1haWwud2l0aENvZ25pdG8oKSwgLy8gQ29nbml0b+aomea6luODoeODvOODq++8iOmWi+eZuueSsOWig++8iVxyXG4gICAgICAvLyDmnKznlarnkrDlooPjgafjga9TRVPjgpLkvb/nlKjjgZnjgovjgZPjgajjgpLmjqjlpag6XHJcbiAgICAgIC8vIGVtYWlsOiBjb2duaXRvLlVzZXJQb29sRW1haWwud2l0aFNFUyh7XHJcbiAgICAgIC8vICAgZnJvbUVtYWlsOiAnbm9yZXBseUBwaWVjZS1hcHAuY29tJyxcclxuICAgICAgLy8gICBmcm9tTmFtZTogJ1BpZWNlIEFwcCcsXHJcbiAgICAgIC8vICAgc2VzUmVnaW9uOiAnYXAtbm9ydGhlYXN0LTEnLFxyXG4gICAgICAvLyB9KSxcclxuXHJcbiAgICAgIC8vIOODh+ODkOOCpOOCueODiOODqeODg+OCreODs+OCsO+8iFJlYWN0IE5hdGl2ZeWvvuW/nO+8iVxyXG4gICAgICBkZXZpY2VUcmFja2luZzoge1xyXG4gICAgICAgIGNoYWxsZW5nZVJlcXVpcmVkT25OZXdEZXZpY2U6IHRydWUsXHJcbiAgICAgICAgZGV2aWNlT25seVJlbWVtYmVyZWRPblVzZXJQcm9tcHQ6IHRydWUsXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyDpq5jluqbjgarjgrvjgq3jg6Xjg6rjg4bjgqNcclxuICAgICAgLy8g4pqg77iPIOiqsumHkeazqOaEjzogQVVESVTjgahFTkZPUkNFROOBryAkMC4wNS9NQVUg6Kqy6YeR44GV44KM44G+44GZXHJcbiAgICAgIC8vIOmWi+eZuueSsOWig+OBp+OBr+iqsumHkeOCkumBv+OBkeOCi+OBn+OCgU9GRuOBq+ioreWumlxyXG4gICAgICBhZHZhbmNlZFNlY3VyaXR5TW9kZTogZW52aXJvbm1lbnQgPT09ICdwcm9kJ1xyXG4gICAgICAgID8gY29nbml0by5BZHZhbmNlZFNlY3VyaXR5TW9kZS5FTkZPUkNFRCAgLy8g5pys55WqOiDjgrvjgq3jg6Xjg6rjg4bjgqPph43oppZcclxuICAgICAgICA6IGNvZ25pdG8uQWR2YW5jZWRTZWN1cml0eU1vZGUuT0ZGLCAgICAgICAvLyDplovnmbo6IOiqsumHkeWbnumBv+OBruOBn+OCgU9GRlxyXG5cclxuICAgICAgLy8g44Om44O844K244O85oub5b6F44Oh44OD44K744O844K4XHJcbiAgICAgIHVzZXJJbnZpdGF0aW9uOiB7XHJcbiAgICAgICAgZW1haWxTdWJqZWN0OiAnUGllY2UgQXBw44G444KI44GG44GT44Gd77yBJyxcclxuICAgICAgICBlbWFpbEJvZHk6IGBcclxuICAgICAgICAgIDxoMj5QaWVjZSBBcHDjgbjjgojjgYbjgZPjgZ08L2gyPlxyXG4gICAgICAgICAgPHA+44Ki44Kr44Km44Oz44OI44GM5L2c5oiQ44GV44KM44G+44GX44Gf44CCPC9wPlxyXG4gICAgICAgICAgPHA+44Om44O844K244O85ZCNOiB7dXNlcm5hbWV9PC9wPlxyXG4gICAgICAgICAgPHA+5Luu44OR44K544Ov44O844OJOiB7IyMjI308L3A+XHJcbiAgICAgICAgICA8cD7liJ3lm57jg63jgrDjgqTjg7PmmYLjgavjg5Hjgrnjg6/jg7zjg4njga7lpInmm7TjgYzlv4XopoHjgafjgZnjgII8L3A+XHJcbiAgICAgICAgYCxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIOODpuODvOOCtuODvOaknOiovOODoeODg+OCu+ODvOOCuFxyXG4gICAgICB1c2VyVmVyaWZpY2F0aW9uOiB7XHJcbiAgICAgICAgZW1haWxTdWJqZWN0OiAnUGllY2UgQXBwIC0g44Oh44O844Or44Ki44OJ44Os44K556K66KqNJyxcclxuICAgICAgICBlbWFpbEJvZHk6IGBcclxuICAgICAgICAgIDxoMj7jg6Hjg7zjg6vjgqLjg4njg6zjgrnjga7norroqo08L2gyPlxyXG4gICAgICAgICAgPHA+5Lul5LiL44Gu56K66KqN44Kz44O844OJ44KS5YWl5Yqb44GX44Gm44GP44Gg44GV44GEOjwvcD5cclxuICAgICAgICAgIDxoMz57IyMjI308L2gzPlxyXG4gICAgICAgIGAsXHJcbiAgICAgICAgZW1haWxTdHlsZTogY29nbml0by5WZXJpZmljYXRpb25FbWFpbFN0eWxlLkNPREUsXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyDliYrpmaTkv53orbfvvIjmnKznlarnkrDlooPvvIlcclxuICAgICAgcmVtb3ZhbFBvbGljeTogZW52aXJvbm1lbnQgPT09ICdwcm9kJ1xyXG4gICAgICAgID8gY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOXHJcbiAgICAgICAgOiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxyXG5cclxuICAgICAgLy8gTGFtYmRhIOODiOODquOCrOODvO+8iOWwhuadpeOBruaLoeW8teeUqO+8iVxyXG4gICAgICAvLyBsYW1iZGFUcmlnZ2Vyczoge1xyXG4gICAgICAvLyAgIHByZVNpZ25VcDogcHJlU2lnblVwTGFtYmRhLFxyXG4gICAgICAvLyAgIHBvc3RDb25maXJtYXRpb246IHBvc3RDb25maXJtYXRpb25MYW1iZGEsXHJcbiAgICAgIC8vICAgcHJlQXV0aGVudGljYXRpb246IHByZUF1dGhMYW1iZGEsXHJcbiAgICAgIC8vIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gVXNlciBQb29sIENsaWVudO+8iFJlYWN0IE5hdGl2ZSDjgqLjg5fjg6rnlKjvvIlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICB0aGlzLnVzZXJQb29sQ2xpZW50ID0gbmV3IGNvZ25pdG8uVXNlclBvb2xDbGllbnQodGhpcywgJ1BpZWNlQXBwQ2xpZW50Jywge1xyXG4gICAgICB1c2VyUG9vbDogdGhpcy51c2VyUG9vbCxcclxuICAgICAgdXNlclBvb2xDbGllbnROYW1lOiBgcGllY2UtYXBwLWNsaWVudC0ke2Vudmlyb25tZW50fWAsXHJcblxyXG4gICAgICAvLyDoqo3oqLzjg5Xjg63jg7xcclxuICAgICAgYXV0aEZsb3dzOiB7XHJcbiAgICAgICAgdXNlclBhc3N3b3JkOiB0cnVlLCAvLyDjg6bjg7zjgrbjg7zlkI3jg7vjg5Hjgrnjg6/jg7zjg4noqo3oqLxcclxuICAgICAgICB1c2VyU3JwOiB0cnVlLCAvLyBTUlDvvIhTZWN1cmUgUmVtb3RlIFBhc3N3b3Jk77yJ6KqN6Ki8XHJcbiAgICAgICAgY3VzdG9tOiBmYWxzZSxcclxuICAgICAgICBhZG1pblVzZXJQYXNzd29yZDogZmFsc2UsIC8vIOeuoeeQhuiAheOBq+OCiOOCi+iqjeiovOOBr+eEoeWKuVxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gT0F1dGjoqK3lrprvvIjlsIbmnaXjga7jgr3jg7zjgrfjg6Pjg6vjg63jgrDjgqTjg7PnlKjvvIlcclxuICAgICAgLy8g4pqg77iPIOiqsumHkeazqOaEjzogY2xpZW50Q3JlZGVudGlhbHMg44OV44Ot44O844GvICQ2LjAwL+aciCDoqrLph5HjgZXjgozjgb7jgZnvvIjoqK3lrprjgZfjgabjgYTjgb7jgZvjgpPvvIlcclxuICAgICAgb0F1dGg6IHtcclxuICAgICAgICBmbG93czoge1xyXG4gICAgICAgICAgYXV0aG9yaXphdGlvbkNvZGVHcmFudDogdHJ1ZSwgICAvLyDnhKHmlplcclxuICAgICAgICAgIGltcGxpY2l0Q29kZUdyYW50OiBmYWxzZSwgICAgICAgIC8vIOeEoeaWmVxyXG4gICAgICAgICAgLy8gY2xpZW50Q3JlZGVudGlhbHM6IGZhbHNlLCAgICAgLy8g4p2MIE0yTeiqjeiovOOBryAkNi4wMC/mnIgg6Kqy6YeR77yB5L2/55So56aB5q2iXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzY29wZXM6IFtcclxuICAgICAgICAgIGNvZ25pdG8uT0F1dGhTY29wZS5FTUFJTCxcclxuICAgICAgICAgIGNvZ25pdG8uT0F1dGhTY29wZS5PUEVOSUQsXHJcbiAgICAgICAgICBjb2duaXRvLk9BdXRoU2NvcGUuUFJPRklMRSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIGNhbGxiYWNrVXJsczogZW52aXJvbm1lbnQgPT09ICdwcm9kJ1xyXG4gICAgICAgICAgPyBbJ2h0dHBzOi8vcGllY2UtYXBwLmNvbS9jYWxsYmFjaycsICdwaWVjZWFwcDovL2NhbGxiYWNrJ11cclxuICAgICAgICAgIDogWydodHRwOi8vbG9jYWxob3N0OjE5MDA2L2NhbGxiYWNrJywgJ3BpZWNlYXBwOi8vY2FsbGJhY2snXSxcclxuICAgICAgICBsb2dvdXRVcmxzOiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnXHJcbiAgICAgICAgICA/IFsnaHR0cHM6Ly9waWVjZS1hcHAuY29tL2xvZ291dCcsICdwaWVjZWFwcDovL2xvZ291dCddXHJcbiAgICAgICAgICA6IFsnaHR0cDovL2xvY2FsaG9zdDoxOTAwNi9sb2dvdXQnLCAncGllY2VhcHA6Ly9sb2dvdXQnXSxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIOODiOODvOOCr+ODs+ioreWumlxyXG4gICAgICBhY2Nlc3NUb2tlblZhbGlkaXR5OiBjZGsuRHVyYXRpb24uaG91cnMoMSksIC8vIOOCouOCr+OCu+OCueODiOODvOOCr+ODs+acieWKueacn+mZkFxyXG4gICAgICBpZFRva2VuVmFsaWRpdHk6IGNkay5EdXJhdGlvbi5ob3VycygxKSwgLy8gSUTjg4jjg7zjgq/jg7PmnInlirnmnJ/pmZBcclxuICAgICAgcmVmcmVzaFRva2VuVmFsaWRpdHk6IGNkay5EdXJhdGlvbi5kYXlzKDMwKSwgLy8g44Oq44OV44Os44OD44K344Ol44OI44O844Kv44Oz5pyJ5Yq55pyf6ZmQXHJcblxyXG4gICAgICAvLyDjgrvjgq3jg6Xjg6rjg4bjgqPoqK3lrppcclxuICAgICAgcHJldmVudFVzZXJFeGlzdGVuY2VFcnJvcnM6IHRydWUsIC8vIOODpuODvOOCtuODvOWtmOWcqOODgeOCp+ODg+OCr+aUu+aSg+OCkumYsuOBkFxyXG4gICAgICBlbmFibGVUb2tlblJldm9jYXRpb246IHRydWUsIC8vIOODiOODvOOCr+ODs+WPluOCiua2iOOBl+apn+iDvVxyXG5cclxuICAgICAgLy8g6Kqt44G/5Y+W44KKL+abuOOBjei+vOOBv+WxnuaAp1xyXG4gICAgICByZWFkQXR0cmlidXRlczogbmV3IGNvZ25pdG8uQ2xpZW50QXR0cmlidXRlcygpXHJcbiAgICAgICAgLndpdGhTdGFuZGFyZEF0dHJpYnV0ZXMoe1xyXG4gICAgICAgICAgZW1haWw6IHRydWUsXHJcbiAgICAgICAgICBlbWFpbFZlcmlmaWVkOiB0cnVlLFxyXG4gICAgICAgICAgZ2l2ZW5OYW1lOiB0cnVlLFxyXG4gICAgICAgICAgZmFtaWx5TmFtZTogdHJ1ZSxcclxuICAgICAgICAgIGJpcnRoZGF0ZTogdHJ1ZSxcclxuICAgICAgICB9KVxyXG4gICAgICAgIC53aXRoQ3VzdG9tQXR0cmlidXRlcygnYWNjb3VudElkJywgJ2FjY291bnRUeXBlJyksXHJcblxyXG4gICAgICB3cml0ZUF0dHJpYnV0ZXM6IG5ldyBjb2duaXRvLkNsaWVudEF0dHJpYnV0ZXMoKVxyXG4gICAgICAgIC53aXRoU3RhbmRhcmRBdHRyaWJ1dGVzKHtcclxuICAgICAgICAgIGVtYWlsOiB0cnVlLFxyXG4gICAgICAgICAgZ2l2ZW5OYW1lOiB0cnVlLFxyXG4gICAgICAgICAgZmFtaWx5TmFtZTogdHJ1ZSxcclxuICAgICAgICAgIGJpcnRoZGF0ZTogdHJ1ZSxcclxuICAgICAgICB9KVxyXG4gICAgICAgIC53aXRoQ3VzdG9tQXR0cmlidXRlcygnYWNjb3VudFR5cGUnKSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyBPdXRwdXRzXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1VzZXJQb29sSWQnLCB7XHJcbiAgICAgIHZhbHVlOiB0aGlzLnVzZXJQb29sLnVzZXJQb29sSWQsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29nbml0byBVc2VyIFBvb2wgSUQnLFxyXG4gICAgICBleHBvcnROYW1lOiBgUGllY2VBcHAtVXNlclBvb2xJZC0ke2Vudmlyb25tZW50fWAsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlclBvb2xBcm4nLCB7XHJcbiAgICAgIHZhbHVlOiB0aGlzLnVzZXJQb29sLnVzZXJQb29sQXJuLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZ25pdG8gVXNlciBQb29sIEFSTicsXHJcbiAgICAgIGV4cG9ydE5hbWU6IGBQaWVjZUFwcC1Vc2VyUG9vbEFybi0ke2Vudmlyb25tZW50fWAsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlclBvb2xDbGllbnRJZCcsIHtcclxuICAgICAgdmFsdWU6IHRoaXMudXNlclBvb2xDbGllbnQudXNlclBvb2xDbGllbnRJZCxcclxuICAgICAgZGVzY3JpcHRpb246ICdDb2duaXRvIFVzZXIgUG9vbCBDbGllbnQgSUQnLFxyXG4gICAgICBleHBvcnROYW1lOiBgUGllY2VBcHAtVXNlclBvb2xDbGllbnRJZC0ke2Vudmlyb25tZW50fWAsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlclBvb2xEb21haW4nLCB7XHJcbiAgICAgIHZhbHVlOiBgaHR0cHM6Ly9jb2duaXRvLWlkcC4ke2Nkay5TdGFjay5vZih0aGlzKS5yZWdpb259LmFtYXpvbmF3cy5jb20vJHt0aGlzLnVzZXJQb29sLnVzZXJQb29sSWR9YCxcclxuICAgICAgZGVzY3JpcHRpb246ICdDb2duaXRvIFVzZXIgUG9vbCBEb21haW4nLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiJdfQ==