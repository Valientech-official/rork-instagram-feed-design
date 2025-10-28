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
        // メディアファイル用S3バケット
        this.mediaBucket = new s3.Bucket(this, 'PieceAppMediaBucket', {
            bucketName: 'piece-app-1983-dev',
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
            // バージョニング（開発環境ではオフ）
            versioned: false,
            // 暗号化
            encryption: s3.BucketEncryption.S3_MANAGED,
            // スタック削除時のバケット削除設定（開発環境用）
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });
        // CloudFormation出力
        new cdk.CfnOutput(this, 'MediaBucketName', {
            value: this.mediaBucket.bucketName,
            description: 'S3 Bucket name for media files',
            exportName: 'PieceAppMediaBucketName',
        });
        new cdk.CfnOutput(this, 'MediaBucketArn', {
            value: this.mediaBucket.bucketArn,
            description: 'S3 Bucket ARN for media files',
            exportName: 'PieceAppMediaBucketArn',
        });
    }
}
exports.S3Stack = S3Stack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiczMtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvczMtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHVEQUF5QztBQUd6QyxNQUFhLE9BQVEsU0FBUSxHQUFHLENBQUMsS0FBSztJQUdwQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLGtCQUFrQjtRQUNsQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDNUQsVUFBVSxFQUFFLG9CQUFvQjtZQUVoQyxTQUFTO1lBQ1QsSUFBSSxFQUFFO2dCQUNKO29CQUNFLGNBQWMsRUFBRTt3QkFDZCxFQUFFLENBQUMsV0FBVyxDQUFDLEdBQUc7d0JBQ2xCLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSTt3QkFDbkIsRUFBRSxDQUFDLFdBQVcsQ0FBQyxHQUFHO3dCQUNsQixFQUFFLENBQUMsV0FBVyxDQUFDLE1BQU07cUJBQ3RCO29CQUNELGNBQWMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLHVCQUF1QjtvQkFDOUMsY0FBYyxFQUFFLENBQUMsR0FBRyxDQUFDO29CQUNyQixjQUFjLEVBQUU7d0JBQ2QsTUFBTTt3QkFDTiw4QkFBOEI7d0JBQzlCLGtCQUFrQjt3QkFDbEIsWUFBWTtxQkFDYjtvQkFDRCxNQUFNLEVBQUUsSUFBSTtpQkFDYjthQUNGO1lBRUQsY0FBYztZQUNkLGdCQUFnQixFQUFFLEtBQUssRUFBRSxpQkFBaUI7WUFDMUMsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFNBQVM7WUFFakQscUJBQXFCO1lBQ3JCLGNBQWMsRUFBRTtnQkFDZDtvQkFDRSxFQUFFLEVBQUUsa0JBQWtCO29CQUN0QixPQUFPLEVBQUUsSUFBSTtvQkFDYixVQUFVLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUNqQyxtQ0FBbUMsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7aUJBQzFEO2FBQ0Y7WUFFRCxvQkFBb0I7WUFDcEIsU0FBUyxFQUFFLEtBQUs7WUFFaEIsTUFBTTtZQUNOLFVBQVUsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsVUFBVTtZQUUxQywwQkFBMEI7WUFDMUIsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztZQUN4QyxpQkFBaUIsRUFBRSxJQUFJO1NBQ3hCLENBQUMsQ0FBQztRQUVILG1CQUFtQjtRQUNuQixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ3pDLEtBQUssRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVU7WUFDbEMsV0FBVyxFQUFFLGdDQUFnQztZQUM3QyxVQUFVLEVBQUUseUJBQXlCO1NBQ3RDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDeEMsS0FBSyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUztZQUNqQyxXQUFXLEVBQUUsK0JBQStCO1lBQzVDLFVBQVUsRUFBRSx3QkFBd0I7U0FDckMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBckVELDBCQXFFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XHJcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFMzU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gIHB1YmxpYyByZWFkb25seSBtZWRpYUJ1Y2tldDogczMuQnVja2V0O1xyXG5cclxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XHJcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuXHJcbiAgICAvLyDjg6Hjg4fjgqPjgqLjg5XjgqHjgqTjg6vnlKhTM+ODkOOCseODg+ODiFxyXG4gICAgdGhpcy5tZWRpYUJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1BpZWNlQXBwTWVkaWFCdWNrZXQnLCB7XHJcbiAgICAgIGJ1Y2tldE5hbWU6ICdwaWVjZS1hcHAtMTk4My1kZXYnLFxyXG5cclxuICAgICAgLy8gQ09SU+ioreWumlxyXG4gICAgICBjb3JzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgYWxsb3dlZE1ldGhvZHM6IFtcclxuICAgICAgICAgICAgczMuSHR0cE1ldGhvZHMuR0VULFxyXG4gICAgICAgICAgICBzMy5IdHRwTWV0aG9kcy5QT1NULFxyXG4gICAgICAgICAgICBzMy5IdHRwTWV0aG9kcy5QVVQsXHJcbiAgICAgICAgICAgIHMzLkh0dHBNZXRob2RzLkRFTEVURSxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgICBhbGxvd2VkT3JpZ2luczogWycqJ10sIC8vIOmWi+eZuueSsOWig+eUqOOAgeacrOeVquOBp+OBr+eJueWumuOBruODieODoeOCpOODs+OBq+WItumZkFxyXG4gICAgICAgICAgYWxsb3dlZEhlYWRlcnM6IFsnKiddLFxyXG4gICAgICAgICAgZXhwb3NlZEhlYWRlcnM6IFtcclxuICAgICAgICAgICAgJ0VUYWcnLFxyXG4gICAgICAgICAgICAneC1hbXotc2VydmVyLXNpZGUtZW5jcnlwdGlvbicsXHJcbiAgICAgICAgICAgICd4LWFtei1yZXF1ZXN0LWlkJyxcclxuICAgICAgICAgICAgJ3gtYW16LWlkLTInLFxyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIG1heEFnZTogMzAwMCxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG5cclxuICAgICAgLy8g44OR44OW44Oq44OD44Kv44Ki44Kv44K744K56Kit5a6aXHJcbiAgICAgIHB1YmxpY1JlYWRBY2Nlc3M6IGZhbHNlLCAvLyDjgrvjgq3jg6Xjg6rjg4bjgqPjga7jgZ/jgoFmYWxzZVxyXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxyXG5cclxuICAgICAgLy8g44Op44Kk44OV44K144Kk44Kv44Or44Or44O844Or77yIMzDml6XlvozliYrpmaTvvIlcclxuICAgICAgbGlmZWN5Y2xlUnVsZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogJ0RlbGV0ZU9sZE9iamVjdHMnLFxyXG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICAgIGV4cGlyYXRpb246IGNkay5EdXJhdGlvbi5kYXlzKDMwKSxcclxuICAgICAgICAgIGFib3J0SW5jb21wbGV0ZU11bHRpcGFydFVwbG9hZEFmdGVyOiBjZGsuRHVyYXRpb24uZGF5cyg3KSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG5cclxuICAgICAgLy8g44OQ44O844K444On44OL44Oz44Kw77yI6ZaL55m655Kw5aKD44Gn44Gv44Kq44OV77yJXHJcbiAgICAgIHZlcnNpb25lZDogZmFsc2UsXHJcblxyXG4gICAgICAvLyDmmpflj7fljJZcclxuICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5TM19NQU5BR0VELFxyXG5cclxuICAgICAgLy8g44K544K/44OD44Kv5YmK6Zmk5pmC44Gu44OQ44Kx44OD44OI5YmK6Zmk6Kit5a6a77yI6ZaL55m655Kw5aKD55So77yJXHJcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXHJcbiAgICAgIGF1dG9EZWxldGVPYmplY3RzOiB0cnVlLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ2xvdWRGb3JtYXRpb27lh7rliptcclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdNZWRpYUJ1Y2tldE5hbWUnLCB7XHJcbiAgICAgIHZhbHVlOiB0aGlzLm1lZGlhQnVja2V0LmJ1Y2tldE5hbWUsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnUzMgQnVja2V0IG5hbWUgZm9yIG1lZGlhIGZpbGVzJyxcclxuICAgICAgZXhwb3J0TmFtZTogJ1BpZWNlQXBwTWVkaWFCdWNrZXROYW1lJyxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdNZWRpYUJ1Y2tldEFybicsIHtcclxuICAgICAgdmFsdWU6IHRoaXMubWVkaWFCdWNrZXQuYnVja2V0QXJuLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ1MzIEJ1Y2tldCBBUk4gZm9yIG1lZGlhIGZpbGVzJyxcclxuICAgICAgZXhwb3J0TmFtZTogJ1BpZWNlQXBwTWVkaWFCdWNrZXRBcm4nLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiJdfQ==