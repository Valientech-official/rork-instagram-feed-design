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
exports.DynamoDBStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
class DynamoDBStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        // 全28テーブル作成完了
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
exports.DynamoDBStack = DynamoDBStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1vZGItc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvZHluYW1vZGItc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLG1FQUFxRDtBQVFyRCxNQUFhLGFBQWMsU0FBUSxHQUFHLENBQUMsS0FBSztJQUcxQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXlCO1FBQ2pFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBRWpCLE1BQU0sRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBQzdDLE1BQU0sV0FBVyxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7UUFFdEMsT0FBTztRQUNQLE1BQU0sZ0JBQWdCLEdBQUc7WUFDdkIsT0FBTyxFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFO1lBQ3BDLFVBQVUsRUFBRSxRQUFRLENBQUMsaUJBQWlCLENBQUMsYUFBYSxFQUFFO1lBQ3RELGFBQWEsRUFBRSxhQUFhO1lBQzVCLGdDQUFnQyxFQUFFO2dCQUNoQywwQkFBMEIsRUFBRSxXQUFXLEtBQUssTUFBTSxFQUFFLGFBQWE7YUFDbEU7U0FDRixDQUFDO1FBRUYsd0RBQXdEO1FBQ3hELDJCQUEyQjtRQUMzQix3REFBd0Q7UUFDeEQscUJBQXFCO1FBQ3JCLDhCQUE4QjtRQUM5QixzREFBc0Q7UUFDdEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDL0QsU0FBUyxFQUFFLFVBQVUsV0FBVyxFQUFFO1lBRWxDLFVBQVU7WUFDViwyQkFBMkI7WUFDM0Isc0JBQXNCO1lBQ3RCLFlBQVksRUFB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QUVILHdEQUF3RDtRQUN4RCxjQUFjO1FBQ2Qsd0RBQXdEO1FBRXhELHdEQUF3RDtRQUN4RCx5QkFBeUI7UUFDekIsd0RBQXdEO1FBQ3hELE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUU7WUFDcEQsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksV0FBVyxFQUFFO2dCQUMxQyxLQUFLLEVBQUUsS0FBSyxDQUFDLFNBQVM7Z0JBQ3RCLFdBQVcsRUFBRSxHQUFHLElBQUksYUFBYTtnQkFDakMsVUFBVSxFQUFFLFlBQVksSUFBSSxjQUFjLFdBQVcsRUFBRTthQUN4RCxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXoyQkQsc0NBeTJCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XHJcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xyXG5cclxuaW50ZXJmYWNlIER5bmFtb0RCU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcclxuICBlbnZpcm9ubWVudDogJ2RldicgfCAncHJvZCc7XHJcbiAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3k7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBEeW5hbW9EQlN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcclxuICBwdWJsaWMgcmVhZG9ubHkgdGFibGVzOiB7IFtrZXk6IHN0cmluZ106IGR5bmFtb2RiLlRhYmxlVjIgfTtcclxuXHJcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IER5bmFtb0RCU3RhY2tQcm9wcykge1xyXG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XHJcblxyXG4gICAgdGhpcy50YWJsZXMgPSB7fTtcclxuXHJcbiAgICBjb25zdCB7IGVudmlyb25tZW50LCByZW1vdmFsUG9saWN5IH0gPSBwcm9wcztcclxuICAgIGNvbnN0IHRhYmxlU3VmZml4ID0gYC0ke2Vudmlyb25tZW50fWA7XHJcblxyXG4gICAgLy8g5YWx6YCa6Kit5a6aXHJcbiAgICBjb25zdCBjb21tb25UYWJsZVByb3BzID0ge1xyXG4gICAgICBiaWxsaW5nOiBkeW5hbW9kYi5CaWxsaW5nLm9uRGVtYW5kKCksXHJcbiAgICAgIGVuY3J5cHRpb246IGR5bmFtb2RiLlRhYmxlRW5jcnlwdGlvblYyLmF3c01hbmFnZWRLZXkoKSxcclxuICAgICAgcmVtb3ZhbFBvbGljeTogcmVtb3ZhbFBvbGljeSxcclxuICAgICAgcG9pbnRJblRpbWVSZWNvdmVyeVNwZWNpZmljYXRpb246IHtcclxuICAgICAgICBwb2ludEluVGltZVJlY292ZXJ5RW5hYmxlZDogZW52aXJvbm1lbnQgPT09ICdwcm9kJywgLy8g5pys55Wq44Gu44G/UElUUuacieWKuVxyXG4gICAgICB9LFxyXG4gICAgfTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gMS4gQUNDT1VOVCDjg4bjg7zjg5bjg6sgKEdTSTogMylcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyDoqo3oqLzjg7vjg5fjg63jg5XjgqPjg7zjg6vnrqHnkIbjga7kuK3lv4Pjg4bjg7zjg5bjg6tcclxuICAgIC8vIDHpm7voqbHnlarlj7fjgYLjgZ/jgooz44Ki44Kr44Km44Oz44OI44G+44Gn77yI44Ki44OX44Oq5YG044Gn44OB44Kn44OD44Kv77yJXHJcbiAgICAvLyBhY2NvdW50X3R5cGU6IHBlcnNvbmFsL2J1c2luZXNzL3Nob3AvdmVyaWZpZWQvYWRtaW5cclxuICAgIHRoaXMudGFibGVzLmFjY291bnQgPSBuZXcgZHluYW1vZGIuVGFibGVWMih0aGlzLCAnQWNjb3VudFRhYmxlJywge1xyXG4gICAgICB0YWJsZU5hbWU6IGBBQ0NPVU5UJHt0YWJsZVN1ZmZpeH1gLFxyXG5cclxuICAgICAgLy8g44OX44Op44Kk44Oe44Oq44Kt44O8XHJcbiAgICAgIC8vIFBLOiBcIkFDQ09VTlQjYWNjb3VudF9pZFwiXHJcbiAgICAgIC8vIFNLOiBcIlBST0ZJTEVcIiAo5Zu65a6a5YCkKVxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ1BLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnU0snLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG5cclxuICAgICAgLi4uY29tbW9uVGFibGVQcm9wcyxcclxuXHJcbiAgICAgIGdsb2JhbFNlY29uZGFyeUluZGV4ZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kxOiDjg6Hjg7zjg6vjgqLjg4njg6zjgrnjgafjg63jgrDjgqTjg7NcclxuICAgICAgICAgIC8vIEdTSTFQSzogXCJFTUFJTCNlbWFpbFwiXHJcbiAgICAgICAgICAvLyBHU0kxU0s6IFwiQUNDT1VOVFwiICjlm7rlrprlgKQpXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0kxX0VtYWlsTG9naW4nLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdHU0kxUEsnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnR1NJMVNLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTI6IOODj+ODs+ODieODq+aknOe0oueUqFxyXG4gICAgICAgICAgLy8gR1NJMlBLOiBcIkhBTkRMRSNoYW5kbGVcIlxyXG4gICAgICAgICAgLy8gR1NJMlNLOiBcIkFDQ09VTlRcIiAo5Zu65a6a5YCkKVxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJMl9IYW5kbGVTZWFyY2gnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdHU0kyUEsnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnR1NJMlNLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTM6IOmbu+ipseeVquWPt+OBp+e0kOOBpeOBj+OCouOCq+OCpuODs+ODiOOCkueuoeeQhuOBmeOCi+OBn+OCgeOBruOCpOODs+ODh+ODg+OCr+OCuVxyXG4gICAgICAgICAgLy8gR1NJM1BLOiBcIlBIT05FI3Bob25lX251bWJlclwiXHJcbiAgICAgICAgICAvLyBHU0kzU0s6IFwiQ1JFQVRFRCNjcmVhdGVkX2F0XCJcclxuICAgICAgICAgIC8vIOeUqOmAlDogMembu+ipseeVquWPt+OBguOBn+OCijPjgqLjgqvjgqbjg7Pjg4jliLbpmZDjga7jg4Hjgqfjg4Pjgq9cclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSTNfUGhvbmVNYW5hZ2VtZW50JyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnR1NJM1BLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ0dTSTNTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAyLiBTRVNTSU9OIOODhuODvOODluODqyAoR1NJOiAxLCBUVEw6IDMw5pelKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIOOCouOCq+OCpuODs+ODiOWIh+OCiuabv+OBiOeUqOOCu+ODg+OCt+ODp+ODs+euoeeQhlxyXG4gICAgLy8gVFRM44GnMzDml6Xlvozoh6rli5XliYrpmaTjgIHlkIzmmYLjg63jgrDjgqTjg7PnhKHliLbpmZBcclxuICAgIHRoaXMudGFibGVzLnNlc3Npb24gPSBuZXcgZHluYW1vZGIuVGFibGVWMih0aGlzLCAnU2Vzc2lvblRhYmxlJywge1xyXG4gICAgICB0YWJsZU5hbWU6IGBTRVNTSU9OJHt0YWJsZVN1ZmZpeH1gLFxyXG5cclxuICAgICAgLy8gUEs6IFwiU0VTU0lPTiNhY2NvdW50X2lkXCJcclxuICAgICAgLy8gU0s6IFwiREVWSUNFI2RldmljZV9pZFwiXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnUEsnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcblxyXG4gICAgICAuLi5jb21tb25UYWJsZVByb3BzLFxyXG4gICAgICB0aW1lVG9MaXZlQXR0cmlidXRlOiAndHRsJywgLy8gMzDml6XlvozliYrpmaRcclxuXHJcbiAgICAgIGdsb2JhbFNlY29uZGFyeUluZGV4ZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kxOiDjgqLjgqvjgqbjg7Pjg4jjga7jgrvjg4Pjgrfjg6fjg7PkuIDopqdcclxuICAgICAgICAgIC8vIEdTSTFQSzogXCJBQ0NPVU5UX1NFU1NJT05TI2FjY291bnRfaWRcIlxyXG4gICAgICAgICAgLy8gR1NJMVNLOiBcIkNSRUFURUQjY3JlYXRlZF9hdFwiXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0kxX0FjY291bnRTZXNzaW9ucycsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ0dTSTFQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdHU0kxU0snLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gMy4gUE9TVCDjg4bjg7zjg5bjg6sgKEdTSTogNCwgVFRMOiA5MOaXpSlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyDmipXnqL/jg4fjg7zjgr/nrqHnkIZcclxuICAgIC8vIGhhc2h0YWdzOiBTdHJpbmcgU2V0IChTUynjgIFyZXBvc3RfY291bnTov73liqBcclxuICAgIC8vIFJPT03mipXnqL/vvJrpgJrluLjjgr/jgqTjg6Djg6njgqTjg7MgKyBST09N44K/44Kk44Og44Op44Kk44Oz5Lih5pa544Gr6KGo56S6XHJcbiAgICB0aGlzLnRhYmxlcy5wb3N0ID0gbmV3IGR5bmFtb2RiLlRhYmxlVjIodGhpcywgJ1Bvc3RUYWJsZScsIHtcclxuICAgICAgdGFibGVOYW1lOiBgUE9TVCR7dGFibGVTdWZmaXh9YCxcclxuXHJcbiAgICAgIC8vIFBLOiBwb3N0SWQgKFVMSUQpXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAncG9zdElkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuXHJcbiAgICAgIC4uLmNvbW1vblRhYmxlUHJvcHMsXHJcbiAgICAgIHRpbWVUb0xpdmVBdHRyaWJ1dGU6ICd0dGwnLCAvLyDliYrpmaTjgYvjgok5MOaXpeW+jOOBq+eJqeeQhuWJiumZpFxyXG5cclxuICAgICAgZ2xvYmFsU2Vjb25kYXJ5SW5kZXhlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTE6IOOCv+OCpOODoOODqeOCpOODs+WPluW+l+eUqO+8iOeJueWumuODpuODvOOCtuODvOOBruaKleeov+OCkuaZguezu+WIl+OBp+WPluW+l++8iVxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJMScsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2FjY291bnRJZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkQXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMjog55m66KaL44K/44OW55So77yI44OR44OW44Oq44OD44Kv5oqV56i/44Gu5LiA6Kan5Y+W5b6X77yJXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0kyJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAndmlzaWJpbGl0eScsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkQXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMzog44Or44O844Og5YaF5oqV56i/5LiA6Kan5Y+W5b6X55SoXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0kzJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAncm9vbV9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkQXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJNDog5oqV56i/44K/44Kk44OX5Yil5LiA6Kan77yIbm9ybWFsL3dhdmXvvIlcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV9Qb3N0VHlwZV9DcmVhdGVkQXQnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdwb3N0X3R5cGUnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZEF0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIDQuIEhBU0hUQUdfSU5ERVgg44OG44O844OW44OrIChHU0k6IDApXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8g44OP44OD44K344Ol44K/44Kw5qSc57Si55SoXHJcbiAgICB0aGlzLnRhYmxlcy5oYXNodGFnSW5kZXggPSBuZXcgZHluYW1vZGIuVGFibGVWMih0aGlzLCAnSGFzaHRhZ0luZGV4VGFibGUnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogYEhBU0hUQUdfSU5ERVgke3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyBQSzogaGFzaHRhZyAo5bCP5paH5a2X5YyW5riI44G/KVxyXG4gICAgICAvLyBTSzogcG9zdElkXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnaGFzaHRhZycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ3Bvc3RJZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcblxyXG4gICAgICAuLi5jb21tb25UYWJsZVByb3BzLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIDUuIEhBU0hUQUdfQ09VTlQg44OG44O844OW44OrIChHU0k6IDEsIFRUTDogMzDml6UpXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8g44OI44Os44Oz44OJ44OP44OD44K344Ol44K/44Kw6ZuG6KiI55SoXHJcbiAgICB0aGlzLnRhYmxlcy5oYXNodGFnQ291bnQgPSBuZXcgZHluYW1vZGIuVGFibGVWMih0aGlzLCAnSGFzaHRhZ0NvdW50VGFibGUnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogYEhBU0hUQUdfQ09VTlQke3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyBQSzogaGFzaHRhZ1xyXG4gICAgICAvLyBTSzogcGVyaW9kIChkYWlseV8yMDI1LTEwLTE0IC8gd2Vla2x5XzIwMjUtVzQyIC8gYWxsX3RpbWUpXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnaGFzaHRhZycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ3BlcmlvZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcblxyXG4gICAgICAuLi5jb21tb25UYWJsZVByb3BzLFxyXG4gICAgICB0aW1lVG9MaXZlQXR0cmlidXRlOiAndHRsJywgLy8gMzDml6XlvozliYrpmaRcclxuXHJcbiAgICAgIGdsb2JhbFNlY29uZGFyeUluZGV4ZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kxOiDjg6njg7Pjgq3jg7PjgrDlj5blvpfnlKjvvIjmnJ/plpPjgZTjgajjga7kurrmsJfjg4/jg4Pjgrfjg6Xjgr/jgrBUT1AxMO+8iVxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJMScsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3BlcmlvZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjb3VudCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyA2LiBGT0xMT1cg44OG44O844OW44OrIChHU0k6IDIpXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8g44OV44Kp44Ot44O8L+ODleOCqeODreODr+ODvOmWouS/gueuoeeQhlxyXG4gICAgdGhpcy50YWJsZXMuZm9sbG93ID0gbmV3IGR5bmFtb2RiLlRhYmxlVjIodGhpcywgJ0ZvbGxvd1RhYmxlJywge1xyXG4gICAgICB0YWJsZU5hbWU6IGBGT0xMT1cke3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyBQSzogZm9sbG93ZXJfaWQgKOODleOCqeODreODvOOBmeOCi+WBtClcclxuICAgICAgLy8gU0s6IGZvbGxvd2luZ19pZCAo44OV44Kp44Ot44O844GV44KM44KL5YG0KVxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2ZvbGxvd2VyX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnZm9sbG93aW5nX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuXHJcbiAgICAgIC4uLmNvbW1vblRhYmxlUHJvcHMsXHJcblxyXG4gICAgICBnbG9iYWxTZWNvbmRhcnlJbmRleGVzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMTog44OV44Kp44Ot44O85Lit5LiA6Kan5Y+W5b6X55SoXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0kxJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnZm9sbG93ZXJfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kyOiDjg5Xjgqnjg63jg6/jg7zkuIDopqflj5blvpfnlKhcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSTInLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdmb2xsb3dpbmdfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyA3LiBMSUtFIOODhuODvOODluODqyAoR1NJOiAxKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIOaKleeov+OBuOOBruOBhOOBhOOBreeuoeeQhlxyXG4gICAgLy8gQ29uZGl0aW9uRXhwcmVzc2lvbuOBp+mHjeikh+mYsuatolxyXG4gICAgdGhpcy50YWJsZXMubGlrZSA9IG5ldyBkeW5hbW9kYi5UYWJsZVYyKHRoaXMsICdMaWtlVGFibGUnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogYExJS0Uke3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyBQSzogcG9zdF9pZFxyXG4gICAgICAvLyBTSzogYWNjb3VudF9pZFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3Bvc3RfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdhY2NvdW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuXHJcbiAgICAgIC4uLmNvbW1vblRhYmxlUHJvcHMsXHJcblxyXG4gICAgICBnbG9iYWxTZWNvbmRhcnlJbmRleGVzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMTog44Om44O844K244O844GM44GE44GE44Gt44GX44Gf5oqV56i/5LiA6KanXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0kxJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIDguIENPTU1FTlQg44OG44O844OW44OrIChHU0k6IDIsIFRUTDogOTDml6UpXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8g5oqV56i/44G444Gu44Kz44Oh44Oz44OI566h55CG77yI44OP44Kk44OW44Oq44OD44OJ5YmK6Zmk5pa55byP77yJXHJcbiAgICAvLyDjg6bjg7zjgrbjg7zliYrpmaQ6IOWNs+aZgueJqeeQhuWJiumZpFxyXG4gICAgLy8g6YGL5Za25YmK6ZmkOiDoq5bnkIbliYrpmaTvvIhpc19kZWxldGVkPXRydWXjgIE5MOaXpVRUTO+8iVxyXG4gICAgdGhpcy50YWJsZXMuY29tbWVudCA9IG5ldyBkeW5hbW9kYi5UYWJsZVYyKHRoaXMsICdDb21tZW50VGFibGUnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogYENPTU1FTlQke3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyBQSzogY29tbWVudF9pZCAoVUxJRClcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdjb21tZW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuXHJcbiAgICAgIC4uLmNvbW1vblRhYmxlUHJvcHMsXHJcbiAgICAgIHRpbWVUb0xpdmVBdHRyaWJ1dGU6ICd0dGwnLCAvLyDpgYvllrbliYrpmaTjgYvjgok5MOaXpeW+jOOBq+eJqeeQhuWJiumZpFxyXG5cclxuICAgICAgZ2xvYmFsU2Vjb25kYXJ5SW5kZXhlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTE6IOaKleeov+OBruOCs+ODoeODs+ODiOS4gOimp+WPluW+l+eUqO+8iOWPpOOBhOmghu+8iVxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJMScsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3Bvc3RfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kyOiDjg6bjg7zjgrbjg7zjga7jgrPjg6Hjg7Pjg4jkuIDopqflj5blvpfnlKjvvIjmlrDjgZfjgYTpoIbvvIlcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSTInLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdhY2NvdW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2NyZWF0ZWRfYXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gOS4gUk9PTSDjg4bjg7zjg5bjg6sgKEdTSTogMilcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyDjgrjjg6Pjg7Pjg6vliKXjgrPjg5/jg6Xjg4vjg4bjgqPnqbrplpNcclxuICAgIHRoaXMudGFibGVzLnJvb20gPSBuZXcgZHluYW1vZGIuVGFibGVWMih0aGlzLCAnUm9vbVRhYmxlJywge1xyXG4gICAgICB0YWJsZU5hbWU6IGBST09NJHt0YWJsZVN1ZmZpeH1gLFxyXG5cclxuICAgICAgLy8gUEs6IHJvb21faWQgKFVMSUQpXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAncm9vbV9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcblxyXG4gICAgICAuLi5jb21tb25UYWJsZVByb3BzLFxyXG5cclxuICAgICAgZ2xvYmFsU2Vjb25kYXJ5SW5kZXhlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTE6IOOCq+ODhuOCtOODquODvOWIpeS6uuawl+ODq+ODvOODoOWPluW+l+eUqFxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJMScsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2NhdGVnb3J5JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ21lbWJlcl9jb3VudCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kyOiDjg6vjg7zjg6Djg4/jg7Pjg4njg6vmpJzntKLnlKjvvIhVUkw6IC9yb29tL0BoYW5kbGXvvIlcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSTInLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdyb29tX2hhbmRsZScsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAxMC4gUk9PTV9NRU1CRVIg44OG44O844OW44OrIChHU0k6IDEpXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8g44Or44O844Og44Oh44Oz44OQ44O8566h55CGXHJcbiAgICB0aGlzLnRhYmxlcy5yb29tTWVtYmVyID0gbmV3IGR5bmFtb2RiLlRhYmxlVjIodGhpcywgJ1Jvb21NZW1iZXJUYWJsZScsIHtcclxuICAgICAgdGFibGVOYW1lOiBgUk9PTV9NRU1CRVIke3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyBQSzogcm9vbV9pZFxyXG4gICAgICAvLyBTSzogYWNjb3VudF9pZFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3Jvb21faWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdhY2NvdW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuXHJcbiAgICAgIC4uLmNvbW1vblRhYmxlUHJvcHMsXHJcblxyXG4gICAgICBnbG9iYWxTZWNvbmRhcnlJbmRleGVzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMTog44Om44O844K244O844Gu5Y+C5Yqg44Or44O844Og5LiA6Kan5Y+W5b6X55SoXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0kxJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdqb2luZWRfYXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gMTEuIE5PVElGSUNBVElPTiDjg4bjg7zjg5bjg6sgKEdTSTogMiwgVFRMOiA5MOaXpSlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyDjg6bjg7zjgrbjg7zpgJrnn6XnrqHnkIZcclxuICAgIHRoaXMudGFibGVzLm5vdGlmaWNhdGlvbiA9IG5ldyBkeW5hbW9kYi5UYWJsZVYyKHRoaXMsICdOb3RpZmljYXRpb25UYWJsZScsIHtcclxuICAgICAgdGFibGVOYW1lOiBgTk9USUZJQ0FUSU9OJHt0YWJsZVN1ZmZpeH1gLFxyXG5cclxuICAgICAgLy8gUEs6IG5vdGlmaWNhdGlvbl9pZCAoVUxJRClcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdub3RpZmljYXRpb25faWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG5cclxuICAgICAgLi4uY29tbW9uVGFibGVQcm9wcyxcclxuICAgICAgdGltZVRvTGl2ZUF0dHJpYnV0ZTogJ3R0bCcsIC8vIOS9nOaIkOOBi+OCiTkw5pel5b6M44Gr5YmK6ZmkXHJcblxyXG4gICAgICBnbG9iYWxTZWNvbmRhcnlJbmRleGVzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMTog6YCa55+l5LiA6Kan5Y+W5b6X55So77yI5paw44GX44GE6aCG77yJXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0kxJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAncmVjaXBpZW50X2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kyOiDmnKroqq3pgJrnn6Xjg5XjgqPjg6vjgr/nlKjvvIjmnKroqq3jg5Djg4PjgrjooajnpLrvvIlcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSTInLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdyZWNpcGllbnRfYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdpc19yZWFkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIDEyLiBOT1RJRklDQVRJT05fU0VUVElOR1Mg44OG44O844OW44OrIChHU0k6IDApXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8g44OX44OD44K344Ol6YCa55+l6Kit5a6a77yIQVdTIFNOU+WvvuW/nO+8iVxyXG4gICAgdGhpcy50YWJsZXMubm90aWZpY2F0aW9uU2V0dGluZ3MgPSBuZXcgZHluYW1vZGIuVGFibGVWMih0aGlzLCAnTm90aWZpY2F0aW9uU2V0dGluZ3NUYWJsZScsIHtcclxuICAgICAgdGFibGVOYW1lOiBgTk9USUZJQ0FUSU9OX1NFVFRJTkdTJHt0YWJsZVN1ZmZpeH1gLFxyXG5cclxuICAgICAgLy8gUEs6IGFjY291bnRfaWRcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdhY2NvdW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuXHJcbiAgICAgIC4uLmNvbW1vblRhYmxlUHJvcHMsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gMTMuIE1VVEVEX0FDQ09VTlRTIOODhuODvOODluODqyAoR1NJOiAxKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIOWAi+WIpeODpuODvOOCtuODvOODn+ODpeODvOODiFxyXG4gICAgdGhpcy50YWJsZXMubXV0ZWRBY2NvdW50cyA9IG5ldyBkeW5hbW9kYi5UYWJsZVYyKHRoaXMsICdNdXRlZEFjY291bnRzVGFibGUnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogYE1VVEVEX0FDQ09VTlRTJHt0YWJsZVN1ZmZpeH1gLFxyXG5cclxuICAgICAgLy8gUEs6IGFjY291bnRfaWQgKOODn+ODpeODvOODiOioreWumuOCkuOBmeOCi+OCouOCq+OCpuODs+ODiClcclxuICAgICAgLy8gU0s6IG11dGVkX2FjY291bnRfaWQgKOODn+ODpeODvOODiOOBleOCjOOCi+OCouOCq+OCpuODs+ODiClcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdhY2NvdW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnbXV0ZWRfYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcblxyXG4gICAgICAuLi5jb21tb25UYWJsZVByb3BzLFxyXG5cclxuICAgICAgZ2xvYmFsU2Vjb25kYXJ5SW5kZXhlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTE6IOmAhuW8leOBjeeUqO+8iOe1seioiO+8iVxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJMScsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ211dGVkX2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAxNC4gUkVQT1NUIOODhuODvOODluODqyAoR1NJOiAyKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIOaKleeov+OBruOCt+OCp+OCou+8iOODquODneOCueODiO+8ieeuoeeQhlxyXG4gICAgdGhpcy50YWJsZXMucmVwb3N0ID0gbmV3IGR5bmFtb2RiLlRhYmxlVjIodGhpcywgJ1JlcG9zdFRhYmxlJywge1xyXG4gICAgICB0YWJsZU5hbWU6IGBSRVBPU1Qke3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyBQSzogcmVwb3N0X2lkIChVTElEKVxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3JlcG9zdF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcblxyXG4gICAgICAuLi5jb21tb25UYWJsZVByb3BzLFxyXG5cclxuICAgICAgZ2xvYmFsU2Vjb25kYXJ5SW5kZXhlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTE6IOODpuODvOOCtuODvOOBruODquODneOCueODiOS4gOimp+WPluW+l+eUqO+8iOaWsOOBl+OBhOmghu+8iVxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJMScsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kyOiDmipXnqL/jga7jg6rjg53jgrnjg4jkuIDopqflj5blvpfnlKjvvIjoqrDjgYzjg6rjg53jgrnjg4jjgZfjgZ/jgYvvvIlcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSTInLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdvcmlnaW5hbF9wb3N0X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2NyZWF0ZWRfYXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gMTUuIEJMT0NLIOODhuODvOODluODqyAoR1NJOiAxKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIOODluODreODg+OCr+euoeeQhlxyXG4gICAgdGhpcy50YWJsZXMuYmxvY2sgPSBuZXcgZHluYW1vZGIuVGFibGVWMih0aGlzLCAnQmxvY2tUYWJsZScsIHtcclxuICAgICAgdGFibGVOYW1lOiBgQkxPQ0ske3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyBQSzogYmxvY2tlcl9hY2NvdW50X2lkICjjg5bjg63jg4Pjgq/jgZfjgZ/kuropXHJcbiAgICAgIC8vIFNLOiBibG9ja2VkX2FjY291bnRfaWQgKOODluODreODg+OCr+OBleOCjOOBn+S6uilcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdibG9ja2VyX2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdibG9ja2VkX2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG5cclxuICAgICAgLi4uY29tbW9uVGFibGVQcm9wcyxcclxuXHJcbiAgICAgIGdsb2JhbFNlY29uZGFyeUluZGV4ZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kxOiDpgIblvJXjgY3nlKhcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV9ibG9ja2VkX2J5JyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnYmxvY2tlZF9hY2NvdW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2Jsb2NrZWRfYXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gMTYuIFJFUE9SVCDjg4bjg7zjg5bjg6sgKEdTSTogNCwgVFRMOiAxODDml6UpXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8g6YCa5aCx566h55CGXHJcbiAgICB0aGlzLnRhYmxlcy5yZXBvcnQgPSBuZXcgZHluYW1vZGIuVGFibGVWMih0aGlzLCAnUmVwb3J0VGFibGUnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogYFJFUE9SVCR7dGFibGVTdWZmaXh9YCxcclxuXHJcbiAgICAgIC8vIFBLOiByZXBvcnRfaWQgKFVMSUQpXHJcbiAgICAgIC8vIFNLOiBjcmVhdGVkX2F0XHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAncmVwb3J0X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcblxyXG4gICAgICAuLi5jb21tb25UYWJsZVByb3BzLFxyXG4gICAgICB0aW1lVG9MaXZlQXR0cmlidXRlOiAndHRsJywgLy8g5a++5b+c5a6M5LqG5b6MMTgw5pel44Gn5YmK6ZmkXHJcblxyXG4gICAgICBnbG9iYWxTZWNvbmRhcnlJbmRleGVzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMTog44K544OG44O844K/44K55Yil44Os44Od44O844OIXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0lfc3RhdHVzX3JlcG9ydHMnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdzdGF0dXMnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kyOiDlr77osaHjgr/jgqTjg5fliKXjg6zjg53jg7zjg4jvvIjmmYLns7vliJfvvIlcclxuICAgICAgICAgIC8vIHRhcmdldF9pZOOBr0ZpbHRlckV4cHJlc3Npb27jgafntZ7jgorovrzjgoBcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV90YXJnZXRfcmVwb3J0cycsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3RhcmdldF90eXBlJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2NyZWF0ZWRfYXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMzog6YCa5aCx6ICF5bGl5q20XHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0lfcmVwb3J0ZXJfaGlzdG9yeScsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3JlcG9ydGVyX2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0k0OiDpgJrloLHjgZXjgozjgZ/jg6bjg7zjgrbjg7xcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV9yZXBvcnRlZF91c2VyJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAndGFyZ2V0X2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAxNy4gTElWRV9TVFJFQU0g44OG44O844OW44OrIChHU0k6IDQsIFRUTDogMzDml6UpXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8g44Op44Kk44OW6YWN5L+h566h55CGXHJcbiAgICAvLyB2aWV3ZXJfY291bnTkvb/nlKjvvIjjg5njgrnjg4jjg5fjg6njgq/jg4bjgqPjgrnvvIlcclxuICAgIHRoaXMudGFibGVzLmxpdmVTdHJlYW0gPSBuZXcgZHluYW1vZGIuVGFibGVWMih0aGlzLCAnTGl2ZVN0cmVhbVRhYmxlJywge1xyXG4gICAgICB0YWJsZU5hbWU6IGBMSVZFX1NUUkVBTSR7dGFibGVTdWZmaXh9YCxcclxuXHJcbiAgICAgIC8vIFBLOiBzdHJlYW1faWQgKFVMSUQpXHJcbiAgICAgIC8vIFNLOiBjcmVhdGVkX2F0XHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnc3RyZWFtX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcblxyXG4gICAgICAuLi5jb21tb25UYWJsZVByb3BzLFxyXG4gICAgICB0aW1lVG9MaXZlQXR0cmlidXRlOiAndHRsJywgLy8gMzDml6XlvozliYrpmaTvvIjjgqLjg7zjgqvjgqTjg5bmnJ/plpPvvIlcclxuXHJcbiAgICAgIGdsb2JhbFNlY29uZGFyeUluZGV4ZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kxOiDjg6vjg7zjg6Djga7phY3kv6HkuIDopqdcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV9yb29tX2xpdmVzJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAncm9vbV9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdzdGFydGVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTI6IOOCouOCq+OCpuODs+ODiOOBrumFjeS/oeWxpeattFxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJX2FjY291bnRfbGl2ZXMnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdhY2NvdW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ3N0YXJ0ZWRfYXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMzog44Ki44Kv44OG44Kj44OW6YWN5L+h5LiA6KanXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0lfYWN0aXZlX2xpdmVzJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnc3RhdHVzJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ3N0YXJ0ZWRfYXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJNDogTXV4IFdlYmhvb2vnlKjvvIhtdXhfbGl2ZV9zdHJlYW1faWTjgYvjgolzdHJlYW1faWTjgpLmpJzntKLvvIlcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV9tdXhfc3RyZWFtX2xvb2t1cCcsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ211eF9saXZlX3N0cmVhbV9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIDE4LiBMSVZFX1ZJRVdFUiDjg4bjg7zjg5bjg6sgKEdTSTogMiwgVFRMOiA35pelKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIOODqeOCpOODluimluiBtOiAheeuoeeQhu+8iOWxpeattOODu+WIhuaekOWwgueUqO+8iVxyXG4gICAgLy8g44Oq44Ki44Or44K/44Kk44Og44Gu6KaW6IG06ICF5pWw44GvTElWRV9TVFJFQU0udmlld2VyX2NvdW5044KS5L2/55SoXHJcbiAgICB0aGlzLnRhYmxlcy5saXZlVmlld2VyID0gbmV3IGR5bmFtb2RiLlRhYmxlVjIodGhpcywgJ0xpdmVWaWV3ZXJUYWJsZScsIHtcclxuICAgICAgdGFibGVOYW1lOiBgTElWRV9WSUVXRVIke3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyBQSzogdmlld2VyX2tleSAoc3RyZWFtX2lkI2FjY291bnRfaWQpXHJcbiAgICAgIC8vIFNLOiBqb2luZWRfYXRcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICd2aWV3ZXJfa2V5JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnam9pbmVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuXHJcbiAgICAgIC4uLmNvbW1vblRhYmxlUHJvcHMsXHJcbiAgICAgIHRpbWVUb0xpdmVBdHRyaWJ1dGU6ICd0dGwnLCAvLyDphY3kv6HntYLkuoY35pel5b6M44Gr5YmK6ZmkXHJcblxyXG4gICAgICBnbG9iYWxTZWNvbmRhcnlJbmRleGVzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMTog6YWN5L+h44Gu6KaW6IG06ICF5LiA6Kan77yIaXNfYWN0aXZlPXRydWXjgafjg5XjgqPjg6vjgr/vvIlcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV9zdHJlYW1fdmlld2VycycsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3N0cmVhbV9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdsYXN0X3BpbmdfYXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMjog44Om44O844K244O844Gu6KaW6IG05bGl5q20XHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0lfdXNlcl93YXRjaF9oaXN0b3J5JyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdqb2luZWRfYXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gMTkuIExJVkVfTU9ERVJBVE9SIOODhuODvOODluODqyAoR1NJOiAxKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIOODqeOCpOODlumFjeS/oeODouODh+ODrOODvOOCv+ODvOeuoeeQhlxyXG4gICAgdGhpcy50YWJsZXMubGl2ZU1vZGVyYXRvciA9IG5ldyBkeW5hbW9kYi5UYWJsZVYyKHRoaXMsICdMaXZlTW9kZXJhdG9yVGFibGUnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogYExJVkVfTU9ERVJBVE9SJHt0YWJsZVN1ZmZpeH1gLFxyXG5cclxuICAgICAgLy8gUEs6IHN0cmVhbV9pZFxyXG4gICAgICAvLyBTSzogbW9kZXJhdG9yX2FjY291bnRfaWRcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdzdHJlYW1faWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdtb2RlcmF0b3JfYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcblxyXG4gICAgICAuLi5jb21tb25UYWJsZVByb3BzLFxyXG5cclxuICAgICAgZ2xvYmFsU2Vjb25kYXJ5SW5kZXhlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTE6IOODouODh+ODrOODvOOCv+ODvOOBrumFjeS/oeS4gOimp1xyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJX21vZGVyYXRvcl9zdHJlYW1zJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnbW9kZXJhdG9yX2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnYXNzaWduZWRfYXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gMjAuIE1PREVSQVRPUl9BQ1RJT05fTE9HIOODhuODvOODluODqyAoR1NJOiAyKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIOODouODh+ODrOODvOOCv+ODvOOCouOCr+OCt+ODp+ODs+ODreOCsFxyXG4gICAgdGhpcy50YWJsZXMubW9kZXJhdG9yQWN0aW9uTG9nID0gbmV3IGR5bmFtb2RiLlRhYmxlVjIodGhpcywgJ01vZGVyYXRvckFjdGlvbkxvZ1RhYmxlJywge1xyXG4gICAgICB0YWJsZU5hbWU6IGBNT0RFUkFUT1JfQUNUSU9OX0xPRyR7dGFibGVTdWZmaXh9YCxcclxuXHJcbiAgICAgIC8vIFBLOiBsb2dfaWQgKFVMSUQpXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnbG9nX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuXHJcbiAgICAgIC4uLmNvbW1vblRhYmxlUHJvcHMsXHJcblxyXG4gICAgICBnbG9iYWxTZWNvbmRhcnlJbmRleGVzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMTog6YWN5L+h44Gu44Ki44Kv44K344On44Oz44Ot44KwXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0lfc3RyZWFtX2FjdGlvbnMnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdzdHJlYW1faWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kyOiDjg6Ljg4fjg6zjg7zjgr/jg7zjga7jgqLjgq/jgrfjg6fjg7PlsaXmrbRcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV9tb2RlcmF0b3JfYWN0aW9ucycsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ21vZGVyYXRvcl9hY2NvdW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2NyZWF0ZWRfYXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gMjEuIExJVkVfQ0hBVCDjg4bjg7zjg5bjg6sgKEdTSTogMSwgVFRMOiA35pelKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIOODqeOCpOODluODgeODo+ODg+ODiOeuoeeQhu+8iFdlYlNvY2tldOWvvuW/nO+8iVxyXG4gICAgdGhpcy50YWJsZXMubGl2ZUNoYXQgPSBuZXcgZHluYW1vZGIuVGFibGVWMih0aGlzLCAnTGl2ZUNoYXRUYWJsZScsIHtcclxuICAgICAgdGFibGVOYW1lOiBgTElWRV9DSEFUJHt0YWJsZVN1ZmZpeH1gLFxyXG5cclxuICAgICAgLy8gUEs6IHN0cmVhbV9pZFxyXG4gICAgICAvLyBTSzogY2hhdF9pZCAoVUxJRClcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdzdHJlYW1faWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjaGF0X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuXHJcbiAgICAgIC4uLmNvbW1vblRhYmxlUHJvcHMsXHJcbiAgICAgIHRpbWVUb0xpdmVBdHRyaWJ1dGU6ICd0dGwnLCAvLyDphY3kv6HntYLkuoY35pel5b6M44Gr5YmK6ZmkXHJcblxyXG4gICAgICBnbG9iYWxTZWNvbmRhcnlJbmRleGVzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMTog44Om44O844K244O844Gu44OB44Oj44OD44OI5bGl5q2077yI44K544OR44Og5qSc5Ye655So77yJXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0lfdXNlcl9jaGF0X2hpc3RvcnknLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdhY2NvdW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2NyZWF0ZWRfYXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gMjIuIExJVkVfR0lGVCDjg4bjg7zjg5bjg6sgKEdTSTogMywgVFRMOiAzMOaXpSlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyDjg6njgqTjg5bjgq7jg5Xjg4jnrqHnkIbvvIjlsIbmnaXjga7lj47nm4rljJbnlKjvvIlcclxuICAgIHRoaXMudGFibGVzLmxpdmVHaWZ0ID0gbmV3IGR5bmFtb2RiLlRhYmxlVjIodGhpcywgJ0xpdmVHaWZ0VGFibGUnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogYExJVkVfR0lGVCR7dGFibGVTdWZmaXh9YCxcclxuXHJcbiAgICAgIC8vIFBLOiBnaWZ0X2lkIChVTElEKVxyXG4gICAgICAvLyBTSzogY3JlYXRlZF9hdFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2dpZnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuXHJcbiAgICAgIC4uLmNvbW1vblRhYmxlUHJvcHMsXHJcbiAgICAgIHRpbWVUb0xpdmVBdHRyaWJ1dGU6ICd0dGwnLCAvLyDphY3kv6HntYLkuoYzMOaXpeW+jOOBq+WJiumZpFxyXG5cclxuICAgICAgZ2xvYmFsU2Vjb25kYXJ5SW5kZXhlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTE6IOmFjeS/oeOBruOCruODleODiOS4gOimp1xyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJX3N0cmVhbV9naWZ0cycsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3N0cmVhbV9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTI6IOmAgeS/oeiAheOBruOCruODleODiOWxpeattFxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJX3NlbmRlcl9naWZ0cycsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2Zyb21fYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTM6IOWPl+S/oeiAheOBruOCruODleODiOWxpeattFxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJX3JlY2VpdmVyX2dpZnRzJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAndG9fYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIDIzLiBQUk9EVUNUIOODhuODvOODluODqyAoR1NJOiAzLCBUVEw6IDkw5pelKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIOWVhuWTgeeuoeeQhlxyXG4gICAgLy8gc2FsZV9wcmljZei/veWKoO+8iOmBjuWOu+OBruS8muipseOBp+axuuWumu+8iVxyXG4gICAgdGhpcy50YWJsZXMucHJvZHVjdCA9IG5ldyBkeW5hbW9kYi5UYWJsZVYyKHRoaXMsICdQcm9kdWN0VGFibGUnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogYFBST0RVQ1Qke3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyBQSzogcHJvZHVjdF9pZCAoVUxJRClcclxuICAgICAgLy8gU0s6IGNyZWF0ZWRfYXRcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdwcm9kdWN0X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcblxyXG4gICAgICAuLi5jb21tb25UYWJsZVByb3BzLFxyXG4gICAgICB0aW1lVG9MaXZlQXR0cmlidXRlOiAndHRsJywgLy8g5YmK6Zmk5b6MOTDml6XjgafniannkIbliYrpmaRcclxuXHJcbiAgICAgIGdsb2JhbFNlY29uZGFyeUluZGV4ZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kxOiDlh7rlk4HogIXjga7llYblk4HkuIDopqdcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV9zZWxsZXJfcHJvZHVjdHMnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdzZWxsZXJfYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTI6IOOCq+ODhuOCtOODquODvOWIpeWVhuWTgeS4gOimp1xyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJX2NhdGVnb3J5X3Byb2R1Y3RzJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnY2F0ZWdvcnknLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kzOiDjgrnjg4bjg7zjgr/jgrnliKXllYblk4HkuIDopqdcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV9zdGF0dXNfcHJvZHVjdHMnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdzdGF0dXMnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAyNC4gUFJPRFVDVF9UQUcg44OG44O844OW44OrIChHU0k6IDIpXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8g5oqV56i/44G444Gu5ZWG5ZOB44K/44Kw5LuY44GRXHJcbiAgICB0aGlzLnRhYmxlcy5wcm9kdWN0VGFnID0gbmV3IGR5bmFtb2RiLlRhYmxlVjIodGhpcywgJ1Byb2R1Y3RUYWdUYWJsZScsIHtcclxuICAgICAgdGFibGVOYW1lOiBgUFJPRFVDVF9UQUcke3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyBQSzogcG9zdF9pZFxyXG4gICAgICAvLyBTSzogcHJvZHVjdF9pZFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3Bvc3RfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdwcm9kdWN0X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuXHJcbiAgICAgIC4uLmNvbW1vblRhYmxlUHJvcHMsXHJcblxyXG4gICAgICBnbG9iYWxTZWNvbmRhcnlJbmRleGVzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMTog5ZWG5ZOB44GM44K/44Kw5LuY44GR44GV44KM44Gf5oqV56i/5LiA6KanXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0lfcHJvZHVjdF9wb3N0cycsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3Byb2R1Y3RfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAndGFnZ2VkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTI6IOODpuODvOOCtuODvOOBruOCv+OCsOS7mOOBkeWxpeattFxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJX3VzZXJfdGFncycsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3RhZ2dlZF9ieV9hY2NvdW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ3RhZ2dlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAyNS4gQ09OVkVSU0FUSU9OIOODhuODvOODluODqyAoR1NJOiAyKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIERN5Lya6Kmx566h55CGXHJcbiAgICB0aGlzLnRhYmxlcy5jb252ZXJzYXRpb24gPSBuZXcgZHluYW1vZGIuVGFibGVWMih0aGlzLCAnQ29udmVyc2F0aW9uVGFibGUnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogYENPTlZFUlNBVElPTiR7dGFibGVTdWZmaXh9YCxcclxuXHJcbiAgICAgIC8vIFBLOiBjb252ZXJzYXRpb25faWQgKFVMSUQpXHJcbiAgICAgIC8vIFNLOiBjcmVhdGVkX2F0XHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnY29udmVyc2F0aW9uX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcblxyXG4gICAgICAuLi5jb21tb25UYWJsZVByb3BzLFxyXG5cclxuICAgICAgZ2xvYmFsU2Vjb25kYXJ5SW5kZXhlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTE6IOWPguWKoOiAhTHjga7kvJroqbHkuIDopqdcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV9wYXJ0aWNpcGFudDFfY29udmVyc2F0aW9ucycsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3BhcnRpY2lwYW50XzFfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnbGFzdF9tZXNzYWdlX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTI6IOWPguWKoOiAhTLjga7kvJroqbHkuIDopqdcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV9wYXJ0aWNpcGFudDJfY29udmVyc2F0aW9ucycsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3BhcnRpY2lwYW50XzJfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnbGFzdF9tZXNzYWdlX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIDI2LiBNRVNTQUdFIOODhuODvOODluODqyAoR1NJOiAxLCBUVEw6IDkw5pelKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIERN44Oh44OD44K744O844K4566h55CGXHJcbiAgICB0aGlzLnRhYmxlcy5tZXNzYWdlID0gbmV3IGR5bmFtb2RiLlRhYmxlVjIodGhpcywgJ01lc3NhZ2VUYWJsZScsIHtcclxuICAgICAgdGFibGVOYW1lOiBgTUVTU0FHRSR7dGFibGVTdWZmaXh9YCxcclxuXHJcbiAgICAgIC8vIFBLOiBjb252ZXJzYXRpb25faWRcclxuICAgICAgLy8gU0s6IG1lc3NhZ2VfaWQgKFVMSUQpXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnY29udmVyc2F0aW9uX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnbWVzc2FnZV9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcblxyXG4gICAgICAuLi5jb21tb25UYWJsZVByb3BzLFxyXG4gICAgICB0aW1lVG9MaXZlQXR0cmlidXRlOiAndHRsJywgLy8g5Lya6Kmx5YmK6Zmk5b6MOTDml6XjgafniannkIbliYrpmaRcclxuXHJcbiAgICAgIGdsb2JhbFNlY29uZGFyeUluZGV4ZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kxOiDpgIHkv6HogIXjga7jg6Hjg4Pjgrvjg7zjgrjlsaXmrbRcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV9zZW5kZXJfbWVzc2FnZXMnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdzZW5kZXJfYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIDI3LiBBTkFMWVRJQ1Mg44OG44O844OW44OrIChHU0k6IDMsIFRUTDogOTDml6UpXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8g44Ki44Kv44K744K56Kej5p6Q44OH44O844K/XHJcbiAgICB0aGlzLnRhYmxlcy5hbmFseXRpY3MgPSBuZXcgZHluYW1vZGIuVGFibGVWMih0aGlzLCAnQW5hbHl0aWNzVGFibGUnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogYEFOQUxZVElDUyR7dGFibGVTdWZmaXh9YCxcclxuXHJcbiAgICAgIC8vIFBLOiBkYXRlIChZWVlZLU1NLUREKVxyXG4gICAgICAvLyBTSzogZXZlbnRfaWQgKFVMSUQpXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnZGF0ZScsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2V2ZW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuXHJcbiAgICAgIC4uLmNvbW1vblRhYmxlUHJvcHMsXHJcbiAgICAgIHRpbWVUb0xpdmVBdHRyaWJ1dGU6ICd0dGwnLCAvLyA5MOaXpeW+jOOBq+WJiumZpFxyXG5cclxuICAgICAgZ2xvYmFsU2Vjb25kYXJ5SW5kZXhlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTE6IOODpuODvOOCtuODvOOBruOCpOODmeODs+ODiOWxpeattFxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJX3VzZXJfZXZlbnRzJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICd0aW1lc3RhbXAnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMjog44Kk44OZ44Oz44OI44K/44Kk44OX5Yil6ZuG6KiIXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0lfZXZlbnRfdHlwZScsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2V2ZW50X3R5cGUnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAndGltZXN0YW1wJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTM6IOWvvuixoeWIpeOCpOODmeODs+ODiO+8iHRhcmdldF9pZOOBr0ZpbHRlckV4cHJlc3Npb27jgafntZ7jgorovrzjgoDvvIlcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV90YXJnZXRfZXZlbnRzJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAndGFyZ2V0X3R5cGUnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAndGltZXN0YW1wJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIDI4LiBDT05ORUNUSU9OUyDjg4bjg7zjg5bjg6sgKFRUTDogMjTmmYLplpMpXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gV2ViU29ja2V05o6l57aa566h55CGXHJcbiAgICB0aGlzLnRhYmxlcy5jb25uZWN0aW9ucyA9IG5ldyBkeW5hbW9kYi5UYWJsZVYyKHRoaXMsICdDb25uZWN0aW9uc1RhYmxlJywge1xyXG4gICAgICB0YWJsZU5hbWU6IGBDT05ORUNUSU9OUyR7dGFibGVTdWZmaXh9YCxcclxuXHJcbiAgICAgIC8vIFBLOiBjb25uZWN0aW9uX2lkIChBUEkgR2F0ZXdheeaOpee2mklEKVxyXG4gICAgICAvLyBTSzogYWNjb3VudF9pZFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2Nvbm5lY3Rpb25faWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdhY2NvdW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuXHJcbiAgICAgIC4uLmNvbW1vblRhYmxlUHJvcHMsXHJcbiAgICAgIHRpbWVUb0xpdmVBdHRyaWJ1dGU6ICd0dGwnLCAvLyAyNOaZgumWk+W+jOOBq+WJiumZpFxyXG5cclxuICAgICAgZ2xvYmFsU2Vjb25kYXJ5SW5kZXhlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTE6IOOCouOCq+OCpuODs+ODiOOBruaOpee2muS4gOimp1xyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJX2FjY291bnRfY29ubmVjdGlvbnMnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdhY2NvdW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2Nvbm5lY3RlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kyOiDjg6njgqTjg5bphY3kv6HjgZTjgajjga7mjqXntprogIXkuIDopqdcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV9saXZlX2Nvbm5lY3Rpb25zJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnc3RyZWFtX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2Nvbm5lY3RlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyDlhagyOOODhuODvOODluODq+S9nOaIkOWujOS6hlxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gQ2xvdWRGb3JtYXRpb24gT3V0cHV0c1xyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIE9iamVjdC5lbnRyaWVzKHRoaXMudGFibGVzKS5mb3JFYWNoKChbbmFtZSwgdGFibGVdKSA9PiB7XHJcbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIGAke25hbWV9VGFibGVOYW1lYCwge1xyXG4gICAgICAgIHZhbHVlOiB0YWJsZS50YWJsZU5hbWUsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IGAke25hbWV9IHRhYmxlIG5hbWVgLFxyXG4gICAgICAgIGV4cG9ydE5hbWU6IGBQaWVjZUFwcC0ke25hbWV9LVRhYmxlTmFtZS0ke2Vudmlyb25tZW50fWAsXHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiJdfQ==