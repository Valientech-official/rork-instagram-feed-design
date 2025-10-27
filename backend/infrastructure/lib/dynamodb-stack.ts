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
    // 認証・プロフィール管理の中心テーブル
    // 1電話番号あたり3アカウントまで（アプリ側でチェック）
    // account_type: personal/business/shop/verified/admin
    this.tables.account = new dynamodb.TableV2(this, 'AccountTable', {
      tableName: `ACCOUNT${tableSuffix}`,

      // プライマリキー
      // PK: "ACCOUNT#account_id"
      // SK: "PROFILE" (固定値)
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,

      globalSecondaryIndexes: [
        {
          // GSI1: メールアドレスでログイン
          // GSI1PK: "EMAIL#email"
          // GSI1SK: "ACCOUNT" (固定値)
          indexName: 'GSI1_EmailLogin',
          partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
        },
        {
          // GSI2: ハンドル検索用
          // GSI2PK: "HANDLE#handle"
          // GSI2SK: "ACCOUNT" (固定値)
          indexName: 'GSI2_HandleSearch',
          partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
        },
        {
          // GSI3: 電話番号で紐づくアカウントを管理するためのインデックス
          // GSI3PK: "PHONE#phone_number"
          // GSI3SK: "CREATED#created_at"
          // 用途: 1電話番号あたり3アカウント制限のチェック
          indexName: 'GSI3_PhoneManagement',
          partitionKey: { name: 'GSI3PK', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'GSI3SK', type: dynamodb.AttributeType.STRING },
        },
      ],
    });

    // =====================================================
    // 2. SESSION テーブル (GSI: 1, TTL: 30日)
    // =====================================================
    // アカウント切り替え用セッション管理
    // TTLで30日後自動削除、同時ログイン無制限
    this.tables.session = new dynamodb.TableV2(this, 'SessionTable', {
      tableName: `SESSION${tableSuffix}`,

      // PK: "SESSION#account_id"
      // SK: "DEVICE#device_id"
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,
      timeToLiveAttribute: 'ttl', // 30日後削除

      globalSecondaryIndexes: [
        {
          // GSI1: アカウントのセッション一覧
          // GSI1PK: "ACCOUNT_SESSIONS#account_id"
          // GSI1SK: "CREATED#created_at"
          indexName: 'GSI1_AccountSessions',
          partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
        },
      ],
    });

    // =====================================================
    // 3. POST テーブル (GSI: 4, TTL: 90日)
    // =====================================================
    // 投稿データ管理
    // hashtags: String Set (SS)、repost_count追加
    // ROOM投稿：通常タイムライン + ROOMタイムライン両方に表示
    this.tables.post = new dynamodb.TableV2(this, 'PostTable', {
      tableName: `POST${tableSuffix}`,

      // PK: postId (ULID)
      partitionKey: { name: 'postId', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,
      timeToLiveAttribute: 'ttl', // 削除から90日後に物理削除

      globalSecondaryIndexes: [
        {
          // GSI1: タイムライン取得用（特定ユーザーの投稿を時系列で取得）
          indexName: 'GSI1',
          partitionKey: { name: 'accountId', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI2: 発見タブ用（パブリック投稿の一覧取得）
          indexName: 'GSI2',
          partitionKey: { name: 'visibility', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI3: ルーム内投稿一覧取得用
          indexName: 'GSI3',
          partitionKey: { name: 'room_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI4: 投稿タイプ別一覧（normal/wave）
          indexName: 'GSI_PostType_CreatedAt',
          partitionKey: { name: 'post_type', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 4. HASHTAG_INDEX テーブル (GSI: 0)
    // =====================================================
    // ハッシュタグ検索用
    this.tables.hashtagIndex = new dynamodb.TableV2(this, 'HashtagIndexTable', {
      tableName: `HASHTAG_INDEX${tableSuffix}`,

      // PK: hashtag (小文字化済み)
      // SK: postId
      partitionKey: { name: 'hashtag', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'postId', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,
    });

    // =====================================================
    // 5. HASHTAG_COUNT テーブル (GSI: 1, TTL: 30日)
    // =====================================================
    // トレンドハッシュタグ集計用
    this.tables.hashtagCount = new dynamodb.TableV2(this, 'HashtagCountTable', {
      tableName: `HASHTAG_COUNT${tableSuffix}`,

      // PK: hashtag
      // SK: period (daily_2025-10-14 / weekly_2025-W42 / all_time)
      partitionKey: { name: 'hashtag', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'period', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,
      timeToLiveAttribute: 'ttl', // 30日後削除

      globalSecondaryIndexes: [
        {
          // GSI1: ランキング取得用（期間ごとの人気ハッシュタグTOP10）
          indexName: 'GSI1',
          partitionKey: { name: 'period', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'count', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 6. FOLLOW テーブル (GSI: 2)
    // =====================================================
    // フォロー/フォロワー関係管理
    this.tables.follow = new dynamodb.TableV2(this, 'FollowTable', {
      tableName: `FOLLOW${tableSuffix}`,

      // PK: follower_id (フォローする側)
      // SK: following_id (フォローされる側)
      partitionKey: { name: 'follower_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'following_id', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,

      globalSecondaryIndexes: [
        {
          // GSI1: フォロー中一覧取得用
          indexName: 'GSI1',
          partitionKey: { name: 'follower_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI2: フォロワー一覧取得用
          indexName: 'GSI2',
          partitionKey: { name: 'following_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 7. LIKE テーブル (GSI: 1)
    // =====================================================
    // 投稿へのいいね管理
    // ConditionExpressionで重複防止
    this.tables.like = new dynamodb.TableV2(this, 'LikeTable', {
      tableName: `LIKE${tableSuffix}`,

      // PK: post_id
      // SK: account_id
      partitionKey: { name: 'post_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,

      globalSecondaryIndexes: [
        {
          // GSI1: ユーザーがいいねした投稿一覧
          indexName: 'GSI1',
          partitionKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 8. COMMENT テーブル (GSI: 2, TTL: 90日)
    // =====================================================
    // 投稿へのコメント管理（ハイブリッド削除方式）
    // ユーザー削除: 即時物理削除
    // 運営削除: 論理削除（is_deleted=true、90日TTL）
    this.tables.comment = new dynamodb.TableV2(this, 'CommentTable', {
      tableName: `COMMENT${tableSuffix}`,

      // PK: comment_id (ULID)
      partitionKey: { name: 'comment_id', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,
      timeToLiveAttribute: 'ttl', // 運営削除から90日後に物理削除

      globalSecondaryIndexes: [
        {
          // GSI1: 投稿のコメント一覧取得用（古い順）
          indexName: 'GSI1',
          partitionKey: { name: 'post_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI2: ユーザーのコメント一覧取得用（新しい順）
          indexName: 'GSI2',
          partitionKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 9. ROOM テーブル (GSI: 2)
    // =====================================================
    // ジャンル別コミュニティ空間
    this.tables.room = new dynamodb.TableV2(this, 'RoomTable', {
      tableName: `ROOM${tableSuffix}`,

      // PK: room_id (ULID)
      partitionKey: { name: 'room_id', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,

      globalSecondaryIndexes: [
        {
          // GSI1: カテゴリー別人気ルーム取得用
          indexName: 'GSI1',
          partitionKey: { name: 'category', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'member_count', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI2: ルームハンドル検索用（URL: /room/@handle）
          indexName: 'GSI2',
          partitionKey: { name: 'room_handle', type: dynamodb.AttributeType.STRING },
        },
      ],
    });

    // =====================================================
    // 10. ROOM_MEMBER テーブル (GSI: 1)
    // =====================================================
    // ルームメンバー管理
    this.tables.roomMember = new dynamodb.TableV2(this, 'RoomMemberTable', {
      tableName: `ROOM_MEMBER${tableSuffix}`,

      // PK: room_id
      // SK: account_id
      partitionKey: { name: 'room_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,

      globalSecondaryIndexes: [
        {
          // GSI1: ユーザーの参加ルーム一覧取得用
          indexName: 'GSI1',
          partitionKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'joined_at', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 11. NOTIFICATION テーブル (GSI: 2, TTL: 90日)
    // =====================================================
    // ユーザー通知管理
    this.tables.notification = new dynamodb.TableV2(this, 'NotificationTable', {
      tableName: `NOTIFICATION${tableSuffix}`,

      // PK: notification_id (ULID)
      partitionKey: { name: 'notification_id', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,
      timeToLiveAttribute: 'ttl', // 作成から90日後に削除

      globalSecondaryIndexes: [
        {
          // GSI1: 通知一覧取得用（新しい順）
          indexName: 'GSI1',
          partitionKey: { name: 'recipient_account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI2: 未読通知フィルタ用（未読バッジ表示）
          indexName: 'GSI2',
          partitionKey: { name: 'recipient_account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'is_read', type: dynamodb.AttributeType.STRING },
        },
      ],
    });

    // =====================================================
    // 12. NOTIFICATION_SETTINGS テーブル (GSI: 0)
    // =====================================================
    // プッシュ通知設定（AWS SNS対応）
    this.tables.notificationSettings = new dynamodb.TableV2(this, 'NotificationSettingsTable', {
      tableName: `NOTIFICATION_SETTINGS${tableSuffix}`,

      // PK: account_id
      partitionKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,
    });

    // =====================================================
    // 13. MUTED_ACCOUNTS テーブル (GSI: 1)
    // =====================================================
    // 個別ユーザーミュート
    this.tables.mutedAccounts = new dynamodb.TableV2(this, 'MutedAccountsTable', {
      tableName: `MUTED_ACCOUNTS${tableSuffix}`,

      // PK: account_id (ミュート設定をするアカウント)
      // SK: muted_account_id (ミュートされるアカウント)
      partitionKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'muted_account_id', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,

      globalSecondaryIndexes: [
        {
          // GSI1: 逆引き用（統計）
          indexName: 'GSI1',
          partitionKey: { name: 'muted_account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
        },
      ],
    });

    // =====================================================
    // 14. REPOST テーブル (GSI: 2)
    // =====================================================
    // 投稿のシェア（リポスト）管理
    this.tables.repost = new dynamodb.TableV2(this, 'RepostTable', {
      tableName: `REPOST${tableSuffix}`,

      // PK: repost_id (ULID)
      partitionKey: { name: 'repost_id', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,

      globalSecondaryIndexes: [
        {
          // GSI1: ユーザーのリポスト一覧取得用（新しい順）
          indexName: 'GSI1',
          partitionKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI2: 投稿のリポスト一覧取得用（誰がリポストしたか）
          indexName: 'GSI2',
          partitionKey: { name: 'original_post_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 15. BLOCK テーブル (GSI: 1)
    // =====================================================
    // ブロック管理
    this.tables.block = new dynamodb.TableV2(this, 'BlockTable', {
      tableName: `BLOCK${tableSuffix}`,

      // PK: blocker_account_id (ブロックした人)
      // SK: blocked_account_id (ブロックされた人)
      partitionKey: { name: 'blocker_account_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'blocked_account_id', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,

      globalSecondaryIndexes: [
        {
          // GSI1: 逆引き用
          indexName: 'GSI_blocked_by',
          partitionKey: { name: 'blocked_account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'blocked_at', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 16. REPORT テーブル (GSI: 4, TTL: 180日)
    // =====================================================
    // 通報管理
    this.tables.report = new dynamodb.TableV2(this, 'ReportTable', {
      tableName: `REPORT${tableSuffix}`,

      // PK: report_id (ULID)
      // SK: created_at
      partitionKey: { name: 'report_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },

      ...commonTableProps,
      timeToLiveAttribute: 'ttl', // 対応完了後180日で削除

      globalSecondaryIndexes: [
        {
          // GSI1: ステータス別レポート
          indexName: 'GSI_status_reports',
          partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI2: 対象別レポート
          indexName: 'GSI_target_reports',
          partitionKey: { name: 'target_type', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'target_id', type: dynamodb.AttributeType.STRING },
        },
        {
          // GSI3: 通報者履歴
          indexName: 'GSI_reporter_history',
          partitionKey: { name: 'reporter_account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI4: 通報されたユーザー
          indexName: 'GSI_reported_user',
          partitionKey: { name: 'target_account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 第2段階: 残り11テーブルはここに追加予定
    // =====================================================

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
