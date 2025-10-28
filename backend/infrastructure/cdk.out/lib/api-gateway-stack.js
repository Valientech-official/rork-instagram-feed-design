"use strict";
/**
 * API Gateway (REST API) Stack
 * React Nativeアプリ向けのREST API設定
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
exports.ApiGatewayStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
class ApiGatewayStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const { environment, lambdaFunctions, userPool } = props;
        // =====================================================
        // CloudWatch Logs
        // =====================================================
        const accessLogGroup = new logs.LogGroup(this, 'ApiGatewayAccessLogs', {
            logGroupName: `/aws/apigateway/piece-app-${environment}`,
            retention: environment === 'prod'
                ? logs.RetentionDays.ONE_MONTH
                : logs.RetentionDays.ONE_WEEK,
            removalPolicy: environment === 'prod'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });
        // =====================================================
        // REST API作成
        // =====================================================
        this.api = new apigateway.RestApi(this, 'PieceAppRestApi', {
            restApiName: `piece-app-api-${environment}`,
            description: `Piece App REST API (${environment})`,
            // デプロイメント設定
            deploy: true,
            deployOptions: {
                stageName: environment,
                // アクセスログ
                accessLogDestination: new apigateway.LogGroupLogDestination(accessLogGroup),
                accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
                    caller: true,
                    httpMethod: true,
                    ip: true,
                    protocol: true,
                    requestTime: true,
                    resourcePath: true,
                    responseLength: true,
                    status: true,
                    user: true,
                }),
                // CloudWatch メトリクス
                metricsEnabled: true,
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: environment === 'dev', // 開発環境のみ詳細ログ
                // スロットリング
                throttlingBurstLimit: environment === 'prod' ? 5000 : 100,
                throttlingRateLimit: environment === 'prod' ? 2000 : 50,
            },
            // CORS設定（React Native対応）
            defaultCorsPreflightOptions: {
                allowOrigins: environment === 'prod'
                    ? ['https://piece-app.com', 'https://www.piece-app.com'] // 本番ドメイン
                    : apigateway.Cors.ALL_ORIGINS, // 開発環境は全許可
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: [
                    'Content-Type',
                    'X-Amz-Date',
                    'Authorization',
                    'X-Api-Key',
                    'X-Amz-Security-Token',
                    'X-Amz-User-Agent',
                    'X-Account-Id', // カスタムヘッダー（開発用）
                    'X-Account-Type', // カスタムヘッダー（開発用）
                ],
                allowCredentials: true,
                maxAge: cdk.Duration.hours(1),
            },
            // エンドポイント設定
            endpointConfiguration: {
                types: [apigateway.EndpointType.REGIONAL],
            },
            // CloudWatch設定
            cloudWatchRole: true,
            // 失敗時のレスポンス
            defaultMethodOptions: {
                authorizationType: apigateway.AuthorizationType.COGNITO,
            },
        });
        // =====================================================
        // Cognito Authorizer作成
        // =====================================================
        this.authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
            cognitoUserPools: [userPool],
            authorizerName: `piece-app-authorizer-${environment}`,
            identitySource: 'method.request.header.Authorization',
            resultsCacheTtl: cdk.Duration.minutes(5), // キャッシュ5分
        });
        // =====================================================
        // API Gatewayのモデル定義（リクエストバリデーション用）
        // =====================================================
        const errorResponseModel = this.api.addModel('ErrorResponseModel', {
            contentType: 'application/json',
            modelName: 'ErrorResponse',
            schema: {
                type: apigateway.JsonSchemaType.OBJECT,
                properties: {
                    success: { type: apigateway.JsonSchemaType.BOOLEAN },
                    error: {
                        type: apigateway.JsonSchemaType.OBJECT,
                        properties: {
                            code: { type: apigateway.JsonSchemaType.STRING },
                            message: { type: apigateway.JsonSchemaType.STRING },
                        },
                    },
                },
            },
        });
        // リクエストバリデーター
        const requestValidator = new apigateway.RequestValidator(this, 'RequestValidator', {
            restApi: this.api,
            requestValidatorName: 'request-body-validator',
            validateRequestBody: true,
            validateRequestParameters: true,
        });
        // =====================================================
        // /accounts リソース
        // =====================================================
        const accountsResource = this.api.root.addResource('accounts');
        // POST /accounts - アカウント作成（認証不要）
        accountsResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.createAccount, {
            proxy: true,
        }), {
            authorizationType: apigateway.AuthorizationType.NONE, // 認証不要
            requestValidator,
        });
        // GET /accounts/{account_id} - プロフィール取得
        const accountResource = accountsResource.addResource('{account_id}');
        accountResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getProfile, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // PUT /accounts/{account_id} - プロフィール更新
        accountResource.addMethod('PUT', new apigateway.LambdaIntegration(lambdaFunctions.updateProfile, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // =====================================================
        // /posts リソース
        // =====================================================
        const postsResource = this.api.root.addResource('posts');
        // POST /posts - 投稿作成
        postsResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.createPost, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /posts/{post_id} - 投稿取得
        const postResource = postsResource.addResource('{post_id}');
        postResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getPost, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // DELETE /posts/{post_id} - 投稿削除
        postResource.addMethod('DELETE', new apigateway.LambdaIntegration(lambdaFunctions.deletePost, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // POST /posts/{post_id}/like - いいね
        const likeResource = postResource.addResource('like');
        likeResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.likePost, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // DELETE /posts/{post_id}/like - いいね解除
        likeResource.addMethod('DELETE', new apigateway.LambdaIntegration(lambdaFunctions.unlikePost, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // POST /posts/{post_id}/comments - コメント作成
        const commentsResource = postResource.addResource('comments');
        commentsResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.createComment, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // GET /posts/{post_id}/comments - コメント一覧取得
        commentsResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getComments, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // =====================================================
        // /comments リソース
        // =====================================================
        const commentRootResource = this.api.root.addResource('comments');
        const commentResource = commentRootResource.addResource('{comment_id}');
        // DELETE /comments/{comment_id} - コメント削除
        commentResource.addMethod('DELETE', new apigateway.LambdaIntegration(lambdaFunctions.deleteComment, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // =====================================================
        // /timeline リソース
        // =====================================================
        const timelineResource = this.api.root.addResource('timeline');
        timelineResource.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunctions.getTimeline, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // =====================================================
        // /follow リソース
        // =====================================================
        const followResource = this.api.root.addResource('follow');
        // POST /follow - フォロー
        followResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.followUser, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // DELETE /follow - フォロー解除
        followResource.addMethod('DELETE', new apigateway.LambdaIntegration(lambdaFunctions.unfollowUser, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // =====================================================
        // /rooms リソース
        // =====================================================
        const roomsResource = this.api.root.addResource('rooms');
        // POST /rooms - ROOM作成
        roomsResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.createRoom, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
            requestValidator,
        });
        // POST /rooms/{room_id}/join - ROOM参加
        const roomResource = roomsResource.addResource('{room_id}');
        const joinResource = roomResource.addResource('join');
        joinResource.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunctions.joinRoom, {
            proxy: true,
        }), {
            authorizer: this.authorizer,
            authorizationType: apigateway.AuthorizationType.COGNITO,
        });
        // =====================================================
        // Outputs
        // =====================================================
        new cdk.CfnOutput(this, 'ApiUrl', {
            value: this.api.url,
            description: 'API Gateway URL',
            exportName: `PieceApp-ApiUrl-${environment}`,
        });
        new cdk.CfnOutput(this, 'ApiId', {
            value: this.api.restApiId,
            description: 'API Gateway ID',
            exportName: `PieceApp-ApiId-${environment}`,
        });
    }
}
exports.ApiGatewayStack = ApiGatewayStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLWdhdGV3YXktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvYXBpLWdhdGV3YXktc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsaURBQW1DO0FBQ25DLHVFQUF5RDtBQUd6RCwyREFBNkM7QUFxQzdDLE1BQWEsZUFBZ0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUk1QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTJCO1FBQ25FLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sRUFBRSxXQUFXLEVBQUUsZUFBZSxFQUFFLFFBQVEsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUV6RCx3REFBd0Q7UUFDeEQsa0JBQWtCO1FBQ2xCLHdEQUF3RDtRQUN4RCxNQUFNLGNBQWMsR0FBRyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLHNCQUFzQixFQUFFO1lBQ3JFLFlBQVksRUFBRSw2QkFBNkIsV0FBVyxFQUFFO1lBQ3hELFNBQVMsRUFBRSxXQUFXLEtBQUssTUFBTTtnQkFDL0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUztnQkFDOUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUTtZQUMvQixhQUFhLEVBQUUsV0FBVyxLQUFLLE1BQU07Z0JBQ25DLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU07Z0JBQzFCLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDOUIsQ0FBQyxDQUFDO1FBRUgsd0RBQXdEO1FBQ3hELGFBQWE7UUFDYix3REFBd0Q7UUFDeEQsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ3pE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Q2hDLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUc7WUFDbkIsV0FBVyxFQUFFLGlCQUFpQjtZQUM5QixVQUFVLEVBQUUsbUJBQW1CLFdBQVcsRUFBRTtTQUM3QyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRTtZQUMvQixLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTO1lBQ3pCLFdBQVcsRUFBRSxnQkFBZ0I7WUFDN0IsVUFBVSxFQUFFLGtCQUFrQixXQUFXLEVBQUU7U0FDNUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBbllELDBDQW1ZQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBBUEkgR2F0ZXdheSAoUkVTVCBBUEkpIFN0YWNrXHJcbiAqIFJlYWN0IE5hdGl2ZeOCouODl+ODquWQkeOBkeOBrlJFU1QgQVBJ6Kit5a6aXHJcbiAqL1xyXG5cclxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XHJcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcclxuaW1wb3J0ICogYXMgY29nbml0byBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29nbml0byc7XHJcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuXHJcbmludGVyZmFjZSBBcGlHYXRld2F5U3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcclxuICBlbnZpcm9ubWVudDogJ2RldicgfCAncHJvZCc7XHJcbiAgbGFtYmRhRnVuY3Rpb25zOiB7XHJcbiAgICAvLyBBY2NvdW50XHJcbiAgICBjcmVhdGVBY2NvdW50OiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBnZXRQcm9maWxlOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICB1cGRhdGVQcm9maWxlOiBsYW1iZGEuRnVuY3Rpb247XHJcblxyXG4gICAgLy8gUG9zdFxyXG4gICAgY3JlYXRlUG9zdDogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZ2V0UG9zdDogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZGVsZXRlUG9zdDogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgZ2V0VGltZWxpbmU6IGxhbWJkYS5GdW5jdGlvbjtcclxuXHJcbiAgICAvLyBMaWtlXHJcbiAgICBsaWtlUG9zdDogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gICAgdW5saWtlUG9zdDogbGFtYmRhLkZ1bmN0aW9uO1xyXG5cclxuICAgIC8vIENvbW1lbnRcclxuICAgIGNyZWF0ZUNvbW1lbnQ6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGRlbGV0ZUNvbW1lbnQ6IGxhbWJkYS5GdW5jdGlvbjtcclxuICAgIGdldENvbW1lbnRzOiBsYW1iZGEuRnVuY3Rpb247XHJcblxyXG4gICAgLy8gRm9sbG93XHJcbiAgICBmb2xsb3dVc2VyOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICB1bmZvbGxvd1VzZXI6IGxhbWJkYS5GdW5jdGlvbjtcclxuXHJcbiAgICAvLyBSb29tXHJcbiAgICBjcmVhdGVSb29tOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgICBqb2luUm9vbTogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gIH07XHJcbiAgdXNlclBvb2w6IGNvZ25pdG8uVXNlclBvb2w7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBBcGlHYXRld2F5U3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gIHB1YmxpYyByZWFkb25seSBhcGk6IGFwaWdhdGV3YXkuUmVzdEFwaTtcclxuICBwdWJsaWMgcmVhZG9ubHkgYXV0aG9yaXplcjogYXBpZ2F0ZXdheS5Db2duaXRvVXNlclBvb2xzQXV0aG9yaXplcjtcclxuXHJcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEFwaUdhdGV3YXlTdGFja1Byb3BzKSB7XHJcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuXHJcbiAgICBjb25zdCB7IGVudmlyb25tZW50LCBsYW1iZGFGdW5jdGlvbnMsIHVzZXJQb29sIH0gPSBwcm9wcztcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gQ2xvdWRXYXRjaCBMb2dzXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgY29uc3QgYWNjZXNzTG9nR3JvdXAgPSBuZXcgbG9ncy5Mb2dHcm91cCh0aGlzLCAnQXBpR2F0ZXdheUFjY2Vzc0xvZ3MnLCB7XHJcbiAgICAgIGxvZ0dyb3VwTmFtZTogYC9hd3MvYXBpZ2F0ZXdheS9waWVjZS1hcHAtJHtlbnZpcm9ubWVudH1gLFxyXG4gICAgICByZXRlbnRpb246IGVudmlyb25tZW50ID09PSAncHJvZCdcclxuICAgICAgICA/IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfTU9OVEhcclxuICAgICAgICA6IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFSyxcclxuICAgICAgcmVtb3ZhbFBvbGljeTogZW52aXJvbm1lbnQgPT09ICdwcm9kJ1xyXG4gICAgICAgID8gY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOXHJcbiAgICAgICAgOiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIFJFU1QgQVBJ5L2c5oiQXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgdGhpcy5hcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdQaWVjZUFwcFJlc3RBcGknLCB7XHJcbiAgICAgIHJlc3RBcGlOYW1lOiBgcGllY2UtYXBwLWFwaS0ke2Vudmlyb25tZW50fWAsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiBgUGllY2UgQXBwIFJFU1QgQVBJICgke2Vudmlyb25tZW50fSlgLFxyXG5cclxuICAgICAgLy8g44OH44OX44Ot44Kk44Oh44Oz44OI6Kit5a6aXHJcbiAgICAgIGRlcGxveTogdHJ1ZSxcclxuICAgICAgZGVwbG95T3B0aW9uczoge1xyXG4gICAgICAgIHN0YWdlTmFtZTogZW52aXJvbm1lbnQsXHJcblxyXG4gICAgICAgIC8vIOOCouOCr+OCu+OCueODreOCsFxyXG4gICAgICAgIGFjY2Vzc0xvZ0Rlc3RpbmF0aW9uOiBuZXcgYXBpZ2F0ZXdheS5Mb2dHcm91cExvZ0Rlc3RpbmF0aW9uKGFjY2Vzc0xvZ0dyb3VwKSxcclxuICAgICAgICBhY2Nlc3NMb2dGb3JtYXQ6IGFwaWdhdGV3YXkuQWNjZXNzTG9nRm9ybWF0Lmpzb25XaXRoU3RhbmRhcmRGaWVsZHMoe1xyXG4gICAgICAgICAgY2FsbGVyOiB0cnVlLFxyXG4gICAgICAgICAgaHR0cE1ldGhvZDogdHJ1ZSxcclxuICAgICAgICAgIGlwOiB0cnVlLFxyXG4gICAgICAgICAgcHJvdG9jb2w6IHRydWUsXHJcbiAgICAgICAgICByZXF1ZXN0VGltZTogdHJ1ZSxcclxuICAgICAgICAgIHJlc291cmNlUGF0aDogdHJ1ZSxcclxuICAgICAgICAgIHJlc3BvbnNlTGVuZ3RoOiB0cnVlLFxyXG4gICAgICAgICAgc3RhdHVzOiB0cnVlLFxyXG4gICAgICAgICAgdXNlcjogdHJ1ZSxcclxuICAgICAgICB9KSxcclxuXHJcbiAgICAgICAgLy8gQ2xvdWRXYXRjaCDjg6Hjg4jjg6rjgq/jgrlcclxuICAgICAgICBtZXRyaWNzRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBsb2dnaW5nTGV2ZWw6IGFwaWdhdGV3YXkuTWV0aG9kTG9nZ2luZ0xldmVsLklORk8sXHJcbiAgICAgICAgZGF0YVRyYWNlRW5hYmxlZDogZW52aXJvbm1lbnQgPT09ICdkZXYnLCAvLyDplovnmbrnkrDlooPjga7jgb/oqbPntLDjg63jgrBcclxuXHJcbiAgICAgICAgLy8g44K544Ot44OD44OI44Oq44Oz44KwXHJcbiAgICAgICAgdGhyb3R0bGluZ0J1cnN0TGltaXQ6IGVudmlyb25tZW50ID09PSAncHJvZCcgPyA1MDAwIDogMTAwLFxyXG4gICAgICAgIHRocm90dGxpbmdSYXRlTGltaXQ6IGVudmlyb25tZW50ID09PSAncHJvZCcgPyAyMDAwIDogNTAsXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBDT1JT6Kit5a6a77yIUmVhY3QgTmF0aXZl5a++5b+c77yJXHJcbiAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xyXG4gICAgICAgIGFsbG93T3JpZ2luczogZW52aXJvbm1lbnQgPT09ICdwcm9kJ1xyXG4gICAgICAgICAgPyBbJ2h0dHBzOi8vcGllY2UtYXBwLmNvbScsICdodHRwczovL3d3dy5waWVjZS1hcHAuY29tJ10gLy8g5pys55Wq44OJ44Oh44Kk44OzXHJcbiAgICAgICAgICA6IGFwaWdhdGV3YXkuQ29ycy5BTExfT1JJR0lOUywgLy8g6ZaL55m655Kw5aKD44Gv5YWo6Kix5Y+vXHJcbiAgICAgICAgYWxsb3dNZXRob2RzOiBhcGlnYXRld2F5LkNvcnMuQUxMX01FVEhPRFMsXHJcbiAgICAgICAgYWxsb3dIZWFkZXJzOiBbXHJcbiAgICAgICAgICAnQ29udGVudC1UeXBlJyxcclxuICAgICAgICAgICdYLUFtei1EYXRlJyxcclxuICAgICAgICAgICdBdXRob3JpemF0aW9uJyxcclxuICAgICAgICAgICdYLUFwaS1LZXknLFxyXG4gICAgICAgICAgJ1gtQW16LVNlY3VyaXR5LVRva2VuJyxcclxuICAgICAgICAgICdYLUFtei1Vc2VyLUFnZW50JyxcclxuICAgICAgICAgICdYLUFjY291bnQtSWQnLCAvLyDjgqvjgrnjgr/jg6Djg5jjg4Pjg4Djg7zvvIjplovnmbrnlKjvvIlcclxuICAgICAgICAgICdYLUFjY291bnQtVHlwZScsIC8vIOOCq+OCueOCv+ODoOODmOODg+ODgOODvO+8iOmWi+eZuueUqO+8iVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgYWxsb3dDcmVkZW50aWFsczogdHJ1ZSxcclxuICAgICAgICBtYXhBZ2U6IGNkay5EdXJhdGlvbi5ob3VycygxKSxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIOOCqOODs+ODieODneOCpOODs+ODiOioreWumlxyXG4gICAgICBlbmRwb2ludENvbmZpZ3VyYXRpb246IHtcclxuICAgICAgICB0eXBlczogW2FwaWdhdGV3YXkuRW5kcG9pbnRUeXBlLlJFR0lPTkFMXSxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIENsb3VkV2F0Y2joqK3lrppcclxuICAgICAgY2xvdWRXYXRjaFJvbGU6IHRydWUsXHJcblxyXG4gICAgICAvLyDlpLHmlZfmmYLjga7jg6zjgrnjg53jg7PjgrlcclxuICAgICAgZGVmYXVsdE1ldGhvZE9wdGlvbnM6IHtcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIENvZ25pdG8gQXV0aG9yaXplcuS9nOaIkFxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIHRoaXMuYXV0aG9yaXplciA9IG5ldyBhcGlnYXRld2F5LkNvZ25pdG9Vc2VyUG9vbHNBdXRob3JpemVyKFxyXG4gICAgICB0aGlzLFxyXG4gICAgICAnQ29nbml0b0F1dGhvcml6ZXInLFxyXG4gICAgICB7XHJcbiAgICAgICAgY29nbml0b1VzZXJQb29sczogW3VzZXJQb29sXSxcclxuICAgICAgICBhdXRob3JpemVyTmFtZTogYHBpZWNlLWFwcC1hdXRob3JpemVyLSR7ZW52aXJvbm1lbnR9YCxcclxuICAgICAgICBpZGVudGl0eVNvdXJjZTogJ21ldGhvZC5yZXF1ZXN0LmhlYWRlci5BdXRob3JpemF0aW9uJyxcclxuICAgICAgICByZXN1bHRzQ2FjaGVUdGw6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLCAvLyDjgq3jg6Pjg4Pjgrfjg6U15YiGXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIEFQSSBHYXRld2F544Gu44Oi44OH44Or5a6a576p77yI44Oq44Kv44Ko44K544OI44OQ44Oq44OH44O844K344On44Oz55So77yJXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgY29uc3QgZXJyb3JSZXNwb25zZU1vZGVsID0gdGhpcy5hcGkuYWRkTW9kZWwoJ0Vycm9yUmVzcG9uc2VNb2RlbCcsIHtcclxuICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgbW9kZWxOYW1lOiAnRXJyb3JSZXNwb25zZScsXHJcbiAgICAgIHNjaGVtYToge1xyXG4gICAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuT0JKRUNULFxyXG4gICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgIHN1Y2Nlc3M6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5CT09MRUFOIH0sXHJcbiAgICAgICAgICBlcnJvcjoge1xyXG4gICAgICAgICAgICB0eXBlOiBhcGlnYXRld2F5Lkpzb25TY2hlbWFUeXBlLk9CSkVDVCxcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgIGNvZGU6IHsgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgICAgICBtZXNzYWdlOiB7IHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyDjg6rjgq/jgqjjgrnjg4jjg5Djg6rjg4fjg7zjgr/jg7xcclxuICAgIGNvbnN0IHJlcXVlc3RWYWxpZGF0b3IgPSBuZXcgYXBpZ2F0ZXdheS5SZXF1ZXN0VmFsaWRhdG9yKFxyXG4gICAgICB0aGlzLFxyXG4gICAgICAnUmVxdWVzdFZhbGlkYXRvcicsXHJcbiAgICAgIHtcclxuICAgICAgICByZXN0QXBpOiB0aGlzLmFwaSxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yTmFtZTogJ3JlcXVlc3QtYm9keS12YWxpZGF0b3InLFxyXG4gICAgICAgIHZhbGlkYXRlUmVxdWVzdEJvZHk6IHRydWUsXHJcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogdHJ1ZSxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gL2FjY291bnRzIOODquOCveODvOOCuVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIGNvbnN0IGFjY291bnRzUmVzb3VyY2UgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdhY2NvdW50cycpO1xyXG5cclxuICAgIC8vIFBPU1QgL2FjY291bnRzIC0g44Ki44Kr44Km44Oz44OI5L2c5oiQ77yI6KqN6Ki85LiN6KaB77yJXHJcbiAgICBhY2NvdW50c1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ1BPU1QnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuY3JlYXRlQWNjb3VudCwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLk5PTkUsIC8vIOiqjeiovOS4jeimgVxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gR0VUIC9hY2NvdW50cy97YWNjb3VudF9pZH0gLSDjg5fjg63jg5XjgqPjg7zjg6vlj5blvpdcclxuICAgIGNvbnN0IGFjY291bnRSZXNvdXJjZSA9IGFjY291bnRzUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3thY2NvdW50X2lkfScpO1xyXG4gICAgYWNjb3VudFJlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0dFVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXRQcm9maWxlLCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gUFVUIC9hY2NvdW50cy97YWNjb3VudF9pZH0gLSDjg5fjg63jg5XjgqPjg7zjg6vmm7TmlrBcclxuICAgIGFjY291bnRSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQVVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMudXBkYXRlUHJvZmlsZSwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIC9wb3N0cyDjg6rjgr3jg7zjgrlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBjb25zdCBwb3N0c1Jlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgncG9zdHMnKTtcclxuXHJcbiAgICAvLyBQT1NUIC9wb3N0cyAtIOaKleeov+S9nOaIkFxyXG4gICAgcG9zdHNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmNyZWF0ZVBvc3QsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIEdFVCAvcG9zdHMve3Bvc3RfaWR9IC0g5oqV56i/5Y+W5b6XXHJcbiAgICBjb25zdCBwb3N0UmVzb3VyY2UgPSBwb3N0c1Jlc291cmNlLmFkZFJlc291cmNlKCd7cG9zdF9pZH0nKTtcclxuICAgIHBvc3RSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdHRVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0UG9zdCwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIERFTEVURSAvcG9zdHMve3Bvc3RfaWR9IC0g5oqV56i/5YmK6ZmkXHJcbiAgICBwb3N0UmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnREVMRVRFJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmRlbGV0ZVBvc3QsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBQT1NUIC9wb3N0cy97cG9zdF9pZH0vbGlrZSAtIOOBhOOBhOOBrVxyXG4gICAgY29uc3QgbGlrZVJlc291cmNlID0gcG9zdFJlc291cmNlLmFkZFJlc291cmNlKCdsaWtlJyk7XHJcbiAgICBsaWtlUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnUE9TVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5saWtlUG9zdCwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIERFTEVURSAvcG9zdHMve3Bvc3RfaWR9L2xpa2UgLSDjgYTjgYTjga3op6PpmaRcclxuICAgIGxpa2VSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdERUxFVEUnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMudW5saWtlUG9zdCwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIFBPU1QgL3Bvc3RzL3twb3N0X2lkfS9jb21tZW50cyAtIOOCs+ODoeODs+ODiOS9nOaIkFxyXG4gICAgY29uc3QgY29tbWVudHNSZXNvdXJjZSA9IHBvc3RSZXNvdXJjZS5hZGRSZXNvdXJjZSgnY29tbWVudHMnKTtcclxuICAgIGNvbW1lbnRzUmVzb3VyY2UuYWRkTWV0aG9kKFxyXG4gICAgICAnUE9TVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5jcmVhdGVDb21tZW50LCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBHRVQgL3Bvc3RzL3twb3N0X2lkfS9jb21tZW50cyAtIOOCs+ODoeODs+ODiOS4gOimp+WPluW+l1xyXG4gICAgY29tbWVudHNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdHRVQnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZ2V0Q29tbWVudHMsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gL2NvbW1lbnRzIOODquOCveODvOOCuVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIGNvbnN0IGNvbW1lbnRSb290UmVzb3VyY2UgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdjb21tZW50cycpO1xyXG4gICAgY29uc3QgY29tbWVudFJlc291cmNlID0gY29tbWVudFJvb3RSZXNvdXJjZS5hZGRSZXNvdXJjZSgne2NvbW1lbnRfaWR9Jyk7XHJcblxyXG4gICAgLy8gREVMRVRFIC9jb21tZW50cy97Y29tbWVudF9pZH0gLSDjgrPjg6Hjg7Pjg4jliYrpmaRcclxuICAgIGNvbW1lbnRSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdERUxFVEUnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMuZGVsZXRlQ29tbWVudCwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAvdGltZWxpbmUg44Oq44K944O844K5XHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgY29uc3QgdGltZWxpbmVSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3RpbWVsaW5lJyk7XHJcbiAgICB0aW1lbGluZVJlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgJ0dFVCcsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUZ1bmN0aW9ucy5nZXRUaW1lbGluZSwge1xyXG4gICAgICAgIHByb3h5OiB0cnVlLFxyXG4gICAgICB9KSxcclxuICAgICAge1xyXG4gICAgICAgIGF1dGhvcml6ZXI6IHRoaXMuYXV0aG9yaXplcixcclxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAvZm9sbG93IOODquOCveODvOOCuVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIGNvbnN0IGZvbGxvd1Jlc291cmNlID0gdGhpcy5hcGkucm9vdC5hZGRSZXNvdXJjZSgnZm9sbG93Jyk7XHJcblxyXG4gICAgLy8gUE9TVCAvZm9sbG93IC0g44OV44Kp44Ot44O8XHJcbiAgICBmb2xsb3dSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmZvbGxvd1VzZXIsIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIERFTEVURSAvZm9sbG93IC0g44OV44Kp44Ot44O86Kej6ZmkXHJcbiAgICBmb2xsb3dSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdERUxFVEUnLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFGdW5jdGlvbnMudW5mb2xsb3dVc2VyLCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgICAgcmVxdWVzdFZhbGlkYXRvcixcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gL3Jvb21zIOODquOCveODvOOCuVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIGNvbnN0IHJvb21zUmVzb3VyY2UgPSB0aGlzLmFwaS5yb290LmFkZFJlc291cmNlKCdyb29tcycpO1xyXG5cclxuICAgIC8vIFBPU1QgL3Jvb21zIC0gUk9PTeS9nOaIkFxyXG4gICAgcm9vbXNSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmNyZWF0ZVJvb20sIHtcclxuICAgICAgICBwcm94eTogdHJ1ZSxcclxuICAgICAgfSksXHJcbiAgICAgIHtcclxuICAgICAgICBhdXRob3JpemVyOiB0aGlzLmF1dGhvcml6ZXIsXHJcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcclxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yLFxyXG4gICAgICB9XHJcbiAgICApO1xyXG5cclxuICAgIC8vIFBPU1QgL3Jvb21zL3tyb29tX2lkfS9qb2luIC0gUk9PTeWPguWKoFxyXG4gICAgY29uc3Qgcm9vbVJlc291cmNlID0gcm9vbXNSZXNvdXJjZS5hZGRSZXNvdXJjZSgne3Jvb21faWR9Jyk7XHJcbiAgICBjb25zdCBqb2luUmVzb3VyY2UgPSByb29tUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2pvaW4nKTtcclxuICAgIGpvaW5SZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgICdQT1NUJyxcclxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhRnVuY3Rpb25zLmpvaW5Sb29tLCB7XHJcbiAgICAgICAgcHJveHk6IHRydWUsXHJcbiAgICAgIH0pLFxyXG4gICAgICB7XHJcbiAgICAgICAgYXV0aG9yaXplcjogdGhpcy5hdXRob3JpemVyLFxyXG4gICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLkNPR05JVE8sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIE91dHB1dHNcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpVXJsJywge1xyXG4gICAgICB2YWx1ZTogdGhpcy5hcGkudXJsLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBHYXRld2F5IFVSTCcsXHJcbiAgICAgIGV4cG9ydE5hbWU6IGBQaWVjZUFwcC1BcGlVcmwtJHtlbnZpcm9ubWVudH1gLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FwaUlkJywge1xyXG4gICAgICB2YWx1ZTogdGhpcy5hcGkucmVzdEFwaUlkLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBHYXRld2F5IElEJyxcclxuICAgICAgZXhwb3J0TmFtZTogYFBpZWNlQXBwLUFwaUlkLSR7ZW52aXJvbm1lbnR9YCxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iXX0=