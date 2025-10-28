"use strict";
/**
 * Lambda Functions Stack
 * 全Lambda関数の定義と設定（シンプルバージョン）
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
exports.LambdaStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const path = __importStar(require("path"));
class LambdaStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const { environment } = props;
        // =====================================================
        // Lambda共通設定
        // =====================================================
        const srcDir = path.join(__dirname, '../../src');
        // 共通環境変数
        const commonEnvironment = {
            ENVIRONMENT: environment,
            AWS_REGION: cdk.Stack.of(this).region,
            NODE_ENV: environment === 'prod' ? 'production' : 'development',
        };
        // DynamoDB権限ポリシー
        const dynamoDbPolicy = new iam.PolicyStatement({
            actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
                'dynamodb:BatchGetItem',
                'dynamodb:BatchWriteItem',
            ],
            resources: [
                `arn:aws:dynamodb:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:table/*`,
            ],
        });
        // Lambda関数作成ヘルパー
        const createLambdaFunction = (id, functionName, handler, description) => {
            return new lambda.Function(this, id, {
                runtime: lambda.Runtime.NODEJS_20_X,
                handler,
                code: lambda.Code.fromAsset(srcDir),
                functionName: `piece-app-${functionName}-${environment}`,
                description,
                timeout: cdk.Duration.seconds(30),
                memorySize: environment === 'prod' ? 1024 : 512,
                environment: commonEnvironment,
                tracing: lambda.Tracing.ACTIVE,
                logRetention: environment === 'prod'
                    ? logs.RetentionDays.ONE_MONTH
                    : logs.RetentionDays.ONE_WEEK,
                initialPolicy: [dynamoDbPolicy],
            });
        };
        // =====================================================
        // Lambda関数作成
        // =====================================================
        // Account
        this.createAccount = createLambdaFunction('CreateAccountFunction', 'create-account', 'handlers/account/createAccount.handler', 'Create new account');
        this.getProfile = createLambdaFunction('GetProfileFunction', 'get-profile', 'handlers/account/getProfile.handler', 'Get user profile');
        this.updateProfile = createLambdaFunction('UpdateProfileFunction', 'update-profile', 'handlers/account/updateProfile.handler', 'Update user profile');
        // Post
        this.createPost = createLambdaFunction('CreatePostFunction', 'create-post', 'handlers/post/createPost.handler', 'Create new post');
        this.getPost = createLambdaFunction('GetPostFunction', 'get-post', 'handlers/post/getPost.handler', 'Get post details');
        this.deletePost = createLambdaFunction('DeletePostFunction', 'delete-post', 'handlers/post/deletePost.handler', 'Delete post');
        this.getTimeline = createLambdaFunction('GetTimelineFunction', 'get-timeline', 'handlers/post/getTimeline.handler', 'Get user timeline');
        // Like
        this.likePost = createLambdaFunction('LikePostFunction', 'like-post', 'handlers/like/likePost.handler', 'Like a post');
        this.unlikePost = createLambdaFunction('UnlikePostFunction', 'unlike-post', 'handlers/like/unlikePost.handler', 'Unlike a post');
        // Comment
        this.createComment = createLambdaFunction('CreateCommentFunction', 'create-comment', 'handlers/comment/createComment.handler', 'Create comment on post');
        this.deleteComment = createLambdaFunction('DeleteCommentFunction', 'delete-comment', 'handlers/comment/deleteComment.handler', 'Delete comment');
        this.getComments = createLambdaFunction('GetCommentsFunction', 'get-comments', 'handlers/comment/getComments.handler', 'Get comments for post');
        // Follow
        this.followUser = createLambdaFunction('FollowUserFunction', 'follow-user', 'handlers/follow/followUser.handler', 'Follow a user');
        this.unfollowUser = createLambdaFunction('UnfollowUserFunction', 'unfollow-user', 'handlers/follow/unfollowUser.handler', 'Unfollow a user');
        // Room
        this.createRoom = createLambdaFunction('CreateRoomFunction', 'create-room', 'handlers/room/createRoom.handler', 'Create new room');
        this.joinRoom = createLambdaFunction('JoinRoomFunction', 'join-room', 'handlers/room/joinRoom.handler', 'Join a room');
        // =====================================================
        // Outputs
        // =====================================================
        new cdk.CfnOutput(this, 'CreateAccountFunctionArn', {
            value: this.createAccount.functionArn,
            exportName: `PieceApp-CreateAccountArn-${environment}`,
        });
        new cdk.CfnOutput(this, 'CreatePostFunctionArn', {
            value: this.createPost.functionArn,
            exportName: `PieceApp-CreatePostArn-${environment}`,
        });
    }
}
exports.LambdaStack = LambdaStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2xhbWJkYS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCxpREFBbUM7QUFDbkMsK0RBQWlEO0FBQ2pELHlEQUEyQztBQUMzQywyREFBNkM7QUFFN0MsMkNBQTZCO0FBTTdCLE1BQWEsV0FBWSxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBbUJ4QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXVCO1FBQy9ELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sRUFBRSxXQUFXLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFFOUIsd0RBQXdEO1FBQ3hELGFBQWE7UUFDYix3REFBd0Q7UUFFeEQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFakQsU0FBUztRQUNULE1BQU0saUJBQWlCLEdBQUc7WUFDeEIsV0FBVyxFQUFFLFdBQVc7WUFDeEIsVUFBVSxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU07WUFDckMsUUFBUSxFQUFFLFdBQVcsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsYUFBYTtTQUNoRSxDQUFDO1FBRUYsaUJBQWlCO1FBQ2pCLE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUM3QyxPQUFPLEVBQUU7Z0JBQ1Asa0JBQWtCO2dCQUNsQixrQkFBa0I7Z0JBQ2xCLHFCQUFxQjtnQkFDckIscUJBQXFCO2dCQUNyQixnQkFBZ0I7Z0JBQ2hCLGVBQWU7Z0JBQ2YsdUJBQXVCO2dCQUN2Qix5QkFBeUI7YUFDMUI7WUFDRCxTQUFTLEVB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U0FDcEQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBdE5ELGtDQXNOQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBMYW1iZGEgRnVuY3Rpb25zIFN0YWNrXHJcbiAqIOWFqExhbWJkYemWouaVsOOBruWumue+qeOBqOioreWumu+8iOOCt+ODs+ODl+ODq+ODkOODvOOCuOODp+ODs++8iVxyXG4gKi9cclxuXHJcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XHJcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcclxuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xyXG5pbXBvcnQgKiBhcyBsb2dzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sb2dzJztcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XHJcblxyXG5pbnRlcmZhY2UgTGFtYmRhU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcclxuICBlbnZpcm9ubWVudDogJ2RldicgfCAncHJvZCc7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBMYW1iZGFTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XHJcbiAgLy8gTGFtYmRh6Zai5pWw44Gu44Ko44Kv44K544Od44O844OIXHJcbiAgcHVibGljIHJlYWRvbmx5IGNyZWF0ZUFjY291bnQ6IGxhbWJkYS5GdW5jdGlvbjtcclxuICBwdWJsaWMgcmVhZG9ubHkgZ2V0UHJvZmlsZTogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gIHB1YmxpYyByZWFkb25seSB1cGRhdGVQcm9maWxlOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgcHVibGljIHJlYWRvbmx5IGNyZWF0ZVBvc3Q6IGxhbWJkYS5GdW5jdGlvbjtcclxuICBwdWJsaWMgcmVhZG9ubHkgZ2V0UG9zdDogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gIHB1YmxpYyByZWFkb25seSBkZWxldGVQb3N0OiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgcHVibGljIHJlYWRvbmx5IGdldFRpbWVsaW5lOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgcHVibGljIHJlYWRvbmx5IGxpa2VQb3N0OiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgcHVibGljIHJlYWRvbmx5IHVubGlrZVBvc3Q6IGxhbWJkYS5GdW5jdGlvbjtcclxuICBwdWJsaWMgcmVhZG9ubHkgY3JlYXRlQ29tbWVudDogbGFtYmRhLkZ1bmN0aW9uO1xyXG4gIHB1YmxpYyByZWFkb25seSBkZWxldGVDb21tZW50OiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgcHVibGljIHJlYWRvbmx5IGdldENvbW1lbnRzOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgcHVibGljIHJlYWRvbmx5IGZvbGxvd1VzZXI6IGxhbWJkYS5GdW5jdGlvbjtcclxuICBwdWJsaWMgcmVhZG9ubHkgdW5mb2xsb3dVc2VyOiBsYW1iZGEuRnVuY3Rpb247XHJcbiAgcHVibGljIHJlYWRvbmx5IGNyZWF0ZVJvb206IGxhbWJkYS5GdW5jdGlvbjtcclxuICBwdWJsaWMgcmVhZG9ubHkgam9pblJvb206IGxhbWJkYS5GdW5jdGlvbjtcclxuXHJcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IExhbWJkYVN0YWNrUHJvcHMpIHtcclxuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgIGNvbnN0IHsgZW52aXJvbm1lbnQgfSA9IHByb3BzO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyBMYW1iZGHlhbHpgJroqK3lrppcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG4gICAgY29uc3Qgc3JjRGlyID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uL3NyYycpO1xyXG5cclxuICAgIC8vIOWFsemAmueSsOWig+WkieaVsFxyXG4gICAgY29uc3QgY29tbW9uRW52aXJvbm1lbnQgPSB7XHJcbiAgICAgIEVOVklST05NRU5UOiBlbnZpcm9ubWVudCxcclxuICAgICAgQVdTX1JFR0lPTjogY2RrLlN0YWNrLm9mKHRoaXMpLnJlZ2lvbixcclxuICAgICAgTk9ERV9FTlY6IGVudmlyb25tZW50ID09PSAncHJvZCcgPyAncHJvZHVjdGlvbicgOiAnZGV2ZWxvcG1lbnQnLFxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBEeW5hbW9EQuaoqemZkOODneODquOCt+ODvFxyXG4gICAgY29uc3QgZHluYW1vRGJQb2xpY3kgPSBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XHJcbiAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICAnZHluYW1vZGI6R2V0SXRlbScsXHJcbiAgICAgICAgJ2R5bmFtb2RiOlB1dEl0ZW0nLFxyXG4gICAgICAgICdkeW5hbW9kYjpVcGRhdGVJdGVtJyxcclxuICAgICAgICAnZHluYW1vZGI6RGVsZXRlSXRlbScsXHJcbiAgICAgICAgJ2R5bmFtb2RiOlF1ZXJ5JyxcclxuICAgICAgICAnZHluYW1vZGI6U2NhbicsXHJcbiAgICAgICAgJ2R5bmFtb2RiOkJhdGNoR2V0SXRlbScsXHJcbiAgICAgICAgJ2R5bmFtb2RiOkJhdGNoV3JpdGVJdGVtJyxcclxuICAgICAgXSxcclxuICAgICAgcmVzb3VyY2VzOiBbXHJcbiAgICAgICAgYGFybjphd3M6ZHluYW1vZGI6JHtjZGsuU3RhY2sub2YodGhpcykucmVnaW9ufToke2Nkay5TdGFjay5vZih0aGlzKS5hY2NvdW50fTp0YWJsZS8qYCxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIExhbWJkYemWouaVsOS9nOaIkOODmOODq+ODkeODvFxyXG4gICAgY29uc3QgY3JlYXRlTGFtYmRhRnVuY3Rpb24gPSAoXHJcbiAgICAgIGlkOiBzdHJpbmcsXHJcbiAgICAgIGZ1bmN0aW9uTmFtZTogc3RyaW5nLFxyXG4gICAgICBoYW5kbGVyOiBzdHJpbmcsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiBzdHJpbmdcclxuICAgICk6IGxhbWJkYS5GdW5jdGlvbiA9PiB7XHJcbiAgICAgIHJldHVybiBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsIGlkLCB7XHJcbiAgICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXHJcbiAgICAgICAgaGFuZGxlcixcclxuICAgICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoc3JjRGlyKSxcclxuICAgICAgICBmdW5jdGlvbk5hbWU6IGBwaWVjZS1hcHAtJHtmdW5jdGlvbk5hbWV9LSR7ZW52aXJvbm1lbnR9YCxcclxuICAgICAgICBkZXNjcmlwdGlvbixcclxuICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXHJcbiAgICAgICAgbWVtb3J5U2l6ZTogZW52aXJvbm1lbnQgPT09ICdwcm9kJyA/IDEwMjQgOiA1MTIsXHJcbiAgICAgICAgZW52aXJvbm1lbnQ6IGNvbW1vbkVudmlyb25tZW50LFxyXG4gICAgICAgIHRyYWNpbmc6IGxhbWJkYS5UcmFjaW5nLkFDVElWRSxcclxuICAgICAgICBsb2dSZXRlbnRpb246IGVudmlyb25tZW50ID09PSAncHJvZCdcclxuICAgICAgICAgID8gbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9NT05USFxyXG4gICAgICAgICAgOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXHJcbiAgICAgICAgaW5pdGlhbFBvbGljeTogW2R5bmFtb0RiUG9saWN5XSxcclxuICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyBMYW1iZGHplqLmlbDkvZzmiJBcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG4gICAgLy8gQWNjb3VudFxyXG4gICAgdGhpcy5jcmVhdGVBY2NvdW50ID0gY3JlYXRlTGFtYmRhRnVuY3Rpb24oXHJcbiAgICAgICdDcmVhdGVBY2NvdW50RnVuY3Rpb24nLFxyXG4gICAgICAnY3JlYXRlLWFjY291bnQnLFxyXG4gICAgICAnaGFuZGxlcnMvYWNjb3VudC9jcmVhdGVBY2NvdW50LmhhbmRsZXInLFxyXG4gICAgICAnQ3JlYXRlIG5ldyBhY2NvdW50J1xyXG4gICAgKTtcclxuXHJcbiAgICB0aGlzLmdldFByb2ZpbGUgPSBjcmVhdGVMYW1iZGFGdW5jdGlvbihcclxuICAgICAgJ0dldFByb2ZpbGVGdW5jdGlvbicsXHJcbiAgICAgICdnZXQtcHJvZmlsZScsXHJcbiAgICAgICdoYW5kbGVycy9hY2NvdW50L2dldFByb2ZpbGUuaGFuZGxlcicsXHJcbiAgICAgICdHZXQgdXNlciBwcm9maWxlJ1xyXG4gICAgKTtcclxuXHJcbiAgICB0aGlzLnVwZGF0ZVByb2ZpbGUgPSBjcmVhdGVMYW1iZGFGdW5jdGlvbihcclxuICAgICAgJ1VwZGF0ZVByb2ZpbGVGdW5jdGlvbicsXHJcbiAgICAgICd1cGRhdGUtcHJvZmlsZScsXHJcbiAgICAgICdoYW5kbGVycy9hY2NvdW50L3VwZGF0ZVByb2ZpbGUuaGFuZGxlcicsXHJcbiAgICAgICdVcGRhdGUgdXNlciBwcm9maWxlJ1xyXG4gICAgKTtcclxuXHJcbiAgICAvLyBQb3N0XHJcbiAgICB0aGlzLmNyZWF0ZVBvc3QgPSBjcmVhdGVMYW1iZGFGdW5jdGlvbihcclxuICAgICAgJ0NyZWF0ZVBvc3RGdW5jdGlvbicsXHJcbiAgICAgICdjcmVhdGUtcG9zdCcsXHJcbiAgICAgICdoYW5kbGVycy9wb3N0L2NyZWF0ZVBvc3QuaGFuZGxlcicsXHJcbiAgICAgICdDcmVhdGUgbmV3IHBvc3QnXHJcbiAgICApO1xyXG5cclxuICAgIHRoaXMuZ2V0UG9zdCA9IGNyZWF0ZUxhbWJkYUZ1bmN0aW9uKFxyXG4gICAgICAnR2V0UG9zdEZ1bmN0aW9uJyxcclxuICAgICAgJ2dldC1wb3N0JyxcclxuICAgICAgJ2hhbmRsZXJzL3Bvc3QvZ2V0UG9zdC5oYW5kbGVyJyxcclxuICAgICAgJ0dldCBwb3N0IGRldGFpbHMnXHJcbiAgICApO1xyXG5cclxuICAgIHRoaXMuZGVsZXRlUG9zdCA9IGNyZWF0ZUxhbWJkYUZ1bmN0aW9uKFxyXG4gICAgICAnRGVsZXRlUG9zdEZ1bmN0aW9uJyxcclxuICAgICAgJ2RlbGV0ZS1wb3N0JyxcclxuICAgICAgJ2hhbmRsZXJzL3Bvc3QvZGVsZXRlUG9zdC5oYW5kbGVyJyxcclxuICAgICAgJ0RlbGV0ZSBwb3N0J1xyXG4gICAgKTtcclxuXHJcbiAgICB0aGlzLmdldFRpbWVsaW5lID0gY3JlYXRlTGFtYmRhRnVuY3Rpb24oXHJcbiAgICAgICdHZXRUaW1lbGluZUZ1bmN0aW9uJyxcclxuICAgICAgJ2dldC10aW1lbGluZScsXHJcbiAgICAgICdoYW5kbGVycy9wb3N0L2dldFRpbWVsaW5lLmhhbmRsZXInLFxyXG4gICAgICAnR2V0IHVzZXIgdGltZWxpbmUnXHJcbiAgICApO1xyXG5cclxuICAgIC8vIExpa2VcclxuICAgIHRoaXMubGlrZVBvc3QgPSBjcmVhdGVMYW1iZGFGdW5jdGlvbihcclxuICAgICAgJ0xpa2VQb3N0RnVuY3Rpb24nLFxyXG4gICAgICAnbGlrZS1wb3N0JyxcclxuICAgICAgJ2hhbmRsZXJzL2xpa2UvbGlrZVBvc3QuaGFuZGxlcicsXHJcbiAgICAgICdMaWtlIGEgcG9zdCdcclxuICAgICk7XHJcblxyXG4gICAgdGhpcy51bmxpa2VQb3N0ID0gY3JlYXRlTGFtYmRhRnVuY3Rpb24oXHJcbiAgICAgICdVbmxpa2VQb3N0RnVuY3Rpb24nLFxyXG4gICAgICAndW5saWtlLXBvc3QnLFxyXG4gICAgICAnaGFuZGxlcnMvbGlrZS91bmxpa2VQb3N0LmhhbmRsZXInLFxyXG4gICAgICAnVW5saWtlIGEgcG9zdCdcclxuICAgICk7XHJcblxyXG4gICAgLy8gQ29tbWVudFxyXG4gICAgdGhpcy5jcmVhdGVDb21tZW50ID0gY3JlYXRlTGFtYmRhRnVuY3Rpb24oXHJcbiAgICAgICdDcmVhdGVDb21tZW50RnVuY3Rpb24nLFxyXG4gICAgICAnY3JlYXRlLWNvbW1lbnQnLFxyXG4gICAgICAnaGFuZGxlcnMvY29tbWVudC9jcmVhdGVDb21tZW50LmhhbmRsZXInLFxyXG4gICAgICAnQ3JlYXRlIGNvbW1lbnQgb24gcG9zdCdcclxuICAgICk7XHJcblxyXG4gICAgdGhpcy5kZWxldGVDb21tZW50ID0gY3JlYXRlTGFtYmRhRnVuY3Rpb24oXHJcbiAgICAgICdEZWxldGVDb21tZW50RnVuY3Rpb24nLFxyXG4gICAgICAnZGVsZXRlLWNvbW1lbnQnLFxyXG4gICAgICAnaGFuZGxlcnMvY29tbWVudC9kZWxldGVDb21tZW50LmhhbmRsZXInLFxyXG4gICAgICAnRGVsZXRlIGNvbW1lbnQnXHJcbiAgICApO1xyXG5cclxuICAgIHRoaXMuZ2V0Q29tbWVudHMgPSBjcmVhdGVMYW1iZGFGdW5jdGlvbihcclxuICAgICAgJ0dldENvbW1lbnRzRnVuY3Rpb24nLFxyXG4gICAgICAnZ2V0LWNvbW1lbnRzJyxcclxuICAgICAgJ2hhbmRsZXJzL2NvbW1lbnQvZ2V0Q29tbWVudHMuaGFuZGxlcicsXHJcbiAgICAgICdHZXQgY29tbWVudHMgZm9yIHBvc3QnXHJcbiAgICApO1xyXG5cclxuICAgIC8vIEZvbGxvd1xyXG4gICAgdGhpcy5mb2xsb3dVc2VyID0gY3JlYXRlTGFtYmRhRnVuY3Rpb24oXHJcbiAgICAgICdGb2xsb3dVc2VyRnVuY3Rpb24nLFxyXG4gICAgICAnZm9sbG93LXVzZXInLFxyXG4gICAgICAnaGFuZGxlcnMvZm9sbG93L2ZvbGxvd1VzZXIuaGFuZGxlcicsXHJcbiAgICAgICdGb2xsb3cgYSB1c2VyJ1xyXG4gICAgKTtcclxuXHJcbiAgICB0aGlzLnVuZm9sbG93VXNlciA9IGNyZWF0ZUxhbWJkYUZ1bmN0aW9uKFxyXG4gICAgICAnVW5mb2xsb3dVc2VyRnVuY3Rpb24nLFxyXG4gICAgICAndW5mb2xsb3ctdXNlcicsXHJcbiAgICAgICdoYW5kbGVycy9mb2xsb3cvdW5mb2xsb3dVc2VyLmhhbmRsZXInLFxyXG4gICAgICAnVW5mb2xsb3cgYSB1c2VyJ1xyXG4gICAgKTtcclxuXHJcbiAgICAvLyBSb29tXHJcbiAgICB0aGlzLmNyZWF0ZVJvb20gPSBjcmVhdGVMYW1iZGFGdW5jdGlvbihcclxuICAgICAgJ0NyZWF0ZVJvb21GdW5jdGlvbicsXHJcbiAgICAgICdjcmVhdGUtcm9vbScsXHJcbiAgICAgICdoYW5kbGVycy9yb29tL2NyZWF0ZVJvb20uaGFuZGxlcicsXHJcbiAgICAgICdDcmVhdGUgbmV3IHJvb20nXHJcbiAgICApO1xyXG5cclxuICAgIHRoaXMuam9pblJvb20gPSBjcmVhdGVMYW1iZGFGdW5jdGlvbihcclxuICAgICAgJ0pvaW5Sb29tRnVuY3Rpb24nLFxyXG4gICAgICAnam9pbi1yb29tJyxcclxuICAgICAgJ2hhbmRsZXJzL3Jvb20vam9pblJvb20uaGFuZGxlcicsXHJcbiAgICAgICdKb2luIGEgcm9vbSdcclxuICAgICk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIE91dHB1dHNcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0NyZWF0ZUFjY291bnRGdW5jdGlvbkFybicsIHtcclxuICAgICAgdmFsdWU6IHRoaXMuY3JlYXRlQWNjb3VudC5mdW5jdGlvbkFybixcclxuICAgICAgZXhwb3J0TmFtZTogYFBpZWNlQXBwLUNyZWF0ZUFjY291bnRBcm4tJHtlbnZpcm9ubWVudH1gLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0NyZWF0ZVBvc3RGdW5jdGlvbkFybicsIHtcclxuICAgICAgdmFsdWU6IHRoaXMuY3JlYXRlUG9zdC5mdW5jdGlvbkFybixcclxuICAgICAgZXhwb3J0TmFtZTogYFBpZWNlQXBwLUNyZWF0ZVBvc3RBcm4tJHtlbnZpcm9ubWVudH1gLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiJdfQ==