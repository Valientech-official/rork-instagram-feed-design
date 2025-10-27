import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class S3Stack extends cdk.Stack {
  public readonly mediaBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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
