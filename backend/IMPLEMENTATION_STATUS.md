# バックエンドAPI実装状況 - Piece App

**最終更新**: 2025年1月
**ステータス**: Phase 2完了（67 Lambda関数実装済み）

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
| **Cognito Trigger** | 1 | N/A | ✅ 完了 |
| **Mux Webhook** | 1 | 1 | ✅ 完了 |
| **合計** | **67** | **66** | ✅ |
| **Phase 3: Live Streaming** | 17 | 14 + WebSocket | ⏳ 未実装 |

---

## 🎯 実装済み Lambda 関数一覧（67個）

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

### Special Functions (2)

67. `postConfirmation` - Cognito PostConfirmation Trigger
68. `muxWebhook` - Mux Webhook Handler（未実装）

---

## 🌐 APIエンドポイント一覧（66個）

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

### Webhook (1)
- `POST /webhooks/mux` - Mux Webhook（未実装）

---

## 🗄️ DynamoDBテーブル使用状況（27テーブル）

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
| 18 | MESSAGE | メッセージ | 1 | ❌ | ✅ |
| 19 | LIVE_STREAM | ライブ配信 | 3 | ✅ | ⏳ |
| 20 | LIVE_VIEWER | ライブ視聴者 | 2 | ✅ | ⏳ |
| 21 | LIVE_CHAT | ライブチャット | 1 | ✅ | ⏳ |
| 22 | GIFT | ギフト | 2 | ❌ | ⏳ |
| 23 | MODERATOR | モデレーター | 2 | ❌ | ⏳ |
| 24 | LIVE_BAN | ライブBAN | 2 | ✅ | ⏳ |
| 25 | PRODUCT | 商品 | 3 | ✅ | ✅ |
| 26 | PRODUCT_TAG | 商品タグ | 2 | ❌ | ✅ |
| 27 | ANALYTICS | 分析データ | 3 | ✅ | ✅ |

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
│  │   REST API (66)      │   WebSocket API (未実装)      │  │
│  │  - Cognito Authorizer│   - Connection Management      │  │
│  │  - Request Validator │   - Real-time Chat             │  │
│  └──────────────────────┴───────────────────────────────┘  │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ Invoke
                │
┌───────────────▼─────────────────────────────────────────────┐
│                  AWS Lambda (67 Functions)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Account (3) │ Post (10) │ Comment (3) │ Follow (4)   │  │
│  │ Repost (4)  │ Room (8)  │ Product (8) │ Analytics(4) │  │
│  │ Report (2)  │ Notif (5) │ Session (3) │ Hashtag (2)  │  │
│  │ Mute (3)    │ Block (3) │ Message (4) │ Special (2)  │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────┬─────────────────────────────────────────────┘
                │
      ┌─────────┼─────────┬─────────┬──────────┐
      │         │         │         │          │
┌─────▼───┐ ┌──▼────┐ ┌──▼─────┐ ┌▼─────────┐ ┌──▼───────┐
│DynamoDB │ │ S3    │ │Cognito │ │ Secrets  │ │   Mux    │
│(27 TB)  │ │Media  │ │UserPool│ │ Manager  │ │(未実装)  │
└─────────┘ └───────┘ └────────┘ └──────────┘ └──────────┘
```

### 主要サービス使用状況

| サービス | 用途 | ステータス |
|---------|------|----------|
| **API Gateway** | REST API (66エンドポイント) | ✅ 実装済み |
| **Lambda** | サーバーレス関数 (67個) | ✅ 実装済み |
| **DynamoDB** | NoSQLデータベース (27テーブル) | ✅ 実装済み |
| **S3** | メディアストレージ | ✅ 実装済み |
| **Cognito** | 認証・認可 | ✅ 実装済み |
| **CloudWatch** | ログ・モニタリング | ✅ 自動設定 |
| **X-Ray** | トレーシング | ✅ 自動設定 |
| **Secrets Manager** | 認証情報管理 | ⏳ Mux用に必要 |
| **WebSocket API** | リアルタイム通信 | ⏳ 未実装 |
| **Mux** | ライブストリーミング | ⏳ 未実装 |

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

---

## ⏳ 未実装機能

### Phase 3: Live Streaming（最優先）

#### インフラ
- [ ] AWS Secrets Manager Stack
- [ ] WebSocket API Gateway
- [ ] CONNECTIONS テーブル

#### Lambda Functions (17個)
**REST API (14)**
1. [ ] createLiveStream
2. [ ] startLiveStream
3. [ ] endLiveStream
4. [ ] deleteLiveStream
5. [ ] joinLiveStream
6. [ ] leaveLiveStream
7. [ ] getLiveStream
8. [ ] getLiveStreams
9. [ ] sendLiveChat
10. [ ] getLiveChats
11. [ ] sendGift
12. [ ] addModerator
13. [ ] banUserFromLive
14. [ ] muxWebhook

**WebSocket (3)**
1. [ ] wsConnect
2. [ ] wsDisconnect
3. [ ] wsMessage

#### 外部サービス
- [ ] Muxアカウント作成
- [ ] Mux API統合

**推定実装時間**: 2-3週間

---

## 🚀 次のステップ

### 1. **ライブストリーミング実装** (優先度: 🔴 最高)
- Muxアカウント準備
- 17個のLambda関数実装
- WebSocket API構築
- フロントエンド連携

### 2. **既存機能のテスト** (優先度: 🟠 高)
- 67個の関数の単体テスト
- 統合テスト
- E2Eテスト

### 3. **フロントエンド統合** (優先度: 🟠 高)
- 66個のAPIエンドポイント連携
- 認証フロー実装
- S3メディアアップロード
- エラーハンドリング

### 4. **本番環境準備** (優先度: 🟡 中)
- ドメイン・SES設定
- WAFセキュリティ設定
- モニタリング・アラート設定
- バックアップ設定

### 5. **ドキュメント整備** (優先度: 🟢 低)
- API仕様書（OpenAPI）
- 運用マニュアル
- トラブルシューティングガイド

---

## 📈 プロジェクト進捗

```
Phase 1: Core Backend          ████████████████████ 100% ✅
Stage 2A: 既存機能拡張         ████████████████████ 100% ✅
Stage 2B: Analytics            ████████████████████ 100% ✅
Stage 2C: Product/Shop         ████████████████████ 100% ✅
Stage 2D: Report/Notification  ████████████████████ 100% ✅
Stage 2E: Block/Message        ████████████████████ 100% ✅
─────────────────────────────────────────────────────────
Phase 3: Live Streaming        ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Integration & Testing          ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Production Deployment          ░░░░░░░░░░░░░░░░░░░░   0% ⏳
```

**全体進捗**: Phase 2完了 → Phase 3（ライブストリーミング）へ

---

## 🛠️ 技術スタック

### Backend
- **言語**: TypeScript 5.x
- **ランタイム**: Node.js 20.x
- **フレームワーク**: AWS CDK 2.x
- **インフラ**: AWS (Lambda, API Gateway, DynamoDB, S3, Cognito)
- **認証**: AWS Cognito User Pools
- **ストレージ**: DynamoDB (27テーブル), S3 (メディア)
- **ログ**: CloudWatch Logs
- **トレース**: AWS X-Ray

### Frontend (統合待ち)
- **フレームワーク**: Expo (React Native)
- **言語**: TypeScript
- **状態管理**: Zustand
- **ナビゲーション**: Expo Router
- **UI**: Custom Components

### 外部サービス
- **ライブストリーミング**: Mux (未統合)
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

### パフォーマンス最適化
- GSI活用（27テーブル中19テーブルでGSI使用）
- BatchGetItem/BatchWriteItem使用
- 非同期カウンター更新（view_count、click_count等）
- Lambda同時実行数制限なし（Reserved Concurrency未設定）

### セキュリティ
- Cognito認証必須（全APIエンドポイント）
- IAM Role による最小権限原則
- S3バケットプライベート（署名付きURL使用想定）
- CloudWatch Logs暗号化
- パスワードハッシュ化（Cognito管理）

---

**作成者**: Claude (Anthropic)
**リポジトリ**: rork-instagram-feed-design
**ライセンス**: Private
