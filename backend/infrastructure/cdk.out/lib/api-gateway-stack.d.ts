/**
 * API Gateway (REST API) Stack
 * React Nativeアプリ向けのREST API設定
 */
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
interface ApiGatewayStackProps extends cdk.StackProps {
    environment: 'dev' | 'prod';
    lambdaFunctions: {
        createAccount: lambda.Function;
        getProfile: lambda.Function;
        updateProfile: lambda.Function;
        createPost: lambda.Function;
        getPost: lambda.Function;
        deletePost: lambda.Function;
        getTimeline: lambda.Function;
        likePost: lambda.Function;
        unlikePost: lambda.Function;
        createComment: lambda.Function;
        deleteComment: lambda.Function;
        getComments: lambda.Function;
        followUser: lambda.Function;
        unfollowUser: lambda.Function;
        createRoom: lambda.Function;
        joinRoom: lambda.Function;
    };
    userPool: cognito.UserPool;
}
export declare class ApiGatewayStack extends cdk.Stack {
    readonly api: apigateway.RestApi;
    readonly authorizer: apigateway.CognitoUserPoolsAuthorizer;
    constructor(scope: Construct, id: string, props: ApiGatewayStackProps);
}
export {};
