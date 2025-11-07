# バックエンドAPI実装状況 - Piece App

**最終更新**: 2025年1月
**ステータス**: Phase 3完了（84 Lambda関数実装済み）

---

## 📊 実装サマリー

| カテゴリ | Lambda関数数 | APIエンドポイント数 | ステータス |
|---------|------------|------------------|----------|
| **Phase 1: Core Backend** | 16 | 16 | ✅ 完了 |
| **Stage 2A: 既存機能拡張** | 14 | 14 | ✅ 完了 |
| **Stage 2B: Analytics** | 4 | 4 | ✅ 完了 |
| **Stage 2C: Product/Shop** | 8 | 8 | ✅ 完了 |
| **Stage 2D: Report/Notification等** | 15 | 15 | ✅ 完了 |
| **Stage 2E: Block/Message** | 8 | 8 | ✅ 完了 |
| **Phase 3: Live Streaming** | 17 | 14 + WebSocket | ✅ 完了 |
| **Cognito Trigger** | 1 | N/A | ✅ 完了 |
| **Mux Webhook** | 1 | 1 | ✅ 完了 |
| **合計** | **84** | **80** | ✅ |

---

## 🎯 実装済み Lambda 関数一覧（84個）

### Phase 1: Core Backend (16関数)

#### Account管理 (3)
1. `createAccount` - アカウント作成
2. `getProfile` - プロフィール取得
3. `updateProfile` - プロフィール更新

#### Post管理 (4)
4. `createPost` - 投稿作成
5. `getPost` - 投稿詳細取得
6. `deletePost` - 投稿削除
7. `getTimeline` - タイムライン取得

#### Like機能 (2)
8. `likePost` - いいね
9. `unlikePost` - いいね解除

#### Comment機能 (3)
10. `createComment` - コメント作成
11. `getComments` - コメント一覧取得
12. `deleteComment` - コメント削除

#### Follow機能 (2)
13. `followUser` - フォロー
14. `unfollowUser` - フォロー解除

#### Room機能 (2)
15. `createRoom` - ルーム作成
16. `joinRoom` - ルーム参加

---

### Stage 2A: 既存機能拡張 (14関数)

#### Post拡張 (4)
17. `updatePost` - 投稿更新
18. `getUserPosts` - ユーザー投稿一覧
19. `getDiscoveryFeed` - 発見フィード
20. `getRoomPosts` - ルーム投稿一覧

#### Follow拡張 (2)
21. `getFollowing` - フォロー中一覧
22. `getFollowers` - フォロワー一覧

#### Like拡張 (2)
23. `getPostLikes` - 投稿のいいね一覧
24. `getUserLikes` - ユーザーのいいね一覧

#### Repost機能 (4)
25. `createRepost` - リポスト作成
26. `deleteRepost` - リポスト削除
27. `getUserReposts` - ユーザーのリポスト一覧
28. `getPostReposts` - 投稿のリポスト一覧

#### Room拡張 (4)
29. `getRoom` - ルーム詳細取得
30. `updateRoom` - ルーム更新
31. `getRoomMembers` - ルームメンバー一覧
32. `leaveRoom` - ルーム退出

---

### Stage 2B: Analytics (4関数)

33. `trackEvent` - イベント追跡
34. `getPostAnalytics` - 投稿分析データ取得
35. `getAccountAnalytics` - アカウント分析データ取得
36. `getDashboard` - ダッシュボードデータ取得

---

### Stage 2C: Product/Shop (8関数)

#### 商品CRUD (5)
37. `createProduct` - 商品作成（ショップアカウントのみ）
38. `getProduct` - 商品詳細取得
39. `updateProduct` - 商品更新
40. `deleteProduct` - 商品削除（論理削除）
41. `getProducts` - 商品一覧取得（フィルタ付き）

#### 商品タグ機能 (3)
42. `tagProductOnPost` - 投稿に商品タグ付け（最大5個）
43. `getPostProducts` - 投稿の商品一覧取得
44. `clickProduct` - 商品クリック追跡

---

### Stage 2D: Report/Notification/Session/Hashtag/Mute (15関数)

#### Report (2)
45. `createReport` - 通報作成
46. `getReports` - 通報一覧取得（管理者用）

#### Notification (5)
47. `getNotifications` - 通知一覧取得
48. `markAsRead` - 通知既読化
49. `markAllAsRead` - 全通知既読化
50. `getNotificationSettings` - 通知設定取得
51. `updateNotificationSettings` - 通知設定更新

#### Session (3)
52. `createSession` - セッション作成
53. `getAllAccountSessions` - 全セッション取得
54. `logoutSession` - セッション削除

#### Hashtag (2)
55. `searchByHashtag` - ハッシュタグ検索
56. `getTrendingHashtags` - トレンドハッシュタグ取得

#### Mute (3)
57. `muteUser` - ユーザーミュート
58. `unmuteUser` - ユーザーミュート解除
59. `getMutedUsers` - ミュート一覧取得

---

### Stage 2E: Block/Conversation/Message (8関数)

#### Block (3)
60. `blockUser` - ユーザーブロック
61. `unblockUser` - ブロック解除
62. `getBlockList` - ブロックリスト取得

#### Conversation (2)
63. `createConversation` - 会話作成
64. `getConversations` - 会話一覧取得

#### Message (2)
65. `sendMessage` - メッセージ送信
66. `getMessages` - メッセージ取得

---

### Phase 3: Live Streaming (17関数) ✅ 新規実装

#### REST API Lambda (14)
67. `createLiveStream` - ライブ配信作成（Mux連携）
68. `getLiveStream` - ライブ配信情報取得
69. `getLiveStreams` - ライブ配信一覧取得
70. `endLiveStream` - ライブ配信終了
71. `deleteLiveStream` - ライブ配信削除
72. `joinLiveStream` - ライブ配信参加
73. `leaveLiveStream` - ライブ配信退出
74. `sendLiveChat` - ライブチャット送信
75. `getLiveChats` - ライブチャット取得
76. `sendGift` - ギフト送信（収益化機能）
77. `addModerator` - モデレーター追加
78. `banUserFromLive` - ユーザーBAN
79. `muxWebhook` - Mux Webhook受信

#### WebSocket Lambda (3)
80. `wsConnect` - WebSocket接続
81. `wsDisconnect` - WebSocket切断
82. `wsMessage` - WebSocketメッセージ処理

---

### Special Functions (2)

83. `postConfirmation` - Cognito PostConfirmation Trigger
84. `muxWebhook` - Mux Webhook Handler

---

## 🌐 APIエンドポイント一覧（80個）

### Account (3)
- `POST /accounts` - アカウント作成
- `GET /accounts/me` - プロフィール取得
- `PUT /accounts/me` - プロフィール更新

### Post (10)
- `POST /posts` - 投稿作成
- `GET /posts/{post_id}` - 投稿詳細
- `PUT /posts/{post_id}` - 投稿更新
- `DELETE /posts/{post_id}` - 投稿削除
- `GET /timeline` - タイムライン
- `GET /feed/discovery` - 発見フィード
- `GET /accounts/{account_id}/posts` - ユーザー投稿一覧
- `POST /posts/{post_id}/like` - いいね
- `DELETE /posts/{post_id}/like` - いいね解除
- `GET /posts/{post_id}/likes` - いいね一覧

### Comment (3)
- `POST /posts/{post_id}/comments` - コメント作成
- `GET /posts/{post_id}/comments` - コメント一覧
- `DELETE /comments/{comment_id}` - コメント削除

### Follow (4)
- `POST /accounts/{account_id}/follow` - フォロー
- `DELETE /accounts/{account_id}/follow` - フォロー解除
- `GET /accounts/{account_id}/following` - フォロー中一覧
- `GET /accounts/{account_id}/followers` - フォロワー一覧

### Repost (4)
- `POST /posts/{post_id}/repost` - リポスト作成
- `DELETE /reposts/{repost_id}` - リポスト削除
- `GET /accounts/{account_id}/reposts` - ユーザーリポスト一覧
- `GET /posts/{post_id}/reposts` - 投稿のリポスト一覧

### Room (8)
- `POST /rooms` - ルーム作成
- `GET /rooms/{room_id}` - ルーム詳細
- `PUT /rooms/{room_id}` - ルーム更新
- `POST /rooms/{room_id}/join` - ルーム参加
- `DELETE /rooms/{room_id}/members/me` - ルーム退出
- `GET /rooms/{room_id}/members` - ルームメンバー一覧
- `GET /rooms/{room_id}/posts` - ルーム投稿一覧

### Product (8)
- `POST /products` - 商品作成
- `GET /products` - 商品一覧
- `GET /products/{product_id}` - 商品詳細
- `PUT /products/{product_id}` - 商品更新
- `DELETE /products/{product_id}` - 商品削除
- `POST /products/{product_id}/click` - クリック追跡
- `POST /posts/{post_id}/products` - 商品タグ付け
- `GET /posts/{post_id}/products` - 投稿の商品一覧

### Analytics (4)
- `POST /analytics/events` - イベント追跡
- `GET /posts/{post_id}/analytics` - 投稿分析
- `GET /accounts/{account_id}/analytics` - アカウント分析
- `GET /dashboard` - ダッシュボード

### Report (2)
- `POST /reports` - 通報作成
- `GET /reports` - 通報一覧（管理者）

### Notification (5)
- `GET /notifications` - 通知一覧
- `PUT /notifications/{notification_id}/read` - 既読化
- `PUT /notifications/read-all` - 全既読化
- `GET /notifications/settings` - 通知設定取得
- `PUT /notifications/settings` - 通知設定更新

### Session (3)
- `POST /sessions` - セッション作成
- `GET /sessions` - セッション一覧
- `DELETE /sessions/{session_id}` - ログアウト

### Hashtag (2)
- `GET /hashtags/{hashtag}` - ハッシュタグ検索
- `GET /hashtags/trending` - トレンドハッシュタグ

### Mute (3)
- `POST /mute` - ユーザーミュート
- `DELETE /mute/{account_id}` - ミュート解除
- `GET /mute` - ミュート一覧

### Block (3)
- `POST /block` - ユーザーブロック
- `DELETE /block/{account_id}` - ブロック解除
- `GET /block` - ブロックリスト

### DM/Message (4)
- `POST /conversations` - 会話作成
- `GET /conversations` - 会話一覧
- `POST /conversations/{conversation_id}/messages` - メッセージ送信
- `GET /conversations/{conversation_id}/messages` - メッセージ取得

### Like拡張 (1)
- `GET /accounts/{account_id}/likes` - ユーザーのいいね一覧

### Live Streaming (14) ✅ 新規
- `POST /live-streams` - ライブ配信作成
- `GET /live-streams` - ライブ配信一覧
- `GET /live-streams/{stream_id}` - ライブ配信詳細
- `POST /live-streams/{stream_id}/end` - ライブ配信終了
- `DELETE /live-streams/{stream_id}` - ライブ配信削除
- `POST /live-streams/{stream_id}/join` - ライブ配信参加
- `POST /live-streams/{stream_id}/leave` - ライブ配信退出
- `POST /live-streams/{stream_id}/chat` - チャット送信
- `GET /live-streams/{stream_id}/chat` - チャット取得
- `POST /live-streams/{stream_id}/gift` - ギフト送信
- `POST /live-streams/{stream_id}/moderators` - モデレーター追加
- `POST /live-streams/{stream_id}/ban` - ユーザーBAN

### WebSocket Routes (3) ✅ 新規
- `$connect` - WebSocket接続
- `$disconnect` - WebSocket切断
- `$default` - メッセージ処理（ping/join_stream/leave_stream/broadcast）

### Webhook (1)
- `POST /webhooks/mux` - Mux Webhook（配信開始・終了通知）

---

## 🗄️ DynamoDBテーブル使用状況（28テーブル）

| No. | テーブル名 | 用途 | GSI数 | TTL | ステータス |
|-----|-----------|------|-------|-----|----------|
| 1 | ACCOUNT | アカウント情報 | 3 | ❌ | ✅ |
| 2 | SESSION | セッション管理 | 1 | ✅ | ✅ |
| 3 | POST | 投稿データ | 4 | ✅ | ✅ |
| 4 | HASHTAG_INDEX | ハッシュタグ検索 | 0 | ❌ | ✅ |
| 5 | HASHTAG_COUNT | トレンドハッシュタグ | 1 | ✅ | ✅ |
| 6 | FOLLOW | フォロー関係 | 2 | ❌ | ✅ |
| 7 | LIKE | いいね | 1 | ❌ | ✅ |
| 8 | COMMENT | コメント | 2 | ✅ | ✅ |
| 9 | ROOM | ルーム | 2 | ❌ | ✅ |
| 10 | ROOM_MEMBER | ルームメンバー | 1 | ❌ | ✅ |
| 11 | NOTIFICATION | 通知 | 2 | ✅ | ✅ |
| 12 | NOTIFICATION_SETTINGS | 通知設定 | 0 | ❌ | ✅ |
| 13 | REPORT | 通報 | 2 | ✅ | ✅ |
| 14 | REPOST | リポスト | 2 | ❌ | ✅ |
| 15 | BLOCK | ブロック | 1 | ❌ | ✅ |
| 16 | MUTED_ACCOUNTS | ミュート | 0 | ❌ | ✅ |
| 17 | CONVERSATION | 会話 | 2 | ❌ | ✅ |
| 18 | MESSAGE | メッセージ | 1 | ✅ | ✅ |
| 19 | LIVE_STREAM | ライブ配信 | 3 | ✅ | ✅ |
| 20 | LIVE_VIEWER | ライブ視聴者 | 2 | ✅ | ✅ |
| 21 | LIVE_CHAT | ライブチャット | 1 | ✅ | ✅ |
| 22 | LIVE_GIFT | ギフト | 3 | ✅ | ✅ |
| 23 | LIVE_MODERATOR | モデレーター | 1 | ❌ | ✅ |
| 24 | MODERATOR_ACTION_LOG | モデレーターログ | 1 | ✅ | ✅ |
| 25 | PRODUCT | 商品 | 3 | ✅ | ✅ |
| 26 | PRODUCT_TAG | 商品タグ | 2 | ❌ | ✅ |
| 27 | ANALYTICS | 分析データ | 3 | ✅ | ✅ |
| 28 | CONNECTIONS | WebSocket接続 | 2 | ✅ | ✅ |

---

## 🏗️ アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                    Expo/React Native App                    │
│                  (iOS / Android / Web)                      │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ HTTPS / WSS
                │
┌───────────────▼─────────────────────────────────────────────┐
│                    AWS API Gateway                          │
│  ┌──────────────────────┬───────────────────────────────┐  │
│  │   REST API (80)      │   WebSocket API (3 routes)    │  │
│  │  - Cognito Authorizer│   - Connection Management      │  │
│  │  - Request Validator │   - Real-time Chat             │  │
│  └──────────────────────┴───────────────────────────────┘  │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ Invoke
                │
┌───────────────▼─────────────────────────────────────────────┐
│                  AWS Lambda (84 Functions)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Account (3)  │ Post (10)    │ Comment (3) │ Follow(4)│  │
│  │ Repost (4)   │ Room (8)     │ Product (8) │ Analytics│  │
│  │ Report (2)   │ Notif (5)    │ Session (3) │ Hashtag  │  │
│  │ Mute (3)     │ Block (3)    │ Message (4) │ Live(17) │  │
│  │ WebSocket(3) │ Special (2)                            │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────┬─────────────────────────────────────────────┘
                │
      ┌─────────┼─────────┬─────────┬──────────┐
      │         │         │         │          │
┌─────▼───┐ ┌──▼────┐ ┌──▼─────┐ ┌▼─────────┐ ┌──▼───────┐
│DynamoDB │ │ S3    │ │Cognito │ │ Secrets  │ │   Mux    │
│(28 TB)  │ │Media  │ │UserPool│ │ Manager  │ │(Ready)   │
└─────────┘ └───────┘ └────────┘ └──────────┘ └──────────┘
```

### 主要サービス使用状況

| サービス | 用途 | ステータス |
|---------|------|----------|
| **API Gateway** | REST API (80エンドポイント) | ✅ 実装済み |
| **WebSocket API** | リアルタイムチャット（3ルート） | ✅ 実装済み |
| **Lambda** | サーバーレス関数 (84個) | ✅ 実装済み |
| **DynamoDB** | NoSQLデータベース (28テーブル) | ✅ 実装済み |
| **S3** | メディアストレージ | ✅ 実装済み |
| **Cognito** | 認証・認可 | ✅ 実装済み |
| **Secrets Manager** | Mux認証情報管理 | ✅ 実装済み |
| **CloudWatch** | ログ・モニタリング | ✅ 自動設定 |
| **X-Ray** | トレーシング | ✅ 自動設定 |
| **Mux** | ライブストリーミング | ⚠️ 設定待ち |

---

## 📦 実装済み機能詳細

### 1. Account Management
- ✅ アカウント作成（Cognito連携）
- ✅ プロフィール取得・更新
- ✅ アカウントタイプ（user/shop）
- ✅ ハンドル変更制限（30日1回、生涯3回）
- ✅ プロフィール画像・バナー画像（S3）
- ✅ セッション管理（マルチデバイス対応）

### 2. Post & Feed
- ✅ 投稿作成（テキスト・画像・動画・Wave）
- ✅ 投稿更新・削除（論理削除、90日後物理削除）
- ✅ タイムライン（フォロー中の投稿）
- ✅ 発見フィード（パブリック投稿）
- ✅ ユーザー投稿一覧
- ✅ ルーム投稿一覧
- ✅ ハッシュタグ（自動抽出・検索・トレンド）
- ✅ 公開範囲設定（public/followers/room/private）

### 3. Social Features
- ✅ フォロー・フォロー解除
- ✅ フォロワー・フォロー中一覧
- ✅ いいね・いいね解除
- ✅ いいね一覧（投稿別・ユーザー別）
- ✅ コメント作成・削除
- ✅ コメント一覧（ページネーション付き）
- ✅ リポスト作成・削除（引用リポスト対応）
- ✅ リポスト一覧（投稿別・ユーザー別）

### 4. Room Features
- ✅ ルーム作成（カテゴリ・ルール設定）
- ✅ ルーム詳細・更新
- ✅ ルーム参加・退出
- ✅ ルームメンバー一覧
- ✅ ルーム投稿（通常タイムライン＋ルームタイムライン両方に表示）

### 5. Product/Shop Features
- ✅ 商品作成（ショップアカウント限定）
- ✅ 商品詳細・更新・削除（論理削除）
- ✅ 商品一覧（カテゴリ・販売者・ステータスでフィルタ）
- ✅ 商品タグ（投稿に最大5個）
- ✅ クリック追跡（view_count、click_count）
- ✅ 外部リンク誘導（Shopify、Amazon等）またはDM誘導
- ✅ 通貨対応（JPY、USD）
- ✅ S3画像URL検証

### 6. Analytics
- ✅ イベント追跡（カスタムイベント、90日保持）
- ✅ 投稿分析（閲覧数、エンゲージメント率）
- ✅ アカウント分析（フォロワー増減、投稿数）
- ✅ ダッシュボード（概要データ、最近のアクティビティ）

### 7. Notification System
- ✅ 通知一覧（未読フィルタ対応）
- ✅ 通知既読化（個別・全件）
- ✅ 通知設定（プッシュ・メール・タイプ別ON/OFF）
- ✅ 通知タイプ（フォロー、いいね、コメント、リポスト、メンション、DM）
- ✅ 90日自動削除（TTL）

### 8. Moderation & Safety
- ✅ ユーザーブロック・解除
- ✅ ブロックリスト取得
- ✅ ユーザーミュート・解除（タイムライン非表示）
- ✅ ミュートリスト取得
- ✅ 通報機能（投稿・アカウント・コメント）
- ✅ 通報一覧（管理者用、ステータス管理）
- ✅ スナップショット保存（通報時の証拠保全）

### 9. Direct Message
- ✅ 会話作成（1対1、グループ対応）
- ✅ 会話一覧（最終メッセージ表示）
- ✅ メッセージ送信（テキスト・画像・ギフト対応）
- ✅ メッセージ取得（ページネーション）
- ✅ 既読管理（未読カウント）

### 10. Hashtag & Search
- ✅ ハッシュタグ自動抽出（投稿作成時）
- ✅ ハッシュタグ検索（正規化、#除去）
- ✅ トレンドハッシュタグ（期間別：daily/weekly/all_time）
- ✅ ハッシュタグカウント更新

### 11. Session Management
- ✅ マルチデバイスログイン
- ✅ セッション作成（デバイス情報記録）
- ✅ 全セッション一覧
- ✅ セッション削除（リモートログアウト）
- ✅ 30日自動削除（TTL）

### 12. Live Streaming ✅ NEW
- ✅ **配信作成**（Mux API連携、RTMP URL生成）
- ✅ **配信管理**（開始・終了、削除）
- ✅ **配信情報取得**（詳細・一覧、フィルタ付き）
- ✅ **視聴者管理**（参加・退出、視聴者数カウント）
- ✅ **視聴履歴**（視聴時間、再参加回数、ピーク視聴者数）
- ✅ **リアルタイムチャット**（WebSocket、送信・取得）
- ✅ **ギフト機能**（収益化準備、送信・記録）
- ✅ **モデレーション**（モデレーター追加、ユーザーBAN）
- ✅ **アクションログ**（モデレーター操作履歴、30日保存）
- ✅ **Webhook連携**（配信開始・終了の自動検知）
- ✅ **WebSocket API**（接続管理、ping/pong、broadcast）
- ✅ **HLS配信**（Mux Playback ID経由）
- ✅ **自動VOD化**（配信終了後にアーカイブ作成）

---

## 🚀 次のステップ

### 🔴 最優先: Mux設定（必須）

#### 1. Muxアカウント作成
```bash
# 1. アカウント登録
https://dashboard.mux.com/signup

# 必要事項:
- メールアドレス
- クレジットカード（無料枠あり）
```

#### 2. Mux API認証情報の取得

##### Access Token ID と Secret Key
```bash
# Muxダッシュボード
1. Settings → Access Tokens に移動
2. "Generate new token" をクリック
3. 権限設定:
   ✅ Mux Video: Full Access
4. "Generate Token" をクリック
5. 表示される情報をコピー:
   - Access Token ID: abcd1234-efgh-5678-ijkl-9012mnopqrst
   - Secret Key: xyz123456789abcdef... (1回のみ表示)
```

##### Webhook Secret
```bash
# Webhook設定
1. Settings → Webhooks に移動
2. "Create new webhook" をクリック
3. Webhook URL入力（後で更新可能）:
   https://your-api-endpoint.com/webhooks/mux
4. イベント選択:
   ✅ video.live_stream.active     # 配信開始
   ✅ video.live_stream.idle       # 配信終了
   ✅ video.live_stream.recording  # 録画開始
   ✅ video.asset.ready            # VOD準備完了
5. "Create Webhook" をクリック
6. "Signing Secret" をコピー:
   - whsec_1234567890abcdef...
```

#### 3. AWS Secrets Managerに保存

##### 方法1: AWS CLI
```bash
aws secretsmanager put-secret-value \
  --secret-id rork/mux-credentials \
  --secret-string '{
    "accessTokenId": "あなたのAccess Token ID",
    "secretKey": "あなたのSecret Key",
    "webhookSecret": "あなたのWebhook Secret"
  }' \
  --region ap-northeast-1
```

##### 方法2: AWSコンソール
```bash
1. AWS Console → Secrets Manager に移動
2. シークレット名 "rork/mux-credentials" を検索
3. "Retrieve secret value" → "Edit" をクリック
4. JSON形式で入力:
{
  "accessTokenId": "あなたのAccess Token ID",
  "secretKey": "あなたのSecret Key",
  "webhookSecret": "あなたのWebhook Secret"
}
5. "Save" をクリック
```

#### 4. 環境変数の確認
```typescript
// Lambda関数は自動的にSecrets Managerから取得
// 手動設定は不要
```

---

### 🟠 高優先度: パッケージインストール

```bash
# backend/srcディレクトリ
cd backend/src

# Mux & AWS SDK パッケージをインストール
npm install @mux/mux-node@^7.3.3
npm install @aws-sdk/client-secrets-manager@^3.699.0
npm install @aws-sdk/client-apigatewaymanagementapi@^3.699.0

# TypeScript型定義も自動インストールされる
```

---

### 🟠 高優先度: DynamoDB GSI追加

LIVE_STREAMテーブルに`mux_live_stream_id`用のGSIを追加（Webhook検索用）:

```typescript
// backend/infrastructure/lib/dynamodb-stack.ts
// LIVE_STREAMテーブルのglobalSecondaryIndexesに追加:

{
  // GSI4: Mux Live Stream IDで検索（Webhook用）
  indexName: 'GSI_mux_live_stream',
  partitionKey: { name: 'mux_live_stream_id', type: dynamodb.AttributeType.STRING },
}
```

---

### 🟠 高優先度: インフラデプロイ

```bash
# backend/infrastructureディレクトリ
cd backend/infrastructure

# TypeScriptビルド
npm run build

# CDKスタックをデプロイ
cdk deploy --all

# デプロイされるスタック:
# 1. PieceApp-DynamoDB-Dev (28テーブル)
# 2. PieceApp-S3-Dev
# 3. PieceApp-SecretsManager-Dev ← NEW
# 4. PieceApp-Lambda-Dev (84関数)
# 5. PieceApp-WebSocket-Dev ← NEW
# 6. PieceApp-Cognito-Dev
# 7. PieceApp-ApiGateway-Dev (80エンドポイント)
```

---

### 🟠 高優先度: Webhook URL更新

デプロイ後、API GatewayのURLをMuxダッシュボードに登録:

```bash
# デプロイ後に出力されるURL
# 例: https://abcd1234.execute-api.ap-northeast-1.amazonaws.com/prod

# Muxダッシュボード
1. Settings → Webhooks に移動
2. 作成したWebhookを編集
3. URLを更新:
   https://abcd1234.execute-api.ap-northeast-1.amazonaws.com/prod/webhooks/mux
4. "Save" をクリック
```

---

### 🟡 中優先度: テスト

```bash
# 1. Lambda関数の単体テスト
cd backend/src
npm test

# 2. API統合テスト（Postman/Thunder Client）
# REST API 80エンドポイントをテスト

# 3. WebSocketテスト
# wscat等でWebSocket接続をテスト

# 4. ライブ配信フローテスト
# OBS等でRTMP配信テスト
```

---

### 🟡 中優先度: フロントエンド統合

```bash
# Expo アプリ側の実装
# 1. API Client作成（80エンドポイント）
# 2. WebSocket Client作成
# 3. Mux Player統合（HLS再生）
# 4. Cognito認証フロー
# 5. S3アップロード機能
```

---

### 🟢 低優先度: 本番環境準備

```bash
# 1. ドメイン設定
# 2. SSL証明書（ACM）
# 3. WAFルール設定
# 4. CloudWatch Alarm設定
# 5. SES（メール送信）設定
# 6. バックアップ設定
```

---

## 📈 プロジェクト進捗

```
Phase 1: Core Backend          ████████████████████ 100% ✅
Stage 2A: 既存機能拡張         ████████████████████ 100% ✅
Stage 2B: Analytics            ████████████████████ 100% ✅
Stage 2C: Product/Shop         ████████████████████ 100% ✅
Stage 2D: Report/Notification  ████████████████████ 100% ✅
Stage 2E: Block/Message        ████████████████████ 100% ✅
Phase 3: Live Streaming        ████████████████████ 100% ✅
─────────────────────────────────────────────────────────
Mux Setup & Deploy             ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Integration & Testing          ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Production Deployment          ░░░░░░░░░░░░░░░░░░░░   0% ⏳
```

**全体進捗**: バックエンドAPI実装完了 → Mux設定 & デプロイへ

---

## 🎥 ライブストリーミング詳細

### アーキテクチャ

```
┌──────────────┐     RTMP      ┌─────────┐     Webhook    ┌─────────┐
│  OBS/配信者  │────────────→  │   Mux   │──────────────→ │ Lambda  │
└──────────────┘               └─────────┘                └─────────┘
                                    │                           │
                                    │ HLS                       │ DynamoDB
                                    ↓                           ↓ Update
                              ┌──────────┐                 ┌─────────┐
                              │  視聴者  │←────────────────│ Status  │
                              └──────────┘   WebSocket     └─────────┘
                                    ↑
                                    │ Chat/Gift
                                    │
                              ┌──────────────┐
                              │  WebSocket   │
                              │     API      │
                              └──────────────┘
```

### 配信フロー

#### 1. 配信作成
```typescript
POST /live-streams
{
  "room_id": "room_xxx",
  "title": "配信タイトル",
  "description": "配信説明"
}

// レスポンス
{
  "stream_id": "stream_xxx",
  "stream_key": "abc123...",
  "playback_id": "xyz789...",
  "rtmp_url": "rtmps://global-live.mux.com:443/app/abc123..."
}
```

#### 2. 配信開始（OBS等で配信開始）
```bash
# OBS設定
Server: rtmps://global-live.mux.com:443/app
Stream Key: abc123...

# Muxが自動検知 → Webhook送信
# Lambda関数がステータスを"active"に更新
```

#### 3. 視聴者参加
```typescript
POST /live-streams/{stream_id}/join

// レスポンス
{
  "stream_id": "stream_xxx",
  "playback_url": "https://stream.mux.com/xyz789.m3u8",
  "viewer_count": 42
}

// HLS Player で再生
<video src="https://stream.mux.com/xyz789.m3u8" />
```

#### 4. リアルタイムチャット
```typescript
// WebSocket接続
ws://your-websocket-endpoint?account_id=user_xxx

// メッセージ送信
{
  "action": "broadcast",
  "stream_id": "stream_xxx",
  "data": {
    "type": "chat",
    "message": "こんにちは！"
  }
}
```

#### 5. 配信終了
```typescript
POST /live-streams/{stream_id}/end

// または配信者が配信停止
// → Muxが自動検知 → Webhook送信
// → Lambda関数がステータスを"idle"に更新
// → 自動的にVODアーカイブ作成
```

### Webhook イベント

| イベント | 発火タイミング | 処理内容 |
|---------|-------------|---------|
| `video.live_stream.active` | 配信者が配信開始 | ステータスを"active"に更新 |
| `video.live_stream.idle` | 配信者が配信停止 | ステータスを"idle"に更新、視聴者数リセット |
| `video.live_stream.recording` | 録画開始 | ログ記録 |
| `video.asset.ready` | VOD作成完了 | アセットIDを配信に紐付け |

### Mux料金

| 項目 | 料金 | 無料枠 |
|-----|------|-------|
| ライブ配信 | $0.015/分 | 月$20クレジット（約30時間） |
| VOD再生 | $0.005/GB | 月$20クレジット |
| 保存 | $0.025/GB/月 | 含まれる |

詳細: https://www.mux.com/pricing

---

## 🛠️ 技術スタック

### Backend
- **言語**: TypeScript 5.x
- **ランタイム**: Node.js 20.x
- **フレームワーク**: AWS CDK 2.x
- **インフラ**: AWS (Lambda, API Gateway, DynamoDB, S3, Cognito)
- **認証**: AWS Cognito User Pools
- **ストレージ**: DynamoDB (28テーブル), S3 (メディア)
- **ログ**: CloudWatch Logs
- **トレース**: AWS X-Ray
- **ライブ配信**: Mux Video API
- **WebSocket**: API Gateway WebSocket API

### Frontend (統合待ち)
- **フレームワーク**: Expo (React Native)
- **言語**: TypeScript
- **状態管理**: Zustand
- **ナビゲーション**: Expo Router
- **UI**: Custom Components
- **動画プレイヤー**: Mux Player SDK

### 外部サービス
- **ライブストリーミング**: Mux (設定待ち)
- **プッシュ通知**: Expo Notifications (未統合)
- **メール**: Amazon SES (未設定)

---

## 📝 メモ

### 主要な設計判断
- **論理削除**: Post、Product、Comment は論理削除（`is_deleted`フラグ）＋TTLで90日後物理削除
- **ページネーション**: nextToken方式（base64エンコード）、デフォルト20-50件
- **認証**: 開発環境では`x-account-id`ヘッダー、本番環境ではCognito JWT
- **画像URL**: S3バケットURLのみ許可（正規表現検証）
- **通貨**: JPYとUSDの2通貨対応
- **ハッシュタグ**: 小文字正規化、#除去
- **エラーハンドリング**: AppError統一エラー形式
- **WebSocket**: 24時間TTLでCONNECTIONS自動削除
- **ライブ配信**: Webhook駆動（ポーリングなし）

### パフォーマンス最適化
- GSI活用（28テーブル中21テーブルでGSI使用）
- BatchGetItem/BatchWriteItem使用
- 非同期カウンター更新（view_count、click_count、viewer_count等）
- Lambda同時実行数制限なし（Reserved Concurrency未設定）
- WebSocket Broadcast（配信視聴者全員に一括送信）

### セキュリティ
- Cognito認証必須（全APIエンドポイント、WebSocket除く）
- Webhook署名検証（Mux）
- IAM Role による最小権限原則
- S3バケットプライベート（署名付きURL使用想定）
- Secrets Manager（Mux認証情報）
- CloudWatch Logs暗号化
- パスワードハッシュ化（Cognito管理）

---

## ✅ 実装完了チェックリスト

### インフラストラクチャ
- [x] DynamoDB 28テーブル
- [x] S3バケット
- [x] Cognito User Pool
- [x] Lambda 84関数
- [x] REST API Gateway (80エンドポイント)
- [x] WebSocket API (3ルート)
- [x] Secrets Manager
- [x] IAMロール・ポリシー

### Lambda関数
- [x] Phase 1: Core Backend (16)
- [x] Stage 2A: 既存機能拡張 (14)
- [x] Stage 2B: Analytics (4)
- [x] Stage 2C: Product/Shop (8)
- [x] Stage 2D: Report/Notification等 (15)
- [x] Stage 2E: Block/Message (8)
- [x] Phase 3: Live Streaming REST (14)
- [x] Phase 3: WebSocket (3)
- [x] Special Functions (2)

### 外部連携
- [ ] Muxアカウント作成
- [ ] Mux API認証情報取得
- [ ] Mux Webhook URL設定
- [ ] AWS Secrets Manager設定

### デプロイ
- [ ] パッケージインストール
- [ ] DynamoDB GSI追加（mux_live_stream_id）
- [ ] CDK Deploy
- [ ] Webhook URL更新

### テスト
- [ ] Lambda単体テスト
- [ ] REST API統合テスト
- [ ] WebSocket接続テスト
- [ ] ライブ配信フローテスト
- [ ] Webhook受信テスト

### フロントエンド
- [ ] API Client実装
- [ ] WebSocket Client実装
- [ ] Mux Player統合
- [ ] 認証フロー
- [ ] S3アップロード

---

**作成者**: Claude (Anthropic)
**リポジトリ**: rork-instagram-feed-design
**ライセンス**: Private
**最終更新**: 2025年1月
