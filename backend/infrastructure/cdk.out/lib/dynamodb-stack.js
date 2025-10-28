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
        // 17. LIVE_STREAM テーブル (GSI: 3, TTL: 30日)
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
        // 全27テーブル作成完了
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1vZGItc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvZHluYW1vZGItc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLG1FQUFxRDtBQVFyRCxNQUFhLGFBQWMsU0FBUSxHQUFHLENBQUMsS0FBSztJQUcxQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXlCO1FBQ2pFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBRWpCLE1BQU0sRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBQzdDLE1BQU0sV0FBVyxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7UUFFdEMsT0FBTztRQUNQLE1BQU0sZ0JBQWdCLEdBQUc7WUFDdkIsT0FBTyxFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFO1lBQ3BDLFVBQVUsRUFBRSxRQUFRLENBQUMsaUJBQWlCLENBQUMsYUFBYSxFQUFFO1lBQ3RELGFBQWEsRUFBRSxhQUFhO1lBQzVCLGdDQUFnQyxFQUFFO2dCQUNoQywwQkFBMEIsRUFBRSxXQUFXLEtBQUssTUFBTSxFQUFFLGFBQWE7YUFDbEU7U0FDRixDQUFDO1FBRUYsd0RBQXdEO1FBQ3hELDJCQUEyQjtRQUMzQix3REFBd0Q7UUFDeEQscUJBQXFCO1FBQ3JCLDhCQUE4QjtRQUM5QixzREFBc0Q7UUFDdEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDL0QsU0FBUyxFQUFFLFVBQVUsV0FBVyxFQUFFO1lBRWxDLFVBQVU7WUFDViwyQkFBMkI7WUFDM0Isc0JBQXNCO1lBQ3RCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ2pFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBRTVELEdBQUcsZ0JBQWdCO1lBRW5CLHNCQUFzQixFQUFFO2dCQUN0QjtvQkFDRSxxQkFBcUI7b0JBQ3JCLHdCQUF3QjtvQkFDeEIsMEJBQTBCO29CQUMxQixTQUFTLEVBQUUsaUJBQWlCO29CQUM1QixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDckUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7aUJBQ2pFO2dCQUNEO29CQUNFLGdCQUFnQjtvQkFDaEIsMEJBQTBCO29CQUMxQiwwQkFBMEI7b0JBQzFCLFNBQVMsRUFBRSxtQkFBbUI7b0JBQzlCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO29CQUNyRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtpQkFDakU7Z0JBQ0Q7b0JBQ0Usb0NBQW9DO29CQUNwQywrQkFBK0I7b0JBQy9CLCtCQUErQjtvQkFDL0IsNEJBQTRCO29CQUM1QixTQUFTLEVBQUUsc0JBQXNCO29CQUNqQyxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDckUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7aUJBQ2pFO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCx3REFBd0Q7UUFDeEQscUNBQXFDO1FBQ3JDLHdEQUF3RDtRQUN4RCxvQkFBb0I7UUFDcEIseUJBQXlCO1FBQ3pCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxHQUFHLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQy9ELFNBQVMsRUFBRSxVQUFVLFdBQVcsRUFBRTtZQUVsQywyQkFBMkI7WUFDM0IseUJBQXlCO1lBQ3pCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ2pFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBRTVELEdBQUcsZ0JBQWdCO1lBQ25CLG1CQUFtQixFQUFFLEtBQUssRUFBRSxTQUFTO1lBRXJDLHNCQUFzQixFQUFFO2dCQUN0QjtvQkFDRSxzQkFBc0I7b0JBQ3RCLHdDQUF3QztvQkFDeEMsK0JBQStCO29CQUMvQixTQUFTLEVBQUUsc0JBQXNCO29CQUNqQyxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDckUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7aUJBQ2pFO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCx3REFBd0Q7UUFDeEQsa0NBQWtDO1FBQ2xDLHdEQUF3RDtRQUN4RCxVQUFVO1FBQ1YsMkNBQTJDO1FBQzNDLG9DQUFvQztRQUNwQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUN6RCxTQUFTLEVBQUUsT0FBTyxXQUFXLEVBQUU7WUFFL0Isb0JBQW9CO1lBQ3BCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBRXJFLEdBQUcsZ0JBQWdCO1lBQ25CLG1CQUFtQixFQUFFLEtBQUssRUFBRSxnQkFBZ0I7WUFFNUMsc0JBQXNCLEVBQUU7Z0JBQ3RCO29CQUNFLG9DQUFvQztvQkFDcEMsU0FBUyxFQUFFLE1BQU07b0JBQ2pCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO29CQUN4RSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtpQkFDcEU7Z0JBQ0Q7b0JBQ0UsNEJBQTRCO29CQUM1QixTQUFTLEVBQUUsTUFBTTtvQkFDakIsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQ3pFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO2lCQUNwRTtnQkFDRDtvQkFDRSxvQkFBb0I7b0JBQ3BCLFNBQVMsRUFBRSxNQUFNO29CQUNqQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDdEUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7aUJBQ3BFO2dCQUNEO29CQUNFLDhCQUE4QjtvQkFDOUIsU0FBUyxFQUFFLHdCQUF3QjtvQkFDbkMsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQ3hFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO2lCQUNwRTthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsd0RBQXdEO1FBQ3hELGlDQUFpQztRQUNqQyx3REFBd0Q7UUFDeEQsWUFBWTtRQUNaLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxHQUFHLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7WUFDekUsU0FBUyxFQUFFLGdCQUFnQixXQUFXLEVBQUU7WUFFeEMsdUJBQXVCO1lBQ3ZCLGFBQWE7WUFDYixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUN0RSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUVoRSxHQUFHLGdCQUFnQjtTQUNwQixDQUFDLENBQUM7UUFFSCx3REFBd0Q7UUFDeEQsMkNBQTJDO1FBQzNDLHdEQUF3RDtRQUN4RCxnQkFBZ0I7UUFDaEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEdBQUcsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUN6RSxTQUFTLEVBQUUsZ0JBQWdCLFdBQVcsRUFBRTtZQUV4QyxjQUFjO1lBQ2QsNkRBQTZEO1lBQzdELFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ3RFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBRWhFLEdBQUcsZ0JBQWdCO1lBQ25CLG1CQUFtQixFQUFFLEtBQUssRUFBRSxTQUFTO1lBRXJDLHNCQUFzQixFQUFFO2dCQUN0QjtvQkFDRSxxQ0FBcUM7b0JBQ3JDLFNBQVMsRUFBRSxNQUFNO29CQUNqQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDckUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7aUJBQ2hFO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCx3REFBd0Q7UUFDeEQsMEJBQTBCO1FBQzFCLHdEQUF3RDtRQUN4RCxpQkFBaUI7UUFDakIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDN0QsU0FBUyxFQUFFLFNBQVMsV0FBVyxFQUFFO1lBRWpDLDRCQUE0QjtZQUM1Qiw4QkFBOEI7WUFDOUIsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDMUUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFFdEUsR0FBRyxnQkFBZ0I7WUFFbkIsc0JBQXNCLEVBQUU7Z0JBQ3RCO29CQUNFLG1CQUFtQjtvQkFDbkIsU0FBUyxFQUFFLE1BQU07b0JBQ2pCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO29CQUMxRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtpQkFDckU7Z0JBQ0Q7b0JBQ0UsbUJBQW1CO29CQUNuQixTQUFTLEVBQUUsTUFBTTtvQkFDakIsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQzNFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO2lCQUNyRTthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsd0RBQXdEO1FBQ3hELHdCQUF3QjtRQUN4Qix3REFBd0Q7UUFDeEQsWUFBWTtRQUNaLDJCQUEyQjtRQUMzQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUN6RCxTQUFTLEVBQUUsT0FBTyxXQUFXLEVBQUU7WUFFL0IsY0FBYztZQUNkLGlCQUFpQjtZQUNqQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUN0RSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUVwRSxHQUFHLGdCQUFnQjtZQUVuQixzQkFBc0IsRUFBRTtnQkFDdEI7b0JBQ0UsdUJBQXVCO29CQUN2QixTQUFTLEVBQUUsTUFBTTtvQkFDakIsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQ3pFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO2lCQUNyRTthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsd0RBQXdEO1FBQ3hELHFDQUFxQztRQUNyQyx3REFBd0Q7UUFDeEQseUJBQXlCO1FBQ3pCLGlCQUFpQjtRQUNqQixxQ0FBcUM7UUFDckMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDL0QsU0FBUyxFQUFFLFVBQVUsV0FBVyxFQUFFO1lBRWxDLHdCQUF3QjtZQUN4QixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUV6RSxHQUFHLGdCQUFnQjtZQUNuQixtQkFBbUIsRUFBRSxLQUFLLEVBQUUsa0JBQWtCO1lBRTlDLHNCQUFzQixFQUFFO2dCQUN0QjtvQkFDRSwwQkFBMEI7b0JBQzFCLFNBQVMsRUFBRSxNQUFNO29CQUNqQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDdEUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7aUJBQ3JFO2dCQUNEO29CQUNFLDZCQUE2QjtvQkFDN0IsU0FBUyxFQUFFLE1BQU07b0JBQ2pCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO29CQUN6RSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtpQkFDckU7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVILHdEQUF3RDtRQUN4RCx3QkFBd0I7UUFDeEIsd0RBQXdEO1FBQ3hELGdCQUFnQjtRQUNoQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUN6RCxTQUFTLEVBQUUsT0FBTyxXQUFXLEVBQUU7WUFFL0IscUJBQXFCO1lBQ3JCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBRXRFLEdBQUcsZ0JBQWdCO1lBRW5CLHNCQUFzQixFQUFFO2dCQUN0QjtvQkFDRSx1QkFBdUI7b0JBQ3ZCLFNBQVMsRUFBRSxNQUFNO29CQUNqQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDdkUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7aUJBQ3ZFO2dCQUNEO29CQUNFLHVDQUF1QztvQkFDdkMsU0FBUyxFQUFFLE1BQU07b0JBQ2pCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO2lCQUMzRTthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsd0RBQXdEO1FBQ3hELGdDQUFnQztRQUNoQyx3REFBd0Q7UUFDeEQsWUFBWTtRQUNaLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFHLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDckUsU0FBUyxFQUFFLGNBQWMsV0FBVyxFQUFFO1lBRXRDLGNBQWM7WUFDZCxpQkFBaUI7WUFDakIsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDdEUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFFcEUsR0FBRyxnQkFBZ0I7WUFFbkIsc0JBQXNCLEVBQUU7Z0JBQ3RCO29CQUNFLHdCQUF3QjtvQkFDeEIsU0FBUyxFQUFFLE1BQU07b0JBQ2pCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO29CQUN6RSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtpQkFDcEU7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVILHdEQUF3RDtRQUN4RCwyQ0FBMkM7UUFDM0Msd0RBQXdEO1FBQ3hELFdBQVc7UUFDWCxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksR0FBRyxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQ3pFLFNBQVMsRUFBRSxlQUFlLFdBQVcsRUFBRTtZQUV2Qyw2QkFBNkI7WUFDN0IsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUU5RSxHQUFHLGdCQUFnQjtZQUNuQixtQkFBbUIsRUFBRSxLQUFLLEVBQUUsY0FBYztZQUUxQyxzQkFBc0IsRUFBRTtnQkFDdEI7b0JBQ0Usc0JBQXNCO29CQUN0QixTQUFTLEVBQUUsTUFBTTtvQkFDakIsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLHNCQUFzQixFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDbkYsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7aUJBQ3JFO2dCQUNEO29CQUNFLDJCQUEyQjtvQkFDM0IsU0FBUyxFQUFFLE1BQU07b0JBQ2pCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxzQkFBc0IsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQ25GLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO2lCQUNsRTthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsd0RBQXdEO1FBQ3hELDBDQUEwQztRQUMxQyx3REFBd0Q7UUFDeEQsc0JBQXNCO1FBQ3RCLElBQUksQ0FBQyxNQUFNLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSwyQkFBMkIsRUFBRTtZQUN6RixTQUFTLEVBQUUsd0JBQXdCLFdBQVcsRUFBRTtZQUVoRCxpQkFBaUI7WUFDakIsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFFekUsR0FBRyxnQkFBZ0I7U0FDcEIsQ0FBQyxDQUFDO1FBRUgsd0RBQXdEO1FBQ3hELG1DQUFtQztRQUNuQyx3REFBd0Q7UUFDeEQsYUFBYTtRQUNiLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxHQUFHLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDM0UsU0FBUyxFQUFFLGlCQUFpQixXQUFXLEVBQUU7WUFFekMsa0NBQWtDO1lBQ2xDLHNDQUFzQztZQUN0QyxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUN6RSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBRTFFLEdBQUcsZ0JBQWdCO1lBRW5CLHNCQUFzQixFQUFFO2dCQUN0QjtvQkFDRSxpQkFBaUI7b0JBQ2pCLFNBQVMsRUFBRSxNQUFNO29CQUNqQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO29CQUMvRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtpQkFDckU7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVILHdEQUF3RDtRQUN4RCwyQkFBMkI7UUFDM0Isd0RBQXdEO1FBQ3hELGlCQUFpQjtRQUNqQixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUM3RCxTQUFTLEVBQUUsU0FBUyxXQUFXLEVBQUU7WUFFakMsdUJBQXVCO1lBQ3ZCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBRXhFLEdBQUcsZ0JBQWdCO1lBRW5CLHNCQUFzQixFQUFFO2dCQUN0QjtvQkFDRSw2QkFBNkI7b0JBQzdCLFNBQVMsRUFBRSxNQUFNO29CQUNqQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDekUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7aUJBQ3JFO2dCQUNEO29CQUNFLGdDQUFnQztvQkFDaEMsU0FBUyxFQUFFLE1BQU07b0JBQ2pCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQy9FLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO2lCQUNyRTthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsd0RBQXdEO1FBQ3hELDBCQUEwQjtRQUMxQix3REFBd0Q7UUFDeEQsU0FBUztRQUNULElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQzNELFNBQVMsRUFBRSxRQUFRLFdBQVcsRUFBRTtZQUVoQyxtQ0FBbUM7WUFDbkMsb0NBQW9DO1lBQ3BDLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxvQkFBb0IsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDakYsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUU1RSxHQUFHLGdCQUFnQjtZQUVuQixzQkFBc0IsRUFBRTtnQkFDdEI7b0JBQ0UsYUFBYTtvQkFDYixTQUFTLEVBQUUsZ0JBQWdCO29CQUMzQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO29CQUNqRixPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtpQkFDckU7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVILHdEQUF3RDtRQUN4RCxzQ0FBc0M7UUFDdEMsd0RBQXdEO1FBQ3hELE9BQU87UUFDUCxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUM3RCxTQUFTLEVBQUUsU0FBUyxXQUFXLEVBQUU7WUFFakMsdUJBQXVCO1lBQ3ZCLGlCQUFpQjtZQUNqQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUN4RSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUVwRSxHQUFHLGdCQUFnQjtZQUNuQixtQkFBbUIsRUFBRSxLQUFLLEVBQUUsZUFBZTtZQUUzQyxzQkFBc0IsRUFBRTtnQkFDdEI7b0JBQ0UsbUJBQW1CO29CQUNuQixTQUFTLEVBQUUsb0JBQW9CO29CQUMvQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDckUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7aUJBQ3JFO2dCQUNEO29CQUNFLHdCQUF3QjtvQkFDeEIsa0NBQWtDO29CQUNsQyxTQUFTLEVBQUUsb0JBQW9CO29CQUMvQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDMUUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7aUJBQ3JFO2dCQUNEO29CQUNFLGNBQWM7b0JBQ2QsU0FBUyxFQUFFLHNCQUFzQjtvQkFDakMsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLHFCQUFxQixFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDbEYsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7aUJBQ3JFO2dCQUNEO29CQUNFLGtCQUFrQjtvQkFDbEIsU0FBUyxFQUFFLG1CQUFtQjtvQkFDOUIsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDaEYsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7aUJBQ3JFO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCx3REFBd0Q7UUFDeEQsMENBQTBDO1FBQzFDLHdEQUF3RDtRQUN4RCxVQUFVO1FBQ1YsNEJBQTRCO1FBQzVCLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFHLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDckUsU0FBUyxFQUFFLGNBQWMsV0FBVyxFQUFFO1lBRXRDLHVCQUF1QjtZQUN2QixpQkFBaUI7WUFDakIsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDeEUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFFcEUsR0FBRyxnQkFBZ0I7WUFDbkIsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLGtCQUFrQjtZQUU5QyxzQkFBc0IsRUFBRTtnQkFDdEI7b0JBQ0UsaUJBQWlCO29CQUNqQixTQUFTLEVBQUUsZ0JBQWdCO29CQUMzQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDdEUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7aUJBQ3JFO2dCQUNEO29CQUNFLG1CQUFtQjtvQkFDbkIsU0FBUyxFQUFFLG1CQUFtQjtvQkFDOUIsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQ3pFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO2lCQUNyRTtnQkFDRDtvQkFDRSxrQkFBa0I7b0JBQ2xCLFNBQVMsRUFBRSxrQkFBa0I7b0JBQzdCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO29CQUNyRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtpQkFDckU7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVILHdEQUF3RDtRQUN4RCx5Q0FBeUM7UUFDekMsd0RBQXdEO1FBQ3hELG9CQUFvQjtRQUNwQiwwQ0FBMEM7UUFDMUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEdBQUcsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUNyRSxTQUFTLEVBQUUsY0FBYyxXQUFXLEVBQUU7WUFFdEMsd0NBQXdDO1lBQ3hDLGdCQUFnQjtZQUNoQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUN6RSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUVuRSxHQUFHLGdCQUFnQjtZQUNuQixtQkFBbUIsRUFBRSxLQUFLLEVBQUUsYUFBYTtZQUV6QyxzQkFBc0IsRUFBRTtnQkFDdEI7b0JBQ0Usc0NBQXNDO29CQUN0QyxTQUFTLEVBQUUsb0JBQW9CO29CQUMvQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDeEUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7aUJBQ3ZFO2dCQUNEO29CQUNFLGtCQUFrQjtvQkFDbEIsU0FBUyxFQUFFLHdCQUF3QjtvQkFDbkMsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQ3pFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO2lCQUNwRTthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsd0RBQXdEO1FBQ3hELG1DQUFtQztRQUNuQyx3REFBd0Q7UUFDeEQsZ0JBQWdCO1FBQ2hCLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxHQUFHLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDM0UsU0FBUyxFQUFFLGlCQUFpQixXQUFXLEVBQUU7WUFFekMsZ0JBQWdCO1lBQ2hCLDJCQUEyQjtZQUMzQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUN4RSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsc0JBQXNCLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBRTlFLEdBQUcsZ0JBQWdCO1lBRW5CLHNCQUFzQixFQUFFO2dCQUN0QjtvQkFDRSxvQkFBb0I7b0JBQ3BCLFNBQVMsRUFBRSx1QkFBdUI7b0JBQ2xDLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxzQkFBc0IsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQ25GLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO2lCQUN0RTthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsd0RBQXdEO1FBQ3hELHlDQUF5QztRQUN6Qyx3REFBd0Q7UUFDeEQsZ0JBQWdCO1FBQ2hCLElBQUksQ0FBQyxNQUFNLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSx5QkFBeUIsRUFBRTtZQUNyRixTQUFTLEVBQUUsdUJBQXVCLFdBQVcsRUFBRTtZQUUvQyxvQkFBb0I7WUFDcEIsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFFckUsR0FBRyxnQkFBZ0I7WUFFbkIsc0JBQXNCLEVBQUU7Z0JBQ3RCO29CQUNFLG1CQUFtQjtvQkFDbkIsU0FBUyxFQUFFLG9CQUFvQjtvQkFDL0IsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQ3hFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO2lCQUNyRTtnQkFDRDtvQkFDRSx1QkFBdUI7b0JBQ3ZCLFNBQVMsRUFBRSx1QkFBdUI7b0JBQ2xDLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxzQkFBc0IsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQ25GLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO2lCQUNyRTthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsd0RBQXdEO1FBQ3hELHVDQUF1QztRQUN2Qyx3REFBd0Q7UUFDeEQseUJBQXlCO1FBQ3pCLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFHLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ2pFLFNBQVMsRUFBRSxZQUFZLFdBQVcsRUFBRTtZQUVwQyxnQkFBZ0I7WUFDaEIscUJBQXFCO1lBQ3JCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ3hFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBRWpFLEdBQUcsZ0JBQWdCO1lBQ25CLG1CQUFtQixFQUFFLEtBQUssRUFBRSxhQUFhO1lBRXpDLHNCQUFzQixFQUFFO2dCQUN0QjtvQkFDRSw0QkFBNEI7b0JBQzVCLFNBQVMsRUFBRSx1QkFBdUI7b0JBQ2xDLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO29CQUN6RSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtpQkFDckU7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVILHdEQUF3RDtRQUN4RCx3Q0FBd0M7UUFDeEMsd0RBQXdEO1FBQ3hELG9CQUFvQjtRQUNwQixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUNqRSxTQUFTLEVBQUUsWUFBWSxXQUFXLEVBQUU7WUFFcEMscUJBQXFCO1lBQ3JCLGlCQUFpQjtZQUNqQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUN0RSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUVwRSxHQUFHLGdCQUFnQjtZQUNuQixtQkFBbUIsRUFBRSxLQUFLLEVBQUUsY0FBYztZQUUxQyxzQkFBc0IsRUFBRTtnQkFDdEI7b0JBQ0UsaUJBQWlCO29CQUNqQixTQUFTLEVBQUUsa0JBQWtCO29CQUM3QixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDeEUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7aUJBQ3JFO2dCQUNEO29CQUNFLGtCQUFrQjtvQkFDbEIsU0FBUyxFQUFFLGtCQUFrQjtvQkFDN0IsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDOUUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7aUJBQ3JFO2dCQUNEO29CQUNFLGtCQUFrQjtvQkFDbEIsU0FBUyxFQUFFLG9CQUFvQjtvQkFDL0IsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQzVFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO2lCQUNyRTthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsd0RBQXdEO1FBQ3hELHNDQUFzQztRQUN0Qyx3REFBd0Q7UUFDeEQsT0FBTztRQUNQLHlCQUF5QjtRQUN6QixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sR0FBRyxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUMvRCxTQUFTLEVBQUUsVUFBVSxXQUFXLEVBQUU7WUFFbEMsd0JBQXdCO1lBQ3hCLGlCQUFpQjtZQUNqQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUN6RSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUVwRSxHQUFHLGdCQUFnQjtZQUNuQixtQkFBbUIsRUFBRSxLQUFLLEVBQUUsY0FBYztZQUUxQyxzQkFBc0IsRUFBRTtnQkFDdEI7b0JBQ0UsaUJBQWlCO29CQUNqQixTQUFTLEVBQUUscUJBQXFCO29CQUNoQyxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO29CQUNoRixPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtpQkFDckU7Z0JBQ0Q7b0JBQ0UsbUJBQW1CO29CQUNuQixTQUFTLEVBQUUsdUJBQXVCO29CQUNsQyxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDdkUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7aUJBQ3JFO2dCQUNEO29CQUNFLG1CQUFtQjtvQkFDbkIsU0FBUyxFQUFFLHFCQUFxQjtvQkFDaEMsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQ3JFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO2lCQUNyRTthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsd0RBQXdEO1FBQ3hELGdDQUFnQztRQUNoQyx3REFBd0Q7UUFDeEQsYUFBYTtRQUNiLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFHLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDckUsU0FBUyxFQUFFLGNBQWMsV0FBVyxFQUFFO1lBRXRDLGNBQWM7WUFDZCxpQkFBaUI7WUFDakIsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDdEUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFFcEUsR0FBRyxnQkFBZ0I7WUFFbkIsc0JBQXNCLEVBQUU7Z0JBQ3RCO29CQUNFLHVCQUF1QjtvQkFDdkIsU0FBUyxFQUFFLG1CQUFtQjtvQkFDOUIsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQ3pFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO2lCQUNwRTtnQkFDRDtvQkFDRSxvQkFBb0I7b0JBQ3BCLFNBQVMsRUFBRSxlQUFlO29CQUMxQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsc0JBQXNCLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO29CQUNuRixPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtpQkFDcEU7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVILHdEQUF3RDtRQUN4RCxpQ0FBaUM7UUFDakMsd0RBQXdEO1FBQ3hELFNBQVM7UUFDVCxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksR0FBRyxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQ3pFLFNBQVMsRUFBRSxlQUFlLFdBQVcsRUFBRTtZQUV2Qyw2QkFBNkI7WUFDN0IsaUJBQWlCO1lBQ2pCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDOUUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFFcEUsR0FBRyxnQkFBZ0I7WUFFbkIsc0JBQXNCLEVBQUU7Z0JBQ3RCO29CQUNFLGtCQUFrQjtvQkFDbEIsU0FBUyxFQUFFLGdDQUFnQztvQkFDM0MsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDL0UsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtpQkFDMUU7Z0JBQ0Q7b0JBQ0Usa0JBQWtCO29CQUNsQixTQUFTLEVBQUUsZ0NBQWdDO29CQUMzQyxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO29CQUMvRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO2lCQUMxRTthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsd0RBQXdEO1FBQ3hELHNDQUFzQztRQUN0Qyx3REFBd0Q7UUFDeEQsWUFBWTtRQUNaLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxHQUFHLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQy9ELFNBQVMsRUFBRSxVQUFVLFdBQVcsRUFBRTtZQUVsQyxzQkFBc0I7WUFDdEIsd0JBQXdCO1lBQ3hCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDOUUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFFcEUsR0FBRyxnQkFBZ0I7WUFDbkIsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLGdCQUFnQjtZQUU1QyxzQkFBc0IsRUFBRTtnQkFDdEI7b0JBQ0Usb0JBQW9CO29CQUNwQixTQUFTLEVBQUUscUJBQXFCO29CQUNoQyxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO29CQUNoRixPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtpQkFDckU7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVILHdEQUF3RDtRQUN4RCx3Q0FBd0M7UUFDeEMsd0RBQXdEO1FBQ3hELFlBQVk7UUFDWixJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQ25FLFNBQVMsRUFBRSxZQUFZLFdBQVcsRUFBRTtZQUVwQyx3QkFBd0I7WUFDeEIsc0JBQXNCO1lBQ3RCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ25FLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBRWxFLEdBQUcsZ0JBQWdCO1lBQ25CLG1CQUFtQixFQUFFLEtBQUssRUFBRSxVQUFVO1lBRXRDLHNCQUFzQixFQUFFO2dCQUN0QjtvQkFDRSxvQkFBb0I7b0JBQ3BCLFNBQVMsRUFBRSxpQkFBaUI7b0JBQzVCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO29CQUN6RSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtpQkFDcEU7Z0JBQ0Q7b0JBQ0UsbUJBQW1CO29CQUNuQixTQUFTLEVBQUUsZ0JBQWdCO29CQUMzQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtvQkFDekUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7aUJBQ3BFO2dCQUNEO29CQUNFLGlEQUFpRDtvQkFDakQsU0FBUyxFQUFFLG1CQUFtQjtvQkFDOUIsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7b0JBQzFFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO2lCQUNwRTthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsd0RBQXdEO1FBQ3hELGNBQWM7UUFDZCx3REFBd0Q7UUFFeEQsd0RBQXdEO1FBQ3hELHlCQUF5QjtRQUN6Qix3REFBd0Q7UUFDeEQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRTtZQUNwRCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxXQUFXLEVBQUU7Z0JBQzFDLEtBQUssRUFBRSxLQUFLLENBQUMsU0FBUztnQkFDdEIsV0FBVyxFQUFFLEdBQUcsSUFBSSxhQUFhO2dCQUNqQyxVQUFVLEVBQUUsWUFBWSxJQUFJLGNBQWMsV0FBVyxFQUFFO2FBQ3hELENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBcDBCRCxzQ0FvMEJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcblxyXG5pbnRlcmZhY2UgRHluYW1vREJTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xyXG4gIGVudmlyb25tZW50OiAnZGV2JyB8ICdwcm9kJztcclxuICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIER5bmFtb0RCU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gIHB1YmxpYyByZWFkb25seSB0YWJsZXM6IHsgW2tleTogc3RyaW5nXTogZHluYW1vZGIuVGFibGVWMiB9O1xyXG5cclxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogRHluYW1vREJTdGFja1Byb3BzKSB7XHJcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuXHJcbiAgICB0aGlzLnRhYmxlcyA9IHt9O1xyXG5cclxuICAgIGNvbnN0IHsgZW52aXJvbm1lbnQsIHJlbW92YWxQb2xpY3kgfSA9IHByb3BzO1xyXG4gICAgY29uc3QgdGFibGVTdWZmaXggPSBgLSR7ZW52aXJvbm1lbnR9YDtcclxuXHJcbiAgICAvLyDlhbHpgJroqK3lrppcclxuICAgIGNvbnN0IGNvbW1vblRhYmxlUHJvcHMgPSB7XHJcbiAgICAgIGJpbGxpbmc6IGR5bmFtb2RiLkJpbGxpbmcub25EZW1hbmQoKSxcclxuICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uVjIuYXdzTWFuYWdlZEtleSgpLFxyXG4gICAgICByZW1vdmFsUG9saWN5OiByZW1vdmFsUG9saWN5LFxyXG4gICAgICBwb2ludEluVGltZVJlY292ZXJ5U3BlY2lmaWNhdGlvbjoge1xyXG4gICAgICAgIHBvaW50SW5UaW1lUmVjb3ZlcnlFbmFibGVkOiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnLCAvLyDmnKznlarjga7jgb9QSVRS5pyJ5Yq5XHJcbiAgICAgIH0sXHJcbiAgICB9O1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAxLiBBQ0NPVU5UIOODhuODvOODluODqyAoR1NJOiAzKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIOiqjeiovOODu+ODl+ODreODleOCo+ODvOODq+euoeeQhuOBruS4reW/g+ODhuODvOODluODq1xyXG4gICAgLy8gMembu+ipseeVquWPt+OBguOBn+OCijPjgqLjgqvjgqbjg7Pjg4jjgb7jgafvvIjjgqLjg5fjg6rlgbTjgafjg4Hjgqfjg4Pjgq/vvIlcclxuICAgIC8vIGFjY291bnRfdHlwZTogcGVyc29uYWwvYnVzaW5lc3Mvc2hvcC92ZXJpZmllZC9hZG1pblxyXG4gICAgdGhpcy50YWJsZXMuYWNjb3VudCA9IG5ldyBkeW5hbW9kYi5UYWJsZVYyKHRoaXMsICdBY2NvdW50VGFibGUnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogYEFDQ09VTlQke3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyDjg5fjg6njgqTjg57jg6rjgq3jg7xcclxuICAgICAgLy8gUEs6IFwiQUNDT1VOVCNhY2NvdW50X2lkXCJcclxuICAgICAgLy8gU0s6IFwiUFJPRklMRVwiICjlm7rlrprlgKQpXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnUEsnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcblxyXG4gICAgICAuLi5jb21tb25UYWJsZVByb3BzLFxyXG5cclxuICAgICAgZ2xvYmFsU2Vjb25kYXJ5SW5kZXhlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTE6IOODoeODvOODq+OCouODieODrOOCueOBp+ODreOCsOOCpOODs1xyXG4gICAgICAgICAgLy8gR1NJMVBLOiBcIkVNQUlMI2VtYWlsXCJcclxuICAgICAgICAgIC8vIEdTSTFTSzogXCJBQ0NPVU5UXCIgKOWbuuWumuWApClcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSTFfRW1haWxMb2dpbicsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ0dTSTFQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdHU0kxU0snLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMjog44OP44Oz44OJ44Or5qSc57Si55SoXHJcbiAgICAgICAgICAvLyBHU0kyUEs6IFwiSEFORExFI2hhbmRsZVwiXHJcbiAgICAgICAgICAvLyBHU0kyU0s6IFwiQUNDT1VOVFwiICjlm7rlrprlgKQpXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0kyX0hhbmRsZVNlYXJjaCcsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ0dTSTJQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdHU0kyU0snLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMzog6Zu76Kmx55Wq5Y+344Gn57SQ44Gl44GP44Ki44Kr44Km44Oz44OI44KS566h55CG44GZ44KL44Gf44KB44Gu44Kk44Oz44OH44OD44Kv44K5XHJcbiAgICAgICAgICAvLyBHU0kzUEs6IFwiUEhPTkUjcGhvbmVfbnVtYmVyXCJcclxuICAgICAgICAgIC8vIEdTSTNTSzogXCJDUkVBVEVEI2NyZWF0ZWRfYXRcIlxyXG4gICAgICAgICAgLy8g55So6YCUOiAx6Zu76Kmx55Wq5Y+344GC44Gf44KKM+OCouOCq+OCpuODs+ODiOWItumZkOOBruODgeOCp+ODg+OCr1xyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJM19QaG9uZU1hbmFnZW1lbnQnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdHU0kzUEsnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnR1NJM1NLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIDIuIFNFU1NJT04g44OG44O844OW44OrIChHU0k6IDEsIFRUTDogMzDml6UpXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8g44Ki44Kr44Km44Oz44OI5YiH44KK5pu/44GI55So44K744OD44K344On44Oz566h55CGXHJcbiAgICAvLyBUVEzjgaczMOaXpeW+jOiHquWLleWJiumZpOOAgeWQjOaZguODreOCsOOCpOODs+eEoeWItumZkFxyXG4gICAgdGhpcy50YWJsZXMuc2Vzc2lvbiA9IG5ldyBkeW5hbW9kYi5UYWJsZVYyKHRoaXMsICdTZXNzaW9uVGFibGUnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogYFNFU1NJT04ke3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyBQSzogXCJTRVNTSU9OI2FjY291bnRfaWRcIlxyXG4gICAgICAvLyBTSzogXCJERVZJQ0UjZGV2aWNlX2lkXCJcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ1NLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuXHJcbiAgICAgIC4uLmNvbW1vblRhYmxlUHJvcHMsXHJcbiAgICAgIHRpbWVUb0xpdmVBdHRyaWJ1dGU6ICd0dGwnLCAvLyAzMOaXpeW+jOWJiumZpFxyXG5cclxuICAgICAgZ2xvYmFsU2Vjb25kYXJ5SW5kZXhlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTE6IOOCouOCq+OCpuODs+ODiOOBruOCu+ODg+OCt+ODp+ODs+S4gOimp1xyXG4gICAgICAgICAgLy8gR1NJMVBLOiBcIkFDQ09VTlRfU0VTU0lPTlMjYWNjb3VudF9pZFwiXHJcbiAgICAgICAgICAvLyBHU0kxU0s6IFwiQ1JFQVRFRCNjcmVhdGVkX2F0XCJcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSTFfQWNjb3VudFNlc3Npb25zJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnR1NJMVBLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ0dTSTFTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAzLiBQT1NUIOODhuODvOODluODqyAoR1NJOiA0LCBUVEw6IDkw5pelKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIOaKleeov+ODh+ODvOOCv+euoeeQhlxyXG4gICAgLy8gaGFzaHRhZ3M6IFN0cmluZyBTZXQgKFNTKeOAgXJlcG9zdF9jb3VudOi/veWKoFxyXG4gICAgLy8gUk9PTeaKleeov++8mumAmuW4uOOCv+OCpOODoOODqeOCpOODsyArIFJPT03jgr/jgqTjg6Djg6njgqTjg7PkuKHmlrnjgavooajnpLpcclxuICAgIHRoaXMudGFibGVzLnBvc3QgPSBuZXcgZHluYW1vZGIuVGFibGVWMih0aGlzLCAnUG9zdFRhYmxlJywge1xyXG4gICAgICB0YWJsZU5hbWU6IGBQT1NUJHt0YWJsZVN1ZmZpeH1gLFxyXG5cclxuICAgICAgLy8gUEs6IHBvc3RJZCAoVUxJRClcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdwb3N0SWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG5cclxuICAgICAgLi4uY29tbW9uVGFibGVQcm9wcyxcclxuICAgICAgdGltZVRvTGl2ZUF0dHJpYnV0ZTogJ3R0bCcsIC8vIOWJiumZpOOBi+OCiTkw5pel5b6M44Gr54mp55CG5YmK6ZmkXHJcblxyXG4gICAgICBnbG9iYWxTZWNvbmRhcnlJbmRleGVzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMTog44K/44Kk44Og44Op44Kk44Oz5Y+W5b6X55So77yI54m55a6a44Om44O844K244O844Gu5oqV56i/44KS5pmC57O75YiX44Gn5Y+W5b6X77yJXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0kxJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnYWNjb3VudElkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2NyZWF0ZWRBdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kyOiDnmbropovjgr/jg5bnlKjvvIjjg5Hjg5bjg6rjg4Pjgq/mipXnqL/jga7kuIDopqflj5blvpfvvIlcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSTInLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICd2aXNpYmlsaXR5JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2NyZWF0ZWRBdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kzOiDjg6vjg7zjg6DlhoXmipXnqL/kuIDopqflj5blvpfnlKhcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSTMnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdyb29tX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2NyZWF0ZWRBdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0k0OiDmipXnqL/jgr/jgqTjg5fliKXkuIDopqfvvIhub3JtYWwvd2F2Ze+8iVxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJX1Bvc3RUeXBlX0NyZWF0ZWRBdCcsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3Bvc3RfdHlwZScsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkQXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gNC4gSEFTSFRBR19JTkRFWCDjg4bjg7zjg5bjg6sgKEdTSTogMClcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyDjg4/jg4Pjgrfjg6Xjgr/jgrDmpJzntKLnlKhcclxuICAgIHRoaXMudGFibGVzLmhhc2h0YWdJbmRleCA9IG5ldyBkeW5hbW9kYi5UYWJsZVYyKHRoaXMsICdIYXNodGFnSW5kZXhUYWJsZScsIHtcclxuICAgICAgdGFibGVOYW1lOiBgSEFTSFRBR19JTkRFWCR7dGFibGVTdWZmaXh9YCxcclxuXHJcbiAgICAgIC8vIFBLOiBoYXNodGFnICjlsI/mloflrZfljJbmuIjjgb8pXHJcbiAgICAgIC8vIFNLOiBwb3N0SWRcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdoYXNodGFnJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAncG9zdElkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuXHJcbiAgICAgIC4uLmNvbW1vblRhYmxlUHJvcHMsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gNS4gSEFTSFRBR19DT1VOVCDjg4bjg7zjg5bjg6sgKEdTSTogMSwgVFRMOiAzMOaXpSlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyDjg4jjg6zjg7Pjg4njg4/jg4Pjgrfjg6Xjgr/jgrDpm4boqIjnlKhcclxuICAgIHRoaXMudGFibGVzLmhhc2h0YWdDb3VudCA9IG5ldyBkeW5hbW9kYi5UYWJsZVYyKHRoaXMsICdIYXNodGFnQ291bnRUYWJsZScsIHtcclxuICAgICAgdGFibGVOYW1lOiBgSEFTSFRBR19DT1VOVCR7dGFibGVTdWZmaXh9YCxcclxuXHJcbiAgICAgIC8vIFBLOiBoYXNodGFnXHJcbiAgICAgIC8vIFNLOiBwZXJpb2QgKGRhaWx5XzIwMjUtMTAtMTQgLyB3ZWVrbHlfMjAyNS1XNDIgLyBhbGxfdGltZSlcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdoYXNodGFnJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAncGVyaW9kJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuXHJcbiAgICAgIC4uLmNvbW1vblRhYmxlUHJvcHMsXHJcbiAgICAgIHRpbWVUb0xpdmVBdHRyaWJ1dGU6ICd0dGwnLCAvLyAzMOaXpeW+jOWJiumZpFxyXG5cclxuICAgICAgZ2xvYmFsU2Vjb25kYXJ5SW5kZXhlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTE6IOODqeODs+OCreODs+OCsOWPluW+l+eUqO+8iOacn+mWk+OBlOOBqOOBruS6uuawl+ODj+ODg+OCt+ODpeOCv+OCsFRPUDEw77yJXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0kxJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAncGVyaW9kJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2NvdW50JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIDYuIEZPTExPVyDjg4bjg7zjg5bjg6sgKEdTSTogMilcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyDjg5Xjgqnjg63jg7wv44OV44Kp44Ot44Ov44O86Zai5L+C566h55CGXHJcbiAgICB0aGlzLnRhYmxlcy5mb2xsb3cgPSBuZXcgZHluYW1vZGIuVGFibGVWMih0aGlzLCAnRm9sbG93VGFibGUnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogYEZPTExPVyR7dGFibGVTdWZmaXh9YCxcclxuXHJcbiAgICAgIC8vIFBLOiBmb2xsb3dlcl9pZCAo44OV44Kp44Ot44O844GZ44KL5YG0KVxyXG4gICAgICAvLyBTSzogZm9sbG93aW5nX2lkICjjg5Xjgqnjg63jg7zjgZXjgozjgovlgbQpXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnZm9sbG93ZXJfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdmb2xsb3dpbmdfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG5cclxuICAgICAgLi4uY29tbW9uVGFibGVQcm9wcyxcclxuXHJcbiAgICAgIGdsb2JhbFNlY29uZGFyeUluZGV4ZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kxOiDjg5Xjgqnjg63jg7zkuK3kuIDopqflj5blvpfnlKhcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSTEnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdmb2xsb3dlcl9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTI6IOODleOCqeODreODr+ODvOS4gOimp+WPluW+l+eUqFxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJMicsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2ZvbGxvd2luZ19pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIDcuIExJS0Ug44OG44O844OW44OrIChHU0k6IDEpXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8g5oqV56i/44G444Gu44GE44GE44Gt566h55CGXHJcbiAgICAvLyBDb25kaXRpb25FeHByZXNzaW9u44Gn6YeN6KSH6Ziy5q2iXHJcbiAgICB0aGlzLnRhYmxlcy5saWtlID0gbmV3IGR5bmFtb2RiLlRhYmxlVjIodGhpcywgJ0xpa2VUYWJsZScsIHtcclxuICAgICAgdGFibGVOYW1lOiBgTElLRSR7dGFibGVTdWZmaXh9YCxcclxuXHJcbiAgICAgIC8vIFBLOiBwb3N0X2lkXHJcbiAgICAgIC8vIFNLOiBhY2NvdW50X2lkXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAncG9zdF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG5cclxuICAgICAgLi4uY29tbW9uVGFibGVQcm9wcyxcclxuXHJcbiAgICAgIGdsb2JhbFNlY29uZGFyeUluZGV4ZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kxOiDjg6bjg7zjgrbjg7zjgYzjgYTjgYTjga3jgZfjgZ/mipXnqL/kuIDopqdcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSTEnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdhY2NvdW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2NyZWF0ZWRfYXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gOC4gQ09NTUVOVCDjg4bjg7zjg5bjg6sgKEdTSTogMiwgVFRMOiA5MOaXpSlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyDmipXnqL/jgbjjga7jgrPjg6Hjg7Pjg4jnrqHnkIbvvIjjg4/jgqTjg5bjg6rjg4Pjg4nliYrpmaTmlrnlvI/vvIlcclxuICAgIC8vIOODpuODvOOCtuODvOWJiumZpDog5Y2z5pmC54mp55CG5YmK6ZmkXHJcbiAgICAvLyDpgYvllrbliYrpmaQ6IOirlueQhuWJiumZpO+8iGlzX2RlbGV0ZWQ9dHJ1ZeOAgTkw5pelVFRM77yJXHJcbiAgICB0aGlzLnRhYmxlcy5jb21tZW50ID0gbmV3IGR5bmFtb2RiLlRhYmxlVjIodGhpcywgJ0NvbW1lbnRUYWJsZScsIHtcclxuICAgICAgdGFibGVOYW1lOiBgQ09NTUVOVCR7dGFibGVTdWZmaXh9YCxcclxuXHJcbiAgICAgIC8vIFBLOiBjb21tZW50X2lkIChVTElEKVxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2NvbW1lbnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG5cclxuICAgICAgLi4uY29tbW9uVGFibGVQcm9wcyxcclxuICAgICAgdGltZVRvTGl2ZUF0dHJpYnV0ZTogJ3R0bCcsIC8vIOmBi+WWtuWJiumZpOOBi+OCiTkw5pel5b6M44Gr54mp55CG5YmK6ZmkXHJcblxyXG4gICAgICBnbG9iYWxTZWNvbmRhcnlJbmRleGVzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMTog5oqV56i/44Gu44Kz44Oh44Oz44OI5LiA6Kan5Y+W5b6X55So77yI5Y+k44GE6aCG77yJXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0kxJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAncG9zdF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTI6IOODpuODvOOCtuODvOOBruOCs+ODoeODs+ODiOS4gOimp+WPluW+l+eUqO+8iOaWsOOBl+OBhOmghu+8iVxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJMicsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyA5LiBST09NIOODhuODvOODluODqyAoR1NJOiAyKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIOOCuOODo+ODs+ODq+WIpeOCs+ODn+ODpeODi+ODhuOCo+epuumWk1xyXG4gICAgdGhpcy50YWJsZXMucm9vbSA9IG5ldyBkeW5hbW9kYi5UYWJsZVYyKHRoaXMsICdSb29tVGFibGUnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogYFJPT00ke3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyBQSzogcm9vbV9pZCAoVUxJRClcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdyb29tX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuXHJcbiAgICAgIC4uLmNvbW1vblRhYmxlUHJvcHMsXHJcblxyXG4gICAgICBnbG9iYWxTZWNvbmRhcnlJbmRleGVzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMTog44Kr44OG44K044Oq44O85Yil5Lq65rCX44Or44O844Og5Y+W5b6X55SoXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0kxJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnY2F0ZWdvcnknLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnbWVtYmVyX2NvdW50JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTI6IOODq+ODvOODoOODj+ODs+ODieODq+aknOe0oueUqO+8iFVSTDogL3Jvb20vQGhhbmRsZe+8iVxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJMicsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3Jvb21faGFuZGxlJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIDEwLiBST09NX01FTUJFUiDjg4bjg7zjg5bjg6sgKEdTSTogMSlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyDjg6vjg7zjg6Djg6Hjg7Pjg5Djg7znrqHnkIZcclxuICAgIHRoaXMudGFibGVzLnJvb21NZW1iZXIgPSBuZXcgZHluYW1vZGIuVGFibGVWMih0aGlzLCAnUm9vbU1lbWJlclRhYmxlJywge1xyXG4gICAgICB0YWJsZU5hbWU6IGBST09NX01FTUJFUiR7dGFibGVTdWZmaXh9YCxcclxuXHJcbiAgICAgIC8vIFBLOiByb29tX2lkXHJcbiAgICAgIC8vIFNLOiBhY2NvdW50X2lkXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAncm9vbV9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG5cclxuICAgICAgLi4uY29tbW9uVGFibGVQcm9wcyxcclxuXHJcbiAgICAgIGdsb2JhbFNlY29uZGFyeUluZGV4ZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kxOiDjg6bjg7zjgrbjg7zjga7lj4LliqDjg6vjg7zjg6DkuIDopqflj5blvpfnlKhcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSTEnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdhY2NvdW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2pvaW5lZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAxMS4gTk9USUZJQ0FUSU9OIOODhuODvOODluODqyAoR1NJOiAyLCBUVEw6IDkw5pelKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIOODpuODvOOCtuODvOmAmuefpeeuoeeQhlxyXG4gICAgdGhpcy50YWJsZXMubm90aWZpY2F0aW9uID0gbmV3IGR5bmFtb2RiLlRhYmxlVjIodGhpcywgJ05vdGlmaWNhdGlvblRhYmxlJywge1xyXG4gICAgICB0YWJsZU5hbWU6IGBOT1RJRklDQVRJT04ke3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyBQSzogbm90aWZpY2F0aW9uX2lkIChVTElEKVxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ25vdGlmaWNhdGlvbl9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcblxyXG4gICAgICAuLi5jb21tb25UYWJsZVByb3BzLFxyXG4gICAgICB0aW1lVG9MaXZlQXR0cmlidXRlOiAndHRsJywgLy8g5L2c5oiQ44GL44KJOTDml6XlvozjgavliYrpmaRcclxuXHJcbiAgICAgIGdsb2JhbFNlY29uZGFyeUluZGV4ZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kxOiDpgJrnn6XkuIDopqflj5blvpfnlKjvvIjmlrDjgZfjgYTpoIbvvIlcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSTEnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdyZWNpcGllbnRfYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTI6IOacquiqremAmuefpeODleOCo+ODq+OCv+eUqO+8iOacquiqreODkOODg+OCuOihqOekuu+8iVxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJMicsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3JlY2lwaWVudF9hY2NvdW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2lzX3JlYWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gMTIuIE5PVElGSUNBVElPTl9TRVRUSU5HUyDjg4bjg7zjg5bjg6sgKEdTSTogMClcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyDjg5fjg4Pjgrfjg6XpgJrnn6XoqK3lrprvvIhBV1MgU05T5a++5b+c77yJXHJcbiAgICB0aGlzLnRhYmxlcy5ub3RpZmljYXRpb25TZXR0aW5ncyA9IG5ldyBkeW5hbW9kYi5UYWJsZVYyKHRoaXMsICdOb3RpZmljYXRpb25TZXR0aW5nc1RhYmxlJywge1xyXG4gICAgICB0YWJsZU5hbWU6IGBOT1RJRklDQVRJT05fU0VUVElOR1Mke3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyBQSzogYWNjb3VudF9pZFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG5cclxuICAgICAgLi4uY29tbW9uVGFibGVQcm9wcyxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAxMy4gTVVURURfQUNDT1VOVFMg44OG44O844OW44OrIChHU0k6IDEpXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8g5YCL5Yil44Om44O844K244O844Of44Ol44O844OIXHJcbiAgICB0aGlzLnRhYmxlcy5tdXRlZEFjY291bnRzID0gbmV3IGR5bmFtb2RiLlRhYmxlVjIodGhpcywgJ011dGVkQWNjb3VudHNUYWJsZScsIHtcclxuICAgICAgdGFibGVOYW1lOiBgTVVURURfQUNDT1VOVFMke3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyBQSzogYWNjb3VudF9pZCAo44Of44Ol44O844OI6Kit5a6a44KS44GZ44KL44Ki44Kr44Km44Oz44OIKVxyXG4gICAgICAvLyBTSzogbXV0ZWRfYWNjb3VudF9pZCAo44Of44Ol44O844OI44GV44KM44KL44Ki44Kr44Km44Oz44OIKVxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdtdXRlZF9hY2NvdW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuXHJcbiAgICAgIC4uLmNvbW1vblRhYmxlUHJvcHMsXHJcblxyXG4gICAgICBnbG9iYWxTZWNvbmRhcnlJbmRleGVzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMTog6YCG5byV44GN55So77yI57Wx6KiI77yJXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0kxJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnbXV0ZWRfYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdhY2NvdW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIDE0LiBSRVBPU1Qg44OG44O844OW44OrIChHU0k6IDIpXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8g5oqV56i/44Gu44K344Kn44Ki77yI44Oq44Od44K544OI77yJ566h55CGXHJcbiAgICB0aGlzLnRhYmxlcy5yZXBvc3QgPSBuZXcgZHluYW1vZGIuVGFibGVWMih0aGlzLCAnUmVwb3N0VGFibGUnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogYFJFUE9TVCR7dGFibGVTdWZmaXh9YCxcclxuXHJcbiAgICAgIC8vIFBLOiByZXBvc3RfaWQgKFVMSUQpXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAncmVwb3N0X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuXHJcbiAgICAgIC4uLmNvbW1vblRhYmxlUHJvcHMsXHJcblxyXG4gICAgICBnbG9iYWxTZWNvbmRhcnlJbmRleGVzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMTog44Om44O844K244O844Gu44Oq44Od44K544OI5LiA6Kan5Y+W5b6X55So77yI5paw44GX44GE6aCG77yJXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0kxJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTI6IOaKleeov+OBruODquODneOCueODiOS4gOimp+WPluW+l+eUqO+8iOiqsOOBjOODquODneOCueODiOOBl+OBn+OBi++8iVxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJMicsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ29yaWdpbmFsX3Bvc3RfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAxNS4gQkxPQ0sg44OG44O844OW44OrIChHU0k6IDEpXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8g44OW44Ot44OD44Kv566h55CGXHJcbiAgICB0aGlzLnRhYmxlcy5ibG9jayA9IG5ldyBkeW5hbW9kYi5UYWJsZVYyKHRoaXMsICdCbG9ja1RhYmxlJywge1xyXG4gICAgICB0YWJsZU5hbWU6IGBCTE9DSyR7dGFibGVTdWZmaXh9YCxcclxuXHJcbiAgICAgIC8vIFBLOiBibG9ja2VyX2FjY291bnRfaWQgKOODluODreODg+OCr+OBl+OBn+S6uilcclxuICAgICAgLy8gU0s6IGJsb2NrZWRfYWNjb3VudF9pZCAo44OW44Ot44OD44Kv44GV44KM44Gf5Lq6KVxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2Jsb2NrZXJfYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2Jsb2NrZWRfYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcblxyXG4gICAgICAuLi5jb21tb25UYWJsZVByb3BzLFxyXG5cclxuICAgICAgZ2xvYmFsU2Vjb25kYXJ5SW5kZXhlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTE6IOmAhuW8leOBjeeUqFxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJX2Jsb2NrZWRfYnknLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdibG9ja2VkX2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnYmxvY2tlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAxNi4gUkVQT1JUIOODhuODvOODluODqyAoR1NJOiA0LCBUVEw6IDE4MOaXpSlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyDpgJrloLHnrqHnkIZcclxuICAgIHRoaXMudGFibGVzLnJlcG9ydCA9IG5ldyBkeW5hbW9kYi5UYWJsZVYyKHRoaXMsICdSZXBvcnRUYWJsZScsIHtcclxuICAgICAgdGFibGVOYW1lOiBgUkVQT1JUJHt0YWJsZVN1ZmZpeH1gLFxyXG5cclxuICAgICAgLy8gUEs6IHJlcG9ydF9pZCAoVUxJRClcclxuICAgICAgLy8gU0s6IGNyZWF0ZWRfYXRcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdyZXBvcnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuXHJcbiAgICAgIC4uLmNvbW1vblRhYmxlUHJvcHMsXHJcbiAgICAgIHRpbWVUb0xpdmVBdHRyaWJ1dGU6ICd0dGwnLCAvLyDlr77lv5zlrozkuoblvowxODDml6XjgafliYrpmaRcclxuXHJcbiAgICAgIGdsb2JhbFNlY29uZGFyeUluZGV4ZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kxOiDjgrnjg4bjg7zjgr/jgrnliKXjg6zjg53jg7zjg4hcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV9zdGF0dXNfcmVwb3J0cycsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3N0YXR1cycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTI6IOWvvuixoeOCv+OCpOODl+WIpeODrOODneODvOODiO+8iOaZguezu+WIl++8iVxyXG4gICAgICAgICAgLy8gdGFyZ2V0X2lk44GvRmlsdGVyRXhwcmVzc2lvbuOBp+e1nuOCiui+vOOCgFxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJX3RhcmdldF9yZXBvcnRzJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAndGFyZ2V0X3R5cGUnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kzOiDpgJrloLHogIXlsaXmrbRcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV9yZXBvcnRlcl9oaXN0b3J5JyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAncmVwb3J0ZXJfYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTQ6IOmAmuWgseOBleOCjOOBn+ODpuODvOOCtuODvFxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJX3JlcG9ydGVkX3VzZXInLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICd0YXJnZXRfYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIDE3LiBMSVZFX1NUUkVBTSDjg4bjg7zjg5bjg6sgKEdTSTogMywgVFRMOiAzMOaXpSlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyDjg6njgqTjg5bphY3kv6HnrqHnkIZcclxuICAgIC8vIHZpZXdlcl9jb3VudOS9v+eUqO+8iOODmeOCueODiOODl+ODqeOCr+ODhuOCo+OCue+8iVxyXG4gICAgdGhpcy50YWJsZXMubGl2ZVN0cmVhbSA9IG5ldyBkeW5hbW9kYi5UYWJsZVYyKHRoaXMsICdMaXZlU3RyZWFtVGFibGUnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogYExJVkVfU1RSRUFNJHt0YWJsZVN1ZmZpeH1gLFxyXG5cclxuICAgICAgLy8gUEs6IHN0cmVhbV9pZCAoVUxJRClcclxuICAgICAgLy8gU0s6IGNyZWF0ZWRfYXRcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdzdHJlYW1faWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuXHJcbiAgICAgIC4uLmNvbW1vblRhYmxlUHJvcHMsXHJcbiAgICAgIHRpbWVUb0xpdmVBdHRyaWJ1dGU6ICd0dGwnLCAvLyAzMOaXpeW+jOWJiumZpO+8iOOCouODvOOCq+OCpOODluacn+mWk++8iVxyXG5cclxuICAgICAgZ2xvYmFsU2Vjb25kYXJ5SW5kZXhlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTE6IOODq+ODvOODoOOBrumFjeS/oeS4gOimp1xyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJX3Jvb21fbGl2ZXMnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdyb29tX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ3N0YXJ0ZWRfYXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMjog44Ki44Kr44Km44Oz44OI44Gu6YWN5L+h5bGl5q20XHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0lfYWNjb3VudF9saXZlcycsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnc3RhcnRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kzOiDjgqLjgq/jg4bjgqPjg5bphY3kv6HkuIDopqdcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV9hY3RpdmVfbGl2ZXMnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdzdGF0dXMnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnc3RhcnRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAxOC4gTElWRV9WSUVXRVIg44OG44O844OW44OrIChHU0k6IDIsIFRUTDogN+aXpSlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyDjg6njgqTjg5boppbogbTogIXnrqHnkIbvvIjlsaXmrbTjg7vliIbmnpDlsILnlKjvvIlcclxuICAgIC8vIOODquOCouODq+OCv+OCpOODoOOBruimluiBtOiAheaVsOOBr0xJVkVfU1RSRUFNLnZpZXdlcl9jb3VudOOCkuS9v+eUqFxyXG4gICAgdGhpcy50YWJsZXMubGl2ZVZpZXdlciA9IG5ldyBkeW5hbW9kYi5UYWJsZVYyKHRoaXMsICdMaXZlVmlld2VyVGFibGUnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogYExJVkVfVklFV0VSJHt0YWJsZVN1ZmZpeH1gLFxyXG5cclxuICAgICAgLy8gUEs6IHZpZXdlcl9rZXkgKHN0cmVhbV9pZCNhY2NvdW50X2lkKVxyXG4gICAgICAvLyBTSzogam9pbmVkX2F0XHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAndmlld2VyX2tleScsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2pvaW5lZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcblxyXG4gICAgICAuLi5jb21tb25UYWJsZVByb3BzLFxyXG4gICAgICB0aW1lVG9MaXZlQXR0cmlidXRlOiAndHRsJywgLy8g6YWN5L+h57WC5LqGN+aXpeW+jOOBq+WJiumZpFxyXG5cclxuICAgICAgZ2xvYmFsU2Vjb25kYXJ5SW5kZXhlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTE6IOmFjeS/oeOBruimluiBtOiAheS4gOimp++8iGlzX2FjdGl2ZT10cnVl44Gn44OV44Kj44Or44K/77yJXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0lfc3RyZWFtX3ZpZXdlcnMnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdzdHJlYW1faWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnbGFzdF9waW5nX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTI6IOODpuODvOOCtuODvOOBruimluiBtOWxpeattFxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJX3VzZXJfd2F0Y2hfaGlzdG9yeScsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnam9pbmVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIDE5LiBMSVZFX01PREVSQVRPUiDjg4bjg7zjg5bjg6sgKEdTSTogMSlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyDjg6njgqTjg5bphY3kv6Hjg6Ljg4fjg6zjg7zjgr/jg7znrqHnkIZcclxuICAgIHRoaXMudGFibGVzLmxpdmVNb2RlcmF0b3IgPSBuZXcgZHluYW1vZGIuVGFibGVWMih0aGlzLCAnTGl2ZU1vZGVyYXRvclRhYmxlJywge1xyXG4gICAgICB0YWJsZU5hbWU6IGBMSVZFX01PREVSQVRPUiR7dGFibGVTdWZmaXh9YCxcclxuXHJcbiAgICAgIC8vIFBLOiBzdHJlYW1faWRcclxuICAgICAgLy8gU0s6IG1vZGVyYXRvcl9hY2NvdW50X2lkXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnc3RyZWFtX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnbW9kZXJhdG9yX2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG5cclxuICAgICAgLi4uY29tbW9uVGFibGVQcm9wcyxcclxuXHJcbiAgICAgIGdsb2JhbFNlY29uZGFyeUluZGV4ZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kxOiDjg6Ljg4fjg6zjg7zjgr/jg7zjga7phY3kv6HkuIDopqdcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV9tb2RlcmF0b3Jfc3RyZWFtcycsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ21vZGVyYXRvcl9hY2NvdW50X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2Fzc2lnbmVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIDIwLiBNT0RFUkFUT1JfQUNUSU9OX0xPRyDjg4bjg7zjg5bjg6sgKEdTSTogMilcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyDjg6Ljg4fjg6zjg7zjgr/jg7zjgqLjgq/jgrfjg6fjg7Pjg63jgrBcclxuICAgIHRoaXMudGFibGVzLm1vZGVyYXRvckFjdGlvbkxvZyA9IG5ldyBkeW5hbW9kYi5UYWJsZVYyKHRoaXMsICdNb2RlcmF0b3JBY3Rpb25Mb2dUYWJsZScsIHtcclxuICAgICAgdGFibGVOYW1lOiBgTU9ERVJBVE9SX0FDVElPTl9MT0cke3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyBQSzogbG9nX2lkIChVTElEKVxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2xvZ19pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcblxyXG4gICAgICAuLi5jb21tb25UYWJsZVByb3BzLFxyXG5cclxuICAgICAgZ2xvYmFsU2Vjb25kYXJ5SW5kZXhlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTE6IOmFjeS/oeOBruOCouOCr+OCt+ODp+ODs+ODreOCsFxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJX3N0cmVhbV9hY3Rpb25zJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnc3RyZWFtX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2NyZWF0ZWRfYXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMjog44Oi44OH44Os44O844K/44O844Gu44Ki44Kv44K344On44Oz5bGl5q20XHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0lfbW9kZXJhdG9yX2FjdGlvbnMnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdtb2RlcmF0b3JfYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIDIxLiBMSVZFX0NIQVQg44OG44O844OW44OrIChHU0k6IDEsIFRUTDogN+aXpSlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyDjg6njgqTjg5bjg4Hjg6Pjg4Pjg4jnrqHnkIbvvIhXZWJTb2NrZXTlr77lv5zvvIlcclxuICAgIHRoaXMudGFibGVzLmxpdmVDaGF0ID0gbmV3IGR5bmFtb2RiLlRhYmxlVjIodGhpcywgJ0xpdmVDaGF0VGFibGUnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogYExJVkVfQ0hBVCR7dGFibGVTdWZmaXh9YCxcclxuXHJcbiAgICAgIC8vIFBLOiBzdHJlYW1faWRcclxuICAgICAgLy8gU0s6IGNoYXRfaWQgKFVMSUQpXHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnc3RyZWFtX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnY2hhdF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcblxyXG4gICAgICAuLi5jb21tb25UYWJsZVByb3BzLFxyXG4gICAgICB0aW1lVG9MaXZlQXR0cmlidXRlOiAndHRsJywgLy8g6YWN5L+h57WC5LqGN+aXpeW+jOOBq+WJiumZpFxyXG5cclxuICAgICAgZ2xvYmFsU2Vjb25kYXJ5SW5kZXhlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTE6IOODpuODvOOCtuODvOOBruODgeODo+ODg+ODiOWxpeattO+8iOOCueODkeODoOaknOWHuueUqO+8iVxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJX3VzZXJfY2hhdF9oaXN0b3J5JyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkX2F0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIDIyLiBMSVZFX0dJRlQg44OG44O844OW44OrIChHU0k6IDMsIFRUTDogMzDml6UpXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8g44Op44Kk44OW44Ku44OV44OI566h55CG77yI5bCG5p2l44Gu5Y+O55uK5YyW55So77yJXHJcbiAgICB0aGlzLnRhYmxlcy5saXZlR2lmdCA9IG5ldyBkeW5hbW9kYi5UYWJsZVYyKHRoaXMsICdMaXZlR2lmdFRhYmxlJywge1xyXG4gICAgICB0YWJsZU5hbWU6IGBMSVZFX0dJRlQke3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyBQSzogZ2lmdF9pZCAoVUxJRClcclxuICAgICAgLy8gU0s6IGNyZWF0ZWRfYXRcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdnaWZ0X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcblxyXG4gICAgICAuLi5jb21tb25UYWJsZVByb3BzLFxyXG4gICAgICB0aW1lVG9MaXZlQXR0cmlidXRlOiAndHRsJywgLy8g6YWN5L+h57WC5LqGMzDml6XlvozjgavliYrpmaRcclxuXHJcbiAgICAgIGdsb2JhbFNlY29uZGFyeUluZGV4ZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kxOiDphY3kv6Hjga7jgq7jg5Xjg4jkuIDopqdcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV9zdHJlYW1fZ2lmdHMnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdzdHJlYW1faWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kyOiDpgIHkv6HogIXjga7jgq7jg5Xjg4jlsaXmrbRcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV9zZW5kZXJfZ2lmdHMnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdmcm9tX2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kzOiDlj5fkv6HogIXjga7jgq7jg5Xjg4jlsaXmrbRcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV9yZWNlaXZlcl9naWZ0cycsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3RvX2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAyMy4gUFJPRFVDVCDjg4bjg7zjg5bjg6sgKEdTSTogMywgVFRMOiA5MOaXpSlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyDllYblk4HnrqHnkIZcclxuICAgIC8vIHNhbGVfcHJpY2Xov73liqDvvIjpgY7ljrvjga7kvJroqbHjgafmsbrlrprvvIlcclxuICAgIHRoaXMudGFibGVzLnByb2R1Y3QgPSBuZXcgZHluYW1vZGIuVGFibGVWMih0aGlzLCAnUHJvZHVjdFRhYmxlJywge1xyXG4gICAgICB0YWJsZU5hbWU6IGBQUk9EVUNUJHt0YWJsZVN1ZmZpeH1gLFxyXG5cclxuICAgICAgLy8gUEs6IHByb2R1Y3RfaWQgKFVMSUQpXHJcbiAgICAgIC8vIFNLOiBjcmVhdGVkX2F0XHJcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAncHJvZHVjdF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2NyZWF0ZWRfYXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG5cclxuICAgICAgLi4uY29tbW9uVGFibGVQcm9wcyxcclxuICAgICAgdGltZVRvTGl2ZUF0dHJpYnV0ZTogJ3R0bCcsIC8vIOWJiumZpOW+jDkw5pel44Gn54mp55CG5YmK6ZmkXHJcblxyXG4gICAgICBnbG9iYWxTZWNvbmRhcnlJbmRleGVzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMTog5Ye65ZOB6ICF44Gu5ZWG5ZOB5LiA6KanXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0lfc2VsbGVyX3Byb2R1Y3RzJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnc2VsbGVyX2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kyOiDjgqvjg4bjgrTjg6rjg7zliKXllYblk4HkuIDopqdcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV9jYXRlZ29yeV9wcm9kdWN0cycsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2NhdGVnb3J5JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2NyZWF0ZWRfYXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMzog44K544OG44O844K/44K55Yil5ZWG5ZOB5LiA6KanXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0lfc3RhdHVzX3Byb2R1Y3RzJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnc3RhdHVzJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2NyZWF0ZWRfYXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gMjQuIFBST0RVQ1RfVEFHIOODhuODvOODluODqyAoR1NJOiAyKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIOaKleeov+OBuOOBruWVhuWTgeOCv+OCsOS7mOOBkVxyXG4gICAgdGhpcy50YWJsZXMucHJvZHVjdFRhZyA9IG5ldyBkeW5hbW9kYi5UYWJsZVYyKHRoaXMsICdQcm9kdWN0VGFnVGFibGUnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogYFBST0RVQ1RfVEFHJHt0YWJsZVN1ZmZpeH1gLFxyXG5cclxuICAgICAgLy8gUEs6IHBvc3RfaWRcclxuICAgICAgLy8gU0s6IHByb2R1Y3RfaWRcclxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdwb3N0X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgc29ydEtleTogeyBuYW1lOiAncHJvZHVjdF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcblxyXG4gICAgICAuLi5jb21tb25UYWJsZVByb3BzLFxyXG5cclxuICAgICAgZ2xvYmFsU2Vjb25kYXJ5SW5kZXhlczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTE6IOWVhuWTgeOBjOOCv+OCsOS7mOOBkeOBleOCjOOBn+aKleeov+S4gOimp1xyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJX3Byb2R1Y3RfcG9zdHMnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdwcm9kdWN0X2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ3RhZ2dlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kyOiDjg6bjg7zjgrbjg7zjga7jgr/jgrDku5jjgZHlsaXmrbRcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV91c2VyX3RhZ3MnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICd0YWdnZWRfYnlfYWNjb3VudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBzb3J0S2V5OiB7IG5hbWU6ICd0YWdnZWRfYXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gMjUuIENPTlZFUlNBVElPTiDjg4bjg7zjg5bjg6sgKEdTSTogMilcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyBETeS8muipseeuoeeQhlxyXG4gICAgdGhpcy50YWJsZXMuY29udmVyc2F0aW9uID0gbmV3IGR5bmFtb2RiLlRhYmxlVjIodGhpcywgJ0NvbnZlcnNhdGlvblRhYmxlJywge1xyXG4gICAgICB0YWJsZU5hbWU6IGBDT05WRVJTQVRJT04ke3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyBQSzogY29udmVyc2F0aW9uX2lkIChVTElEKVxyXG4gICAgICAvLyBTSzogY3JlYXRlZF9hdFxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2NvbnZlcnNhdGlvbl9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2NyZWF0ZWRfYXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiB9LFxyXG5cclxuICAgICAgLi4uY29tbW9uVGFibGVQcm9wcyxcclxuXHJcbiAgICAgIGdsb2JhbFNlY29uZGFyeUluZGV4ZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kxOiDlj4LliqDogIUx44Gu5Lya6Kmx5LiA6KanXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0lfcGFydGljaXBhbnQxX2NvbnZlcnNhdGlvbnMnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdwYXJ0aWNpcGFudF8xX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2xhc3RfbWVzc2FnZV9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kyOiDlj4LliqDogIUy44Gu5Lya6Kmx5LiA6KanXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0lfcGFydGljaXBhbnQyX2NvbnZlcnNhdGlvbnMnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdwYXJ0aWNpcGFudF8yX2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2xhc3RfbWVzc2FnZV9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAyNi4gTUVTU0FHRSDjg4bjg7zjg5bjg6sgKEdTSTogMSwgVFRMOiA5MOaXpSlcclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyBETeODoeODg+OCu+ODvOOCuOeuoeeQhlxyXG4gICAgdGhpcy50YWJsZXMubWVzc2FnZSA9IG5ldyBkeW5hbW9kYi5UYWJsZVYyKHRoaXMsICdNZXNzYWdlVGFibGUnLCB7XHJcbiAgICAgIHRhYmxlTmFtZTogYE1FU1NBR0Uke3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyBQSzogY29udmVyc2F0aW9uX2lkXHJcbiAgICAgIC8vIFNLOiBtZXNzYWdlX2lkIChVTElEKVxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2NvbnZlcnNhdGlvbl9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ21lc3NhZ2VfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG5cclxuICAgICAgLi4uY29tbW9uVGFibGVQcm9wcyxcclxuICAgICAgdGltZVRvTGl2ZUF0dHJpYnV0ZTogJ3R0bCcsIC8vIOS8muipseWJiumZpOW+jDkw5pel44Gn54mp55CG5YmK6ZmkXHJcblxyXG4gICAgICBnbG9iYWxTZWNvbmRhcnlJbmRleGVzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgLy8gR1NJMTog6YCB5L+h6ICF44Gu44Oh44OD44K744O844K45bGl5q20XHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0lfc2VuZGVyX21lc3NhZ2VzJyxcclxuICAgICAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnc2VuZGVyX2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZF9hdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyAyNy4gQU5BTFlUSUNTIOODhuODvOODluODqyAoR1NJOiAzLCBUVEw6IDkw5pelKVxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIOOCouOCr+OCu+OCueino+aekOODh+ODvOOCv1xyXG4gICAgdGhpcy50YWJsZXMuYW5hbHl0aWNzID0gbmV3IGR5bmFtb2RiLlRhYmxlVjIodGhpcywgJ0FuYWx5dGljc1RhYmxlJywge1xyXG4gICAgICB0YWJsZU5hbWU6IGBBTkFMWVRJQ1Mke3RhYmxlU3VmZml4fWAsXHJcblxyXG4gICAgICAvLyBQSzogZGF0ZSAoWVlZWS1NTS1ERClcclxuICAgICAgLy8gU0s6IGV2ZW50X2lkIChVTElEKVxyXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2RhdGUnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdldmVudF9pZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXHJcblxyXG4gICAgICAuLi5jb21tb25UYWJsZVByb3BzLFxyXG4gICAgICB0aW1lVG9MaXZlQXR0cmlidXRlOiAndHRsJywgLy8gOTDml6XlvozjgavliYrpmaRcclxuXHJcbiAgICAgIGdsb2JhbFNlY29uZGFyeUluZGV4ZXM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kxOiDjg6bjg7zjgrbjg7zjga7jgqTjg5njg7Pjg4jlsaXmrbRcclxuICAgICAgICAgIGluZGV4TmFtZTogJ0dTSV91c2VyX2V2ZW50cycsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2FjY291bnRfaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgc29ydEtleTogeyBuYW1lOiAndGltZXN0YW1wJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIC8vIEdTSTI6IOOCpOODmeODs+ODiOOCv+OCpOODl+WIpembhuioiFxyXG4gICAgICAgICAgaW5kZXhOYW1lOiAnR1NJX2V2ZW50X3R5cGUnLFxyXG4gICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdldmVudF90eXBlJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ3RpbWVzdGFtcCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAvLyBHU0kzOiDlr77osaHliKXjgqTjg5njg7Pjg4jvvIh0YXJnZXRfaWTjga9GaWx0ZXJFeHByZXNzaW9u44Gn57We44KK6L6844KA77yJXHJcbiAgICAgICAgICBpbmRleE5hbWU6ICdHU0lfdGFyZ2V0X2V2ZW50cycsXHJcbiAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3RhcmdldF90eXBlJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ3RpbWVzdGFtcCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyDlhagyN+ODhuODvOODluODq+S9nOaIkOWujOS6hlxyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG4gICAgLy8gQ2xvdWRGb3JtYXRpb24gT3V0cHV0c1xyXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIE9iamVjdC5lbnRyaWVzKHRoaXMudGFibGVzKS5mb3JFYWNoKChbbmFtZSwgdGFibGVdKSA9PiB7XHJcbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIGAke25hbWV9VGFibGVOYW1lYCwge1xyXG4gICAgICAgIHZhbHVlOiB0YWJsZS50YWJsZU5hbWUsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IGAke25hbWV9IHRhYmxlIG5hbWVgLFxyXG4gICAgICAgIGV4cG9ydE5hbWU6IGBQaWVjZUFwcC0ke25hbWV9LVRhYmxlTmFtZS0ke2Vudmlyb25tZW50fWAsXHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiJdfQ==