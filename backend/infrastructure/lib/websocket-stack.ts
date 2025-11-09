/**
 * WebSocket API Stack
 *
 * ライブ配信のリアルタイムチャット用WebSocket API
 */

import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Construct } from 'constructs';

interface WebSocketStackProps extends cdk.StackProps {
  connectionsTable: dynamodb.ITable;
  environment: 'dev' | 'prod';
}

export class WebSocketStack extends cdk.Stack {
  public readonly webSocketApi: apigatewayv2.WebSocketApi;
  public readonly webSocketStage: apigatewayv2.WebSocketStage;

  constructor(scope: Construct, id: string, props: WebSocketStackProps) {
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
        integration: new WebSocketLambdaIntegration('ConnectIntegration', connectHandler),
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration('DisconnectIntegration', disconnectHandler),
      },
      defaultRouteOptions: {
        integration: new WebSocketLambdaIntegration('MessageIntegration', messageHandler),
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
