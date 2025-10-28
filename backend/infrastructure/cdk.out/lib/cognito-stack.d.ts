/**
 * Cognito User Pool Stack
 * ユーザー認証・認可の管理
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
