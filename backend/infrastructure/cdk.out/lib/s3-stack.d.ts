import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
interface S3StackProps extends cdk.StackProps {
    environment: 'dev' | 'prod';
    removalPolicy: cdk.RemovalPolicy;
}
export declare class S3Stack extends cdk.Stack {
    readonly mediaBucket: s3.Bucket;
    constructor(scope: Construct, id: string, props: S3StackProps);
}
export {};
