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
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: environment === 'prod', // 本番のみPITR有効
      },
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
          // GSI2: 対象タイプ別レポート（時系列）
          // target_idはFilterExpressionで絞り込む
          indexName: 'GSI_target_reports',
          partitionKey: { name: 'target_type', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
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
    // 17. LIVE_STREAM テーブル (GSI: 4, TTL: 30日)
    // =====================================================
    // ライブ配信管理
    // viewer_count使用（ベストプラクティス）
    this.tables.liveStream = new dynamodb.TableV2(this, 'LiveStreamTable', {
      tableName: `LIVE_STREAM${tableSuffix}`,

      // PK: stream_id (ULID)
      // SK: created_at
      partitionKey: { name: 'stream_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },

      ...commonTableProps,
      timeToLiveAttribute: 'ttl', // 30日後削除（アーカイブ期間）

      globalSecondaryIndexes: [
        {
          // GSI1: ルームの配信一覧
          indexName: 'GSI_room_lives',
          partitionKey: { name: 'room_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'started_at', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI2: アカウントの配信履歴
          indexName: 'GSI_account_lives',
          partitionKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'started_at', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI3: アクティブ配信一覧
          indexName: 'GSI_active_lives',
          partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'started_at', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI4: Mux Webhook用（mux_live_stream_idからstream_idを検索）
          indexName: 'GSI_mux_stream_lookup',
          partitionKey: { name: 'mux_live_stream_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 18. LIVE_VIEWER テーブル (GSI: 2, TTL: 7日)
    // =====================================================
    // ライブ視聴者管理（履歴・分析専用）
    // リアルタイムの視聴者数はLIVE_STREAM.viewer_countを使用
    this.tables.liveViewer = new dynamodb.TableV2(this, 'LiveViewerTable', {
      tableName: `LIVE_VIEWER${tableSuffix}`,

      // PK: viewer_key (stream_id#account_id)
      // SK: joined_at
      partitionKey: { name: 'viewer_key', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'joined_at', type: dynamodb.AttributeType.NUMBER },

      ...commonTableProps,
      timeToLiveAttribute: 'ttl', // 配信終了7日後に削除

      globalSecondaryIndexes: [
        {
          // GSI1: 配信の視聴者一覧（is_active=trueでフィルタ）
          indexName: 'GSI_stream_viewers',
          partitionKey: { name: 'stream_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'last_ping_at', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI2: ユーザーの視聴履歴
          indexName: 'GSI_user_watch_history',
          partitionKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'joined_at', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 19. LIVE_MODERATOR テーブル (GSI: 1)
    // =====================================================
    // ライブ配信モデレーター管理
    this.tables.liveModerator = new dynamodb.TableV2(this, 'LiveModeratorTable', {
      tableName: `LIVE_MODERATOR${tableSuffix}`,

      // PK: stream_id
      // SK: moderator_account_id
      partitionKey: { name: 'stream_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'moderator_account_id', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,

      globalSecondaryIndexes: [
        {
          // GSI1: モデレーターの配信一覧
          indexName: 'GSI_moderator_streams',
          partitionKey: { name: 'moderator_account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'assigned_at', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 20. MODERATOR_ACTION_LOG テーブル (GSI: 2)
    // =====================================================
    // モデレーターアクションログ
    this.tables.moderatorActionLog = new dynamodb.TableV2(this, 'ModeratorActionLogTable', {
      tableName: `MODERATOR_ACTION_LOG${tableSuffix}`,

      // PK: log_id (ULID)
      partitionKey: { name: 'log_id', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,

      globalSecondaryIndexes: [
        {
          // GSI1: 配信のアクションログ
          indexName: 'GSI_stream_actions',
          partitionKey: { name: 'stream_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI2: モデレーターのアクション履歴
          indexName: 'GSI_moderator_actions',
          partitionKey: { name: 'moderator_account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 21. LIVE_CHAT テーブル (GSI: 1, TTL: 7日)
    // =====================================================
    // ライブチャット管理（WebSocket対応）
    this.tables.liveChat = new dynamodb.TableV2(this, 'LiveChatTable', {
      tableName: `LIVE_CHAT${tableSuffix}`,

      // PK: stream_id
      // SK: chat_id (ULID)
      partitionKey: { name: 'stream_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'chat_id', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,
      timeToLiveAttribute: 'ttl', // 配信終了7日後に削除

      globalSecondaryIndexes: [
        {
          // GSI1: ユーザーのチャット履歴（スパム検出用）
          indexName: 'GSI_user_chat_history',
          partitionKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 22. LIVE_GIFT テーブル (GSI: 3, TTL: 30日)
    // =====================================================
    // ライブギフト管理（将来の収益化用）
    this.tables.liveGift = new dynamodb.TableV2(this, 'LiveGiftTable', {
      tableName: `LIVE_GIFT${tableSuffix}`,

      // PK: gift_id (ULID)
      // SK: created_at
      partitionKey: { name: 'gift_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },

      ...commonTableProps,
      timeToLiveAttribute: 'ttl', // 配信終了30日後に削除

      globalSecondaryIndexes: [
        {
          // GSI1: 配信のギフト一覧
          indexName: 'GSI_stream_gifts',
          partitionKey: { name: 'stream_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI2: 送信者のギフト履歴
          indexName: 'GSI_sender_gifts',
          partitionKey: { name: 'from_account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI3: 受信者のギフト履歴
          indexName: 'GSI_receiver_gifts',
          partitionKey: { name: 'to_account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 23. PRODUCT テーブル (GSI: 3, TTL: 90日)
    // =====================================================
    // 商品管理
    // sale_price追加（過去の会話で決定）
    this.tables.product = new dynamodb.TableV2(this, 'ProductTable', {
      tableName: `PRODUCT${tableSuffix}`,

      // PK: product_id (ULID)
      // SK: created_at
      partitionKey: { name: 'product_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },

      ...commonTableProps,
      timeToLiveAttribute: 'ttl', // 削除後90日で物理削除

      globalSecondaryIndexes: [
        {
          // GSI1: 出品者の商品一覧
          indexName: 'GSI_seller_products',
          partitionKey: { name: 'seller_account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI2: カテゴリー別商品一覧
          indexName: 'GSI_category_products',
          partitionKey: { name: 'category', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI3: ステータス別商品一覧
          indexName: 'GSI_status_products',
          partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 24. PRODUCT_TAG テーブル (GSI: 2)
    // =====================================================
    // 投稿への商品タグ付け
    this.tables.productTag = new dynamodb.TableV2(this, 'ProductTagTable', {
      tableName: `PRODUCT_TAG${tableSuffix}`,

      // PK: post_id
      // SK: product_id
      partitionKey: { name: 'post_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'product_id', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,

      globalSecondaryIndexes: [
        {
          // GSI1: 商品がタグ付けされた投稿一覧
          indexName: 'GSI_product_posts',
          partitionKey: { name: 'product_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'tagged_at', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI2: ユーザーのタグ付け履歴
          indexName: 'GSI_user_tags',
          partitionKey: { name: 'tagged_by_account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'tagged_at', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 25. CONVERSATION テーブル (GSI: 2)
    // =====================================================
    // DM会話管理
    this.tables.conversation = new dynamodb.TableV2(this, 'ConversationTable', {
      tableName: `CONVERSATION${tableSuffix}`,

      // PK: conversation_id (ULID)
      // SK: created_at
      partitionKey: { name: 'conversation_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },

      ...commonTableProps,

      globalSecondaryIndexes: [
        {
          // GSI1: 参加者1の会話一覧
          indexName: 'GSI_participant1_conversations',
          partitionKey: { name: 'participant_1_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'last_message_at', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI2: 参加者2の会話一覧
          indexName: 'GSI_participant2_conversations',
          partitionKey: { name: 'participant_2_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'last_message_at', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 26. MESSAGE テーブル (GSI: 1, TTL: 90日)
    // =====================================================
    // DMメッセージ管理
    this.tables.message = new dynamodb.TableV2(this, 'MessageTable', {
      tableName: `MESSAGE${tableSuffix}`,

      // PK: conversation_id
      // SK: message_id (ULID)
      partitionKey: { name: 'conversation_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'message_id', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,
      timeToLiveAttribute: 'ttl', // 会話削除後90日で物理削除

      globalSecondaryIndexes: [
        {
          // GSI1: 送信者のメッセージ履歴
          indexName: 'GSI_sender_messages',
          partitionKey: { name: 'sender_account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 27. ANALYTICS テーブル (GSI: 3, TTL: 90日)
    // =====================================================
    // アクセス解析データ
    this.tables.analytics = new dynamodb.TableV2(this, 'AnalyticsTable', {
      tableName: `ANALYTICS${tableSuffix}`,

      // PK: date (YYYY-MM-DD)
      // SK: event_id (ULID)
      partitionKey: { name: 'date', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'event_id', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,
      timeToLiveAttribute: 'ttl', // 90日後に削除

      globalSecondaryIndexes: [
        {
          // GSI1: ユーザーのイベント履歴
          indexName: 'GSI_user_events',
          partitionKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI2: イベントタイプ別集計
          indexName: 'GSI_event_type',
          partitionKey: { name: 'event_type', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI3: 対象別イベント（target_idはFilterExpressionで絞り込む）
          indexName: 'GSI_target_events',
          partitionKey: { name: 'target_type', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 28. CONNECTIONS テーブル (TTL: 24時間)
    // =====================================================
    // WebSocket接続管理
    this.tables.connections = new dynamodb.TableV2(this, 'ConnectionsTable', {
      tableName: `CONNECTIONS${tableSuffix}`,

      // PK: connection_id (API Gateway接続ID)
      // SK: account_id
      partitionKey: { name: 'connection_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,
      timeToLiveAttribute: 'ttl', // 24時間後に削除

      globalSecondaryIndexes: [
        {
          // GSI1: アカウントの接続一覧
          indexName: 'GSI_account_connections',
          partitionKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'connected_at', type: dynamodb.AttributeType.NUMBER },
        },
        {
          // GSI2: ライブ配信ごとの接続者一覧
          indexName: 'GSI_live_connections',
          partitionKey: { name: 'stream_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'connected_at', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 29. USER_BEHAVIOR テーブル (GSI: 1, TTL: 30日)
    // =====================================================
    // ユーザー行動履歴（推薦アルゴリズム用）
    // いいね、コメント、閲覧、フォロー、商品クリック等を記録
    this.tables.userBehavior = new dynamodb.TableV2(this, 'UserBehaviorTable', {
      tableName: `USER_BEHAVIOR${tableSuffix}`,

      // PK: account_id
      // SK: behavior_id (timestamp + type)
      partitionKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'behavior_id', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,
      timeToLiveAttribute: 'ttl', // 30日後に自動削除

      globalSecondaryIndexes: [
        {
          // GSI1: 特定コンテンツへの反応を取得
          // target_id (PK) + timestamp (SK)
          indexName: 'GSI1_TargetBehaviors',
          partitionKey: { name: 'target_id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
        },
      ],
    });

    // =====================================================
    // 30. RECOMMENDATION_CACHE テーブル (TTL: 1時間)
    // =====================================================
    // 推薦結果のキャッシュ（パフォーマンス最適化）
    this.tables.recommendationCache = new dynamodb.TableV2(this, 'RecommendationCacheTable', {
      tableName: `RECOMMENDATION_CACHE${tableSuffix}`,

      // PK: account_id
      // SK: recommendation_type (timeline, room, product, user, hashtag)
      partitionKey: { name: 'account_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'recommendation_type', type: dynamodb.AttributeType.STRING },

      ...commonTableProps,
      timeToLiveAttribute: 'expires_at', // 1時間後に自動削除
    });

    // =====================================================
    // 全30テーブル作成完了
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
