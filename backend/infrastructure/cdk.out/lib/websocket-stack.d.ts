/**
 * WebSocket API Stack
 *
 * ライブ配信のリアルタイムチャット用WebSocket API
 */
import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
interface WebSocketStackProps extends cdk.StackProps {
    connectionsTable: dynamodb.ITable;
    environment: 'dev' | 'prod';
}
export declare class WebSocketStack extends cdk.Stack {
    readonly webSocketApi: apigatewayv2.WebSocketApi;
    readonly webSocketStage: apigatewayv2.WebSocketStage;
    constructor(scope: Construct, id: string, props: WebSocketStackProps);
}
export {};
