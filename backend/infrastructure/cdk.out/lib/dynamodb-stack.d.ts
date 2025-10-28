import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
interface DynamoDBStackProps extends cdk.StackProps {
    environment: 'dev' | 'prod';
    removalPolicy: cdk.RemovalPolicy;
}
export declare class DynamoDBStack extends cdk.Stack {
    readonly tables: {
        [key: string]: dynamodb.TableV2;
    };
    constructor(scope: Construct, id: string, props: DynamoDBStackProps);
}
export {};
