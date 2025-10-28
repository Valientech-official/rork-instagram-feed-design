/**
 * Lambda Functions Stack
 * 全Lambda関数の定義と設定（シンプルバージョン）
 */
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
interface LambdaStackProps extends cdk.StackProps {
    environment: 'dev' | 'prod';
}
export declare class LambdaStack extends cdk.Stack {
    readonly createAccount: lambda.Function;
    readonly getProfile: lambda.Function;
    readonly updateProfile: lambda.Function;
    readonly createPost: lambda.Function;
    readonly getPost: lambda.Function;
    readonly deletePost: lambda.Function;
    readonly getTimeline: lambda.Function;
    readonly likePost: lambda.Function;
    readonly unlikePost: lambda.Function;
    readonly createComment: lambda.Function;
    readonly deleteComment: lambda.Function;
    readonly getComments: lambda.Function;
    readonly followUser: lambda.Function;
    readonly unfollowUser: lambda.Function;
    readonly createRoom: lambda.Function;
    readonly joinRoom: lambda.Function;
    constructor(scope: Construct, id: string, props: LambdaStackProps);
}
export {};
