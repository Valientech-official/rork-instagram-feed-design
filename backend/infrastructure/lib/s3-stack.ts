import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface S3StackProps extends cdk.StackProps {
  environment: 'dev' | 'prod';
  removalPolicy: cdk.RemovalPolicy;
}

export class S3Stack extends cdk.Stack {
  public readonly mediaBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: S3StackProps) {
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

      // パブリックアクセス設定（メディアファイルは公開読み取り可能）
      publicReadAccess: true, // メディアファイルの公開読み取りを許可
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),

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
