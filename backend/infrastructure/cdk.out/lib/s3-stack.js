"use strict";
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
exports.S3Stack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
class S3Stack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const { environment, removalPolicy } = props;
        // メディアファイル用S3バケット
        this.mediaBucket = new s3.Bucket(this, 'PieceAppMediaBucket', {
            bucketName: `piece-app-1983-${environment}`,
            // CORS設定
            cors: [
                {
                    allowedMethods: [
                        s3.HttpMethods.GET,
                        s3.HttpMethods.POST,
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.DELETE,
                    ],
                    allowedOrigins: ['*'], // 開発環境用、本番では特定のドメインに制限
                    allowedHeaders: ['*'],
                    exposedHeaders: [
                        'ETag',
                        'x-amz-server-side-encryption',
                        'x-amz-request-id',
                        'x-amz-id-2',
                    ],
                    maxAge: 3000,
                },
            ],
            // パブリックアクセス設定
            publicReadAccess: false, // セキュリティのためfalse
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            // ライフサイクルルール（30日後削除）
            lifecycleRules: [
                {
                    id: 'DeleteOldObjects',
                    enabled: true,
                    expiration: cdk.Duration.days(30),
                    abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
                },
            ],
            // バージョニング（本番環境のみ有効）
            versioned: environment === 'prod',
            // 暗号化
            encryption: s3.BucketEncryption.S3_MANAGED,
            // スタック削除時のバケット削除設定
            removalPolicy: removalPolicy,
            autoDeleteObjects: removalPolicy === cdk.RemovalPolicy.DESTROY,
        });
        // CloudFormation出力
        new cdk.CfnOutput(this, 'MediaBucketName', {
            value: this.mediaBucket.bucketName,
            description: 'S3 Bucket name for media files',
            exportName: `PieceApp-MediaBucket-Name-${environment}`,
        });
        new cdk.CfnOutput(this, 'MediaBucketArn', {
            value: this.mediaBucket.bucketArn,
            description: 'S3 Bucket ARN for media files',
            exportName: `PieceApp-MediaBucket-Arn-${environment}`,
        });
    }
}
exports.S3Stack = S3Stack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiczMtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvczMtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHVEQUF5QztBQVF6QyxNQUFhLE9BQVEsU0FBUSxHQUFHLENBQUMsS0FBSztJQUdwQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQW1CO1FBQzNELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBRTdDLGtCQUFrQjtRQUNsQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDNUQsVUFBVSxFQUFFLGtCQUFrQixXQUFXLEVBQUU7WUFFM0MsU0FBUztZQUNULElBQUksRUFBRTtnQkFDSjtvQkFDRSxjQUFjLEVBQUU7d0JBQ2QsRUFBRSxDQUFDLFdBQVcsQ0FBQyxHQUFHO3dCQUNsQixFQUFFLENBQUMsV0FBVyxDQUFDLElBQUk7d0JBQ25CLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRzt3QkFDbEIsRUFBRSxDQUFDLFdBQVcsQ0FBQyxNQUFNO3FCQUN0QjtvQkFDRCxjQUFjLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSx1QkFBdUI7b0JBQzlDLGNBQWMsRUFBRSxDQUFDLEdBQUcsQ0FBQztvQkFDckIsY0FBYyxFQUFFO3dCQUNkLE1BQU07d0JBQ04sOEJBQThCO3dCQUM5QixrQkFBa0I7d0JBQ2xCLFlBQVk7cUJBQ2I7b0JBQ0QsTUFBTSxFQUFFLElBQUk7aUJBQ2I7YUFDRjtZQUVELGNBQWM7WUFDZCxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsaUJBQWlCO1lBQzFDLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTO1lBRWpELHFCQUFxQjtZQUNyQixjQUFjLEVBQUU7Z0JBQ2Q7b0JBQ0UsRUFBRSxFQUFFLGtCQUFrQjtvQkFDdEIsT0FBTyxFQUFFLElBQUk7b0JBQ2IsVUFBVSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDakMsbUNBQW1DLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2lCQUMxRDthQUNGO1lBRUQsb0JBQW9CO1lBQ3BCLFNBQVMsRUFBRSxXQUFXLEtBQUssTUFBTTtZQUVqQyxNQUFNO1lBQ04sVUFBVSxFQUFFLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVO1lBRTFDLG1CQUFtQjtZQUNuQixhQUFhLEVBQUUsYUFBYTtZQUM1QixpQkFBaUIsRUFBRSxhQUFhLEtBQUssR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1NBQy9ELENBQUMsQ0FBQztRQUVILG1CQUFtQjtRQUNuQixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ3pDLEtBQUssRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVU7WUFDbEMsV0FBVyxFQUFFLGdDQUFnQztZQUM3QyxVQUFVLEVBQUUsNkJBQTZCLFdBQVcsRUFBRTtTQUN2RCxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQ3hDLEtBQUssRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVM7WUFDakMsV0FBVyxFQUFFLCtCQUErQjtZQUM1QyxVQUFVLEVBQUUsNEJBQTRCLFdBQVcsRUFBRTtTQUN0RCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF2RUQsMEJBdUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcblxyXG5pbnRlcmZhY2UgUzNTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xyXG4gIGVudmlyb25tZW50OiAnZGV2JyB8ICdwcm9kJztcclxuICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFMzU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gIHB1YmxpYyByZWFkb25seSBtZWRpYUJ1Y2tldDogczMuQnVja2V0O1xyXG5cclxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogUzNTdGFja1Byb3BzKSB7XHJcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuXHJcbiAgICBjb25zdCB7IGVudmlyb25tZW50LCByZW1vdmFsUG9saWN5IH0gPSBwcm9wcztcclxuXHJcbiAgICAvLyDjg6Hjg4fjgqPjgqLjg5XjgqHjgqTjg6vnlKhTM+ODkOOCseODg+ODiFxyXG4gICAgdGhpcy5tZWRpYUJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1BpZWNlQXBwTWVkaWFCdWNrZXQnLCB7XHJcbiAgICAgIGJ1Y2tldE5hbWU6IGBwaWVjZS1hcHAtMTk4My0ke2Vudmlyb25tZW50fWAsXHJcblxyXG4gICAgICAvLyBDT1JT6Kit5a6aXHJcbiAgICAgIGNvcnM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBhbGxvd2VkTWV0aG9kczogW1xyXG4gICAgICAgICAgICBzMy5IdHRwTWV0aG9kcy5HRVQsXHJcbiAgICAgICAgICAgIHMzLkh0dHBNZXRob2RzLlBPU1QsXHJcbiAgICAgICAgICAgIHMzLkh0dHBNZXRob2RzLlBVVCxcclxuICAgICAgICAgICAgczMuSHR0cE1ldGhvZHMuREVMRVRFLFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIGFsbG93ZWRPcmlnaW5zOiBbJyonXSwgLy8g6ZaL55m655Kw5aKD55So44CB5pys55Wq44Gn44Gv54m55a6a44Gu44OJ44Oh44Kk44Oz44Gr5Yi26ZmQXHJcbiAgICAgICAgICBhbGxvd2VkSGVhZGVyczogWycqJ10sXHJcbiAgICAgICAgICBleHBvc2VkSGVhZGVyczogW1xyXG4gICAgICAgICAgICAnRVRhZycsXHJcbiAgICAgICAgICAgICd4LWFtei1zZXJ2ZXItc2lkZS1lbmNyeXB0aW9uJyxcclxuICAgICAgICAgICAgJ3gtYW16LXJlcXVlc3QtaWQnLFxyXG4gICAgICAgICAgICAneC1hbXotaWQtMicsXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgbWF4QWdlOiAzMDAwLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcblxyXG4gICAgICAvLyDjg5Hjg5bjg6rjg4Pjgq/jgqLjgq/jgrvjgrnoqK3lrppcclxuICAgICAgcHVibGljUmVhZEFjY2VzczogZmFsc2UsIC8vIOOCu+OCreODpeODquODhuOCo+OBruOBn+OCgWZhbHNlXHJcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXHJcblxyXG4gICAgICAvLyDjg6njgqTjg5XjgrXjgqTjgq/jg6vjg6vjg7zjg6vvvIgzMOaXpeW+jOWJiumZpO+8iVxyXG4gICAgICBsaWZlY3ljbGVSdWxlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiAnRGVsZXRlT2xkT2JqZWN0cycsXHJcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICAgICAgZXhwaXJhdGlvbjogY2RrLkR1cmF0aW9uLmRheXMoMzApLFxyXG4gICAgICAgICAgYWJvcnRJbmNvbXBsZXRlTXVsdGlwYXJ0VXBsb2FkQWZ0ZXI6IGNkay5EdXJhdGlvbi5kYXlzKDcpLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcblxyXG4gICAgICAvLyDjg5Djg7zjgrjjg6fjg4vjg7PjgrDvvIjmnKznlarnkrDlooPjga7jgb/mnInlirnvvIlcclxuICAgICAgdmVyc2lvbmVkOiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnLFxyXG5cclxuICAgICAgLy8g5pqX5Y+35YyWXHJcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcclxuXHJcbiAgICAgIC8vIOOCueOCv+ODg+OCr+WJiumZpOaZguOBruODkOOCseODg+ODiOWJiumZpOioreWumlxyXG4gICAgICByZW1vdmFsUG9saWN5OiByZW1vdmFsUG9saWN5LFxyXG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogcmVtb3ZhbFBvbGljeSA9PT0gY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENsb3VkRm9ybWF0aW9u5Ye65YqbXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnTWVkaWFCdWNrZXROYW1lJywge1xyXG4gICAgICB2YWx1ZTogdGhpcy5tZWRpYUJ1Y2tldC5idWNrZXROYW1lLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ1MzIEJ1Y2tldCBuYW1lIGZvciBtZWRpYSBmaWxlcycsXHJcbiAgICAgIGV4cG9ydE5hbWU6IGBQaWVjZUFwcC1NZWRpYUJ1Y2tldC1OYW1lLSR7ZW52aXJvbm1lbnR9YCxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdNZWRpYUJ1Y2tldEFybicsIHtcclxuICAgICAgdmFsdWU6IHRoaXMubWVkaWFCdWNrZXQuYnVja2V0QXJuLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ1MzIEJ1Y2tldCBBUk4gZm9yIG1lZGlhIGZpbGVzJyxcclxuICAgICAgZXhwb3J0TmFtZTogYFBpZWNlQXBwLU1lZGlhQnVja2V0LUFybi0ke2Vudmlyb25tZW50fWAsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIl19