import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface DynamoDBStackProps extends cdk.StackProps {
  environment: 'dev' | 'prod';
  removalPolicy: cdk.RemovalPolicy;
}

export class DynamoDBStack extends cdk.Stack {
  public readonly tables: { [key: string]: dynamodb.TableV2 };

  constructor(scope: Construct, id: string, props: DynamoDBStackProps) {
    super(scope, id, props);

    this.tables = {};

    const { environment, removalPolicy } = props;
    const tableSuffix = `-${environment}`;

    // 共通設定
    const commonTableProps = {
      billing: dynamodb.Billing.onDemand(),
      encryption: dynamodb.TableEncryptionV2.awsManagedKey(),
      removalPolicy: removalPolicy,
      pointInTimeRecovery: environment === 'prod', // 本番のみPITR有効
    };

    // =====================================================
    // 1. ACCOUNT テーブル (GSI: 3)
    // =====================================================
    this.tables.account = new dynamodb.TableV2(this, 'AccountTable', {
      tableName: `ACCOUNT${tableSuffix}`,
      partitionKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING }, // PROFILE固定値
      ...commonTableProps,

      globalSecondaryIndexes: [
        {
          // GSI1: メールアドレスでログイン
          indexName: 'EmailIndex',
          partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
        },
        {
          // GSI2: ハンドル名で検索
          indexName: 'HandleIndex',
          partitionKey: { name: 'handle', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
        },
        {
          // GSI3: 電話番号で管理（3アカウント制限チェック用）
          indexName: 'PhoneIndex',
          partitionKey: { name: 'phone_number', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
        },
      ],
    });

    // =====================================================
    // 2. POST テーブル (GSI: 4, TTL: 90日)
    // =====================================================
    this.tables.post = new dynamodb.TableV2(this, 'PostTable', {
      tableName: `POST${tableSuffix}`,
      partitionKey: { name: 'post_id', type: dynamodb.AttributeType.STRING }, // ULID
      ...commonTableProps,
      timeToLiveAttribute: 'ttl', // 90日後削除

      globalSecondaryIndexes: [
        {
          // GSI1: アカウントの投稿一覧
          indexName: 'AccountIndex',
          partitionKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.STRING },
        },
        {
          // GSI2: ROOM投稿一覧
          indexName: 'RoomIndex',
          partitionKey: { name: 'room_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.STRING },
        },
        {
          // GSI3: ハッシュタグ検索
          indexName: 'HashtagIndex',
          partitionKey: { name: 'hashtag', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.STRING },
        },
        {
          // GSI4: タイムライン取得（全投稿を時系列順）
          indexName: 'TimelineIndex',
          partitionKey: { name: 'post_type', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.STRING },
        },
      ],
    });

    // =====================================================
    // 3. PRODUCT テーブル (GSI: 3, TTL: 90日)
    // =====================================================
    this.tables.product = new dynamodb.TableV2(this, 'ProductTable', {
      tableName: `PRODUCT${tableSuffix}`,
      partitionKey: { name: 'product_id', type: dynamodb.AttributeType.STRING },
      ...commonTableProps,
      timeToLiveAttribute: 'ttl', // 90日後削除

      globalSecondaryIndexes: [
        {
          // GSI1: アカウントの商品一覧
          indexName: 'AccountIndex',
          partitionKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.STRING },
        },
        {
          // GSI2: カテゴリ別商品一覧
          indexName: 'CategoryIndex',
          partitionKey: { name: 'category', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.STRING },
        },
        {
          // GSI3: 価格順ソート（カテゴリ内）
          indexName: 'PriceIndex',
          partitionKey: { name: 'category', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'price', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 4. LIVE_STREAM テーブル (GSI: 3, TTL: 30日)
    // =====================================================
    this.tables.liveStream = new dynamodb.TableV2(this, 'LiveStreamTable', {
      tableName: `LIVE_STREAM${tableSuffix}`,
      partitionKey: { name: 'live_stream_id', type: dynamodb.AttributeType.STRING },
      ...commonTableProps,
      timeToLiveAttribute: 'ttl', // 30日後削除（アーカイブ期間）

      globalSecondaryIndexes: [
        {
          // GSI1: アカウントの配信履歴
          indexName: 'AccountIndex',
          partitionKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'started_at', type: dynamodb.AttributeType.STRING },
        },
        {
          // GSI2: ステータス別配信リスト
          indexName: 'StatusIndex',
          partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'started_at', type: dynamodb.AttributeType.STRING },
        },
        {
          // GSI3: アクティブ配信一覧（最新順）
          indexName: 'ActiveStreamIndex',
          partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'viewer_count', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 5. LIVE_VIEWER テーブル (GSI: 2, TTL: 7日)
    // =====================================================
    this.tables.liveViewer = new dynamodb.TableV2(this, 'LiveViewerTable', {
      tableName: `LIVE_VIEWER${tableSuffix}`,
      partitionKey: { name: 'live_stream_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
      ...commonTableProps,
      timeToLiveAttribute: 'ttl', // 7日後削除（履歴用）

      globalSecondaryIndexes: [
        {
          // GSI1: ユーザーの視聴履歴
          indexName: 'AccountIndex',
          partitionKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'joined_at', type: dynamodb.AttributeType.STRING },
        },
        {
          // GSI2: 配信の視聴者一覧
          indexName: 'LiveStreamIndex',
          partitionKey: { name: 'live_stream_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'joined_at', type: dynamodb.AttributeType.STRING },
        },
      ],
    });

    // =====================================================
    // CloudFormation Outputs
    // =====================================================
    Object.entries(this.tables).forEach(([name, table]) => {
      new cdk.CfnOutput(this, `${name}TableName`, {
        value: table.tableName,
        description: `${name} table name`,
        exportName: `PieceApp-${name}-TableName-${environment}`,
      });
    });
  }
}
