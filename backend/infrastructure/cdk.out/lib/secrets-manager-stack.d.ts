/**
 * AWS Secrets Manager Stack
 *
 * Mux API認証情報を安全に保管
 */
import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
export declare class SecretsManagerStack extends cdk.Stack {
    readonly muxSecret: secretsmanager.ISecret;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
