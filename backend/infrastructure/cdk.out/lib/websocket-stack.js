"use strict";
/**
 * WebSocket API Stack
 *
 * ライブ配信のリアルタイムチャット用WebSocket API
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
exports.WebSocketStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const apigatewayv2 = __importStar(require("aws-cdk-lib/aws-apigatewayv2"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const aws_apigatewayv2_integrations_1 = require("aws-cdk-lib/aws-apigatewayv2-integrations");
class WebSocketStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const { connectionsTable, environment } = props;
        // WebSocket Lambda用のIAMロール
        const lambdaRole = new iam.Role(this, 'WebSocketLambdaRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
            ],
        });
        // DynamoDBアクセス権限を追加
        connectionsTable.grantReadWriteData(lambdaRole);
        // WebSocket接続ハンドラー
        const connectHandler = new lambda.Function(this, 'WsConnectHandler', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'dist/handlers/websocket/connect.handler',
            code: lambda.Code.fromAsset('../src'),
            role: lambdaRole,
            environment: {
                CONNECTIONS_TABLE_NAME: connectionsTable.tableName,
            },
            timeout: cdk.Duration.seconds(10),
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
        // WebSocket切断ハンドラー
        const disconnectHandler = new lambda.Function(this, 'WsDisconnectHandler', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'dist/handlers/websocket/disconnect.handler',
            code: lambda.Code.fromAsset('../src'),
            role: lambdaRole,
            environment: {
                CONNECTIONS_TABLE_NAME: connectionsTable.tableName,
            },
            timeout: cdk.Duration.seconds(10),
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
        // WebSocketメッセージハンドラー
        const messageHandler = new lambda.Function(this, 'WsMessageHandler', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'dist/handlers/websocket/message.handler',
            code: lambda.Code.fromAsset('../src'),
            role: lambdaRole,
            environment: {
                CONNECTIONS_TABLE_NAME: connectionsTable.tableName,
            },
            timeout: cdk.Duration.seconds(10),
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
        // WebSocket API
        this.webSocketApi = new apigatewayv2.WebSocketApi(this, 'WebSocketApi', {
            apiName: 'rork-websocket-api',
            description: 'WebSocket API for live streaming chat',
            connectRouteOptions: {
                integration: new aws_apigatewayv2_integrations_1.WebSocketLambdaIntegration('ConnectIntegration', connectHandler),
            },
            disconnectRouteOptions: {
                integration: new aws_apigatewayv2_integrations_1.WebSocketLambdaIntegration('DisconnectIntegration', disconnectHandler),
            },
            defaultRouteOptions: {
                integration: new aws_apigatewayv2_integrations_1.WebSocketLambdaIntegration('MessageIntegration', messageHandler),
            },
        });
        // WebSocket APIステージ
        this.webSocketStage = new apigatewayv2.WebSocketStage(this, 'WebSocketStage', {
            webSocketApi: this.webSocketApi,
            stageName: 'prod',
            autoDeploy: true,
        });
        // Lambda関数にWebSocket API実行権限を付与
        const websocketPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['execute-api:ManageConnections'],
            resources: [
                `arn:aws:execute-api:${this.region}:${this.account}:${this.webSocketApi.apiId}/*`,
            ],
        });
        connectHandler.addToRolePolicy(websocketPolicy);
        disconnectHandler.addToRolePolicy(websocketPolicy);
        messageHandler.addToRolePolicy(websocketPolicy);
        // 環境変数にWebSocket API URLを追加
        connectHandler.addEnvironment('WEBSOCKET_API_ENDPOINT', this.webSocketStage.url);
        disconnectHandler.addEnvironment('WEBSOCKET_API_ENDPOINT', this.webSocketStage.url);
        messageHandler.addEnvironment('WEBSOCKET_API_ENDPOINT', this.webSocketStage.url);
        // 出力
        new cdk.CfnOutput(this, 'WebSocketApiId', {
            value: this.webSocketApi.apiId,
            description: 'WebSocket API ID',
            exportName: 'WebSocketApiId',
        });
        new cdk.CfnOutput(this, 'WebSocketApiEndpoint', {
            value: this.webSocketStage.url,
            description: 'WebSocket API endpoint URL',
            exportName: 'WebSocketApiEndpoint',
        });
    }
}
exports.WebSocketStack = WebSocketStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vic29ja2V0LXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3dlYnNvY2tldC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7R0FJRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsaURBQW1DO0FBQ25DLDJFQUE2RDtBQUM3RCwrREFBaUQ7QUFDakQsMkRBQTZDO0FBQzdDLHlEQUEyQztBQUUzQyw2RkFBdUY7QUFRdkYsTUFBYSxjQUFlLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFJM0MsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUEwQjtRQUNsRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBRWhELDJCQUEyQjtRQUMzQixNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQzNELFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQztZQUMzRCxlQUFlLEVBQUU7Z0JBQ2YsR0FBRyxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FBQywwQ0FBMEMsQ0FBQzthQUN2RjtTQUNGLENBQUMsQ0FBQztRQUVILG9CQUFvQjtRQUNwQixnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUVoRCxtQkFBbUI7UUFDbkIsTUFBTSxjQUFjLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUNuRSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSx5Q0FBeUM7WUFDbEQsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFB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Q0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDaEQsaUJBQWlCLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ25ELGNBQWMsQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLENBQUM7UUFFaEQsNEJBQTRCO1FBQzVCLGNBQWMsQ0FBQyxjQUFjLENBQUMsd0JBQXdCLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqRixpQkFBaUIsQ0FBQyxjQUFjLENBQUMsd0JBQXdCLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNwRixjQUFjLENBQUMsY0FBYyxDQUFDLHdCQUF3QixFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFakYsS0FBSztRQUNMLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDeEMsS0FBSyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSztZQUM5QixXQUFXLEVBQUUsa0JBQWtCO1lBQy9CLFVBQVUsRUFBRSxnQkFBZ0I7U0FDN0IsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxzQkFBc0IsRUFBRTtZQUM5QyxLQUFLLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHO1lBQzlCLFdBQVcsRUFBRSw0QkFBNEI7WUFDekMsVUFBVSxFQUFFLHNCQUFzQjtTQUNuQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFoSEQsd0NBZ0hDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIFdlYlNvY2tldCBBUEkgU3RhY2tcclxuICpcclxuICog44Op44Kk44OW6YWN5L+h44Gu44Oq44Ki44Or44K/44Kk44Og44OB44Oj44OD44OI55SoV2ViU29ja2V0IEFQSVxyXG4gKi9cclxuXHJcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XHJcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXl2MiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheXYyJztcclxuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xyXG5pbXBvcnQgKiBhcyBsb2dzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sb2dzJztcclxuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xyXG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xyXG5pbXBvcnQgeyBXZWJTb2NrZXRMYW1iZGFJbnRlZ3JhdGlvbiB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5djItaW50ZWdyYXRpb25zJztcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcblxyXG5pbnRlcmZhY2UgV2ViU29ja2V0U3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcclxuICBjb25uZWN0aW9uc1RhYmxlOiBkeW5hbW9kYi5JVGFibGU7XHJcbiAgZW52aXJvbm1lbnQ6ICdkZXYnIHwgJ3Byb2QnO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgV2ViU29ja2V0U3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gIHB1YmxpYyByZWFkb25seSB3ZWJTb2NrZXRBcGk6IGFwaWdhdGV3YXl2Mi5XZWJTb2NrZXRBcGk7XHJcbiAgcHVibGljIHJlYWRvbmx5IHdlYlNvY2tldFN0YWdlOiBhcGlnYXRld2F5djIuV2ViU29ja2V0U3RhZ2U7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBXZWJTb2NrZXRTdGFja1Byb3BzKSB7XHJcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuXHJcbiAgICBjb25zdCB7IGNvbm5lY3Rpb25zVGFibGUsIGVudmlyb25tZW50IH0gPSBwcm9wcztcclxuXHJcbiAgICAvLyBXZWJTb2NrZXQgTGFtYmRh55So44GuSUFN44Ot44O844OrXHJcbiAgICBjb25zdCBsYW1iZGFSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdXZWJTb2NrZXRMYW1iZGFSb2xlJywge1xyXG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcclxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXHJcbiAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdzZXJ2aWNlLXJvbGUvQVdTTGFtYmRhQmFzaWNFeGVjdXRpb25Sb2xlJyksXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEeW5hbW9EQuOCouOCr+OCu+OCueaoqemZkOOCkui/veWKoFxyXG4gICAgY29ubmVjdGlvbnNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEobGFtYmRhUm9sZSk7XHJcblxyXG4gICAgLy8gV2ViU29ja2V05o6l57aa44OP44Oz44OJ44Op44O8XHJcbiAgICBjb25zdCBjb25uZWN0SGFuZGxlciA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ1dzQ29ubmVjdEhhbmRsZXInLCB7XHJcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxyXG4gICAgICBoYW5kbGVyOiAnZGlzdC9oYW5kbGVycy93ZWJzb2NrZXQvY29ubmVjdC5oYW5kbGVyJyxcclxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCcuLi9zcmMnKSxcclxuICAgICAgcm9sZTogbGFtYmRhUm9sZSxcclxuICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICBDT05ORUNUSU9OU19UQUJMRV9OQU1FOiBjb25uZWN0aW9uc1RhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgfSxcclxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxyXG4gICAgICBsb2dSZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFSyxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFdlYlNvY2tldOWIh+aWreODj+ODs+ODieODqeODvFxyXG4gICAgY29uc3QgZGlzY29ubmVjdEhhbmRsZXIgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdXc0Rpc2Nvbm5lY3RIYW5kbGVyJywge1xyXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcclxuICAgICAgaGFuZGxlcjogJ2Rpc3QvaGFuZGxlcnMvd2Vic29ja2V0L2Rpc2Nvbm5lY3QuaGFuZGxlcicsXHJcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnLi4vc3JjJyksXHJcbiAgICAgIHJvbGU6IGxhbWJkYVJvbGUsXHJcbiAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgQ09OTkVDVElPTlNfVEFCTEVfTkFNRTogY29ubmVjdGlvbnNUYWJsZS50YWJsZU5hbWUsXHJcbiAgICAgIH0sXHJcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcclxuICAgICAgbG9nUmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBXZWJTb2NrZXTjg6Hjg4Pjgrvjg7zjgrjjg4/jg7Pjg4njg6njg7xcclxuICAgIGNvbnN0IG1lc3NhZ2VIYW5kbGVyID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnV3NNZXNzYWdlSGFuZGxlcicsIHtcclxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXHJcbiAgICAgIGhhbmRsZXI6ICdkaXN0L2hhbmRsZXJzL3dlYnNvY2tldC9tZXNzYWdlLmhhbmRsZXInLFxyXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJy4uL3NyYycpLFxyXG4gICAgICByb2xlOiBsYW1iZGFSb2xlLFxyXG4gICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgIENPTk5FQ1RJT05TX1RBQkxFX05BTUU6IGNvbm5lY3Rpb25zVGFibGUudGFibGVOYW1lLFxyXG4gICAgICB9LFxyXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXHJcbiAgICAgIGxvZ1JldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gV2ViU29ja2V0IEFQSVxyXG4gICAgdGhpcy53ZWJTb2NrZXRBcGkgPSBuZXcgYXBpZ2F0ZXdheXYyLldlYlNvY2tldEFwaSh0aGlzLCAnV2ViU29ja2V0QXBpJywge1xyXG4gICAgICBhcGlOYW1lOiAncm9yay13ZWJzb2NrZXQtYXBpJyxcclxuICAgICAgZGVzY3JpcHRpb246ICdXZWJTb2NrZXQgQVBJIGZvciBsaXZlIHN0cmVhbWluZyBjaGF0JyxcclxuICAgICAgY29ubmVjdFJvdXRlT3B0aW9uczoge1xyXG4gICAgICAgIGludGVncmF0aW9uOiBuZXcgV2ViU29ja2V0TGFtYmRhSW50ZWdyYXRpb24oJ0Nvbm5lY3RJbnRlZ3JhdGlvbicsIGNvbm5lY3RIYW5kbGVyKSxcclxuICAgICAgfSxcclxuICAgICAgZGlzY29ubmVjdFJvdXRlT3B0aW9uczoge1xyXG4gICAgICAgIGludGVncmF0aW9uOiBuZXcgV2ViU29ja2V0TGFtYmRhSW50ZWdyYXRpb24oJ0Rpc2Nvbm5lY3RJbnRlZ3JhdGlvbicsIGRpc2Nvbm5lY3RIYW5kbGVyKSxcclxuICAgICAgfSxcclxuICAgICAgZGVmYXVsdFJvdXRlT3B0aW9uczoge1xyXG4gICAgICAgIGludGVncmF0aW9uOiBuZXcgV2ViU29ja2V0TGFtYmRhSW50ZWdyYXRpb24oJ01lc3NhZ2VJbnRlZ3JhdGlvbicsIG1lc3NhZ2VIYW5kbGVyKSxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFdlYlNvY2tldCBBUEnjgrnjg4bjg7zjgrhcclxuICAgIHRoaXMud2ViU29ja2V0U3RhZ2UgPSBuZXcgYXBpZ2F0ZXdheXYyLldlYlNvY2tldFN0YWdlKHRoaXMsICdXZWJTb2NrZXRTdGFnZScsIHtcclxuICAgICAgd2ViU29ja2V0QXBpOiB0aGlzLndlYlNvY2tldEFwaSxcclxuICAgICAgc3RhZ2VOYW1lOiAncHJvZCcsXHJcbiAgICAgIGF1dG9EZXBsb3k6IHRydWUsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBMYW1iZGHplqLmlbDjgatXZWJTb2NrZXQgQVBJ5a6f6KGM5qip6ZmQ44KS5LuY5LiOXHJcbiAgICBjb25zdCB3ZWJzb2NrZXRQb2xpY3kgPSBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XHJcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcclxuICAgICAgYWN0aW9uczogWydleGVjdXRlLWFwaTpNYW5hZ2VDb25uZWN0aW9ucyddLFxyXG4gICAgICByZXNvdXJjZXM6IFtcclxuICAgICAgICBgYXJuOmF3czpleGVjdXRlLWFwaToke3RoaXMucmVnaW9ufToke3RoaXMuYWNjb3VudH06JHt0aGlzLndlYlNvY2tldEFwaS5hcGlJZH0vKmAsXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25uZWN0SGFuZGxlci5hZGRUb1JvbGVQb2xpY3kod2Vic29ja2V0UG9saWN5KTtcclxuICAgIGRpc2Nvbm5lY3RIYW5kbGVyLmFkZFRvUm9sZVBvbGljeSh3ZWJzb2NrZXRQb2xpY3kpO1xyXG4gICAgbWVzc2FnZUhhbmRsZXIuYWRkVG9Sb2xlUG9saWN5KHdlYnNvY2tldFBvbGljeSk7XHJcblxyXG4gICAgLy8g55Kw5aKD5aSJ5pWw44GrV2ViU29ja2V0IEFQSSBVUkzjgpLov73liqBcclxuICAgIGNvbm5lY3RIYW5kbGVyLmFkZEVudmlyb25tZW50KCdXRUJTT0NLRVRfQVBJX0VORFBPSU5UJywgdGhpcy53ZWJTb2NrZXRTdGFnZS51cmwpO1xyXG4gICAgZGlzY29ubmVjdEhhbmRsZXIuYWRkRW52aXJvbm1lbnQoJ1dFQlNPQ0tFVF9BUElfRU5EUE9JTlQnLCB0aGlzLndlYlNvY2tldFN0YWdlLnVybCk7XHJcbiAgICBtZXNzYWdlSGFuZGxlci5hZGRFbnZpcm9ubWVudCgnV0VCU09DS0VUX0FQSV9FTkRQT0lOVCcsIHRoaXMud2ViU29ja2V0U3RhZ2UudXJsKTtcclxuXHJcbiAgICAvLyDlh7rliptcclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdXZWJTb2NrZXRBcGlJZCcsIHtcclxuICAgICAgdmFsdWU6IHRoaXMud2ViU29ja2V0QXBpLmFwaUlkLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ1dlYlNvY2tldCBBUEkgSUQnLFxyXG4gICAgICBleHBvcnROYW1lOiAnV2ViU29ja2V0QXBpSWQnLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1dlYlNvY2tldEFwaUVuZHBvaW50Jywge1xyXG4gICAgICB2YWx1ZTogdGhpcy53ZWJTb2NrZXRTdGFnZS51cmwsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnV2ViU29ja2V0IEFQSSBlbmRwb2ludCBVUkwnLFxyXG4gICAgICBleHBvcnROYW1lOiAnV2ViU29ja2V0QXBpRW5kcG9pbnQnLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiJdfQ==