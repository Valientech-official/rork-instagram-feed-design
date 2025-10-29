# Piece App - Development Roadmap

## ✅ Phase 1: 開発環境デプロイ（完了）

### インフラストラクチャ
- ✅ DynamoDB Stack（27テーブル、50 GSI）
- ✅ S3 Stack（メディアストレージ）
- ✅ Lambda Stack（16関数）
- ✅ Cognito Stack（認証システム）
- ✅ API Gateway Stack（17エンドポイント）

### 実装済み機能
- ✅ アカウント管理（作成、取得、更新）
- ✅ 投稿機能（作成、取得、削除、タイムライン）
- ✅ いいね機能（追加、削除）
- ✅ コメント機能（作成、削除、取得）
- ✅ フォロー機能（フォロー、解除）
- ✅ ROOM機能（作成、参加）

### 次のステップ
- [ ] React Nativeアプリとの接続テスト
- [ ] 各APIエンドポイントの動作確認
- [ ] Cognito認証フローのテスト

---

## 🔮 Phase 2: 残りの機能実装（開発環境）

### 2.1 Repost機能（優先度: 高）
**概要**: 他ユーザーの投稿を自分のタイムラインに再投稿

**必要なリソース**:
- Lambda関数: 2個
  - [ ] `createRepost` - リポスト作成
  - [ ] `deleteRepost` - リポスト削除
- API Gateway エンドポイント: 2個
  - [ ] `POST /posts/{post_id}/repost`
  - [ ] `DELETE /reposts/{repost_id}`
- DynamoDB: REPOSTテーブル（既存）

**所要時間**: 1-2日

---

### 2.2 Block機能（優先度: 高）
**概要**: 特定ユーザーをブロックし、相互に閲覧不可にする

**必要なリソース**:
- Lambda関数: 3個
  - [ ] `blockUser` - ユーザーブロック
  - [ ] `unblockUser` - ブロック解除
  - [ ] `getBlockList` - ブロックリスト取得
- API Gateway エンドポイント: 3個
  - [ ] `POST /block`
  - [ ] `DELETE /block/{account_id}`
  - [ ] `GET /block`
- DynamoDB: BLOCKテーブル（既存）

**所要時間**: 2-3日

---

### 2.3 Report機能（優先度: 中）
**概要**: 不適切な投稿・ユーザーを運営に通報

**必要なリソース**:
- Lambda関数: 2個
  - [ ] `createReport` - 通報作成
  - [ ] `getReports` - 通報一覧（管理者用）
- API Gateway エンドポイント: 2個
  - [ ] `POST /report`
  - [ ] `GET /reports`（管理者のみ）
- DynamoDB: REPORTテーブル（既存）

**所要時間**: 2-3日

---

### 2.4 Product/Shop機能（優先度: 中）
**概要**: 商品の登録・販売・購入

**必要なリソース**:
- Lambda関数: 5個
  - [ ] `createProduct` - 商品作成
  - [ ] `getProduct` - 商品取得
  - [ ] `updateProduct` - 商品更新
  - [ ] `deleteProduct` - 商品削除
  - [ ] `getProducts` - 商品一覧
- API Gateway エンドポイント: 5個
  - [ ] `POST /products`
  - [ ] `GET /products/{product_id}`
  - [ ] `PUT /products/{product_id}`
  - [ ] `DELETE /products/{product_id}`
  - [ ] `GET /products`
- DynamoDB: PRODUCT、PRODUCT_TAGテーブル（既存）

**所要時間**: 3-5日

---

### 2.5 Conversation/Message機能（優先度: 高）
**概要**: ダイレクトメッセージ（DM）機能

**必要なリソース**:
- Lambda関数: 4個
  - [ ] `createConversation` - 会話作成
  - [ ] `getConversations` - 会話一覧
  - [ ] `sendMessage` - メッセージ送信
  - [ ] `getMessages` - メッセージ取得
- API Gateway エンドポイント: 4個（REST）
  - [ ] `POST /conversations`
  - [ ] `GET /conversations`
  - [ ] `POST /conversations/{conversation_id}/messages`
  - [ ] `GET /conversations/{conversation_id}/messages`
- **WebSocket API**: リアルタイムメッセージング
  - [ ] WebSocket API Gateway作成
  - [ ] `onConnect` Lambda
  - [ ] `onDisconnect` Lambda
  - [ ] `onMessage` Lambda
- DynamoDB: CONVERSATION、MESSAGEテーブル（既存）

**所要時間**: 5-7日

---

### 2.6 Live Stream機能（優先度: 低）
**概要**: リアルタイムライブ配信（**Mux統合**）

**⚠️ 詳細は `MUX_INTEGRATION_TASKS.md` を参照**

**必要なリソース**:
- **Phase 0（準備）**:
  - [ ] Muxアカウント作成
  - [ ] API認証情報取得・Secrets Manager設定
- **Infrastructure**:
  - [ ] Secrets Manager Stack（Mux認証情報）
  - [ ] WebSocket API Stack（リアルタイムチャット）
- **Lambda関数: 14個**
  - [ ] `muxWebhook` - Mux Webhook処理
  - [ ] `createLiveStream` - 配信作成（Mux API統合）
  - [ ] `startLiveStream` - 配信開始通知
  - [ ] `endLiveStream` - 配信終了
  - [ ] `deleteLiveStream` - 配信削除
  - [ ] `joinLiveStream` - 視聴参加
  - [ ] `leaveLiveStream` - 視聴退出
  - [ ] `getLiveStream` - 配信情報取得
  - [ ] `getLiveStreams` - 配信一覧
  - [ ] `sendLiveChat` - チャット送信（WebSocket）
  - [ ] `sendGift` - ギフト送信
  - [ ] `getLiveChats` - チャット履歴
  - [ ] `addModerator` - モデレーター追加
  - [ ] `banUserFromLive` - ユーザーBAN
- **API Gateway エンドポイント**:
  - REST API: 10個
  - WebSocket API: 3個
  - Webhook: 1個
- **追加サービス**:
  - [ ] **Mux Video & Live Streaming**（外部サービス）
  - [ ] WebSocket API Gateway
  - [ ] Secrets Manager
- **DynamoDB**: LIVE_STREAM、LIVE_VIEWER、LIVE_CHAT、LIVE_GIFTテーブル（既存）
- **React Native**:
  - [ ] Mux Player統合（視聴）
  - [ ] RTMP配信機能（OBS連携 or ライブラリ）

**所要時間**: 20-28日（約4週間）

---

### 2.7 Analytics機能（優先度: 低）
**概要**: 投稿・アカウントの分析データ

**必要なリソース**:
- Lambda関数: 3個
  - [ ] `getPostAnalytics` - 投稿分析
  - [ ] `getAccountAnalytics` - アカウント分析
  - [ ] `getDashboard` - ダッシュボード
- API Gateway エンドポイント: 3個
  - [ ] `GET /analytics/post/{post_id}`
  - [ ] `GET /analytics/account/{account_id}`
  - [ ] `GET /analytics/dashboard`
- DynamoDB: ANALYTICSテーブル（既存）

**所要時間**: 3-5日

---

## Phase 2 実装順序（推奨）

### 優先度順
1. **Conversation/Message** - ユーザー体験に直結
2. **Block** - セーフティ機能として重要
3. **Repost** - SNS基本機能
4. **Report** - 運営機能として重要
5. **Product/Shop** - 収益化機能
6. **Analytics** - 改善のためのデータ
7. **Live Stream** - 高度な機能、最後に実装

### 所要時間（合計）
- **最短**: 約1ヶ月（並行作業）
- **現実的**: 約2ヶ月（順次実装）

---

## 🚀 Phase 3: 本番環境準備

### 3.1 ドメイン・メール設定
- [ ] Route 53でドメイン取得（例: piece-app.com）
- [ ] SES設定
  - [ ] ドメイン認証（SPF/DKIM設定）
  - [ ] メール送信テスト
  - [ ] サンドボックス解除申請

**所要時間**: 2-3日

---

### 3.2 Cognito本番設定
- [ ] cognito-stack.ts 修正
  - [ ] `advancedSecurityMode` → `StandardThreatProtectionMode.ENFORCED`
  - [ ] `email` → SESに切り替え
  - [ ] カスタムドメイン設定（例: auth.piece-app.com）
- [ ] User Poolの本番用設定確認

**所要時間**: 1日

---

### 3.3 セキュリティ強化
- [ ] API Gateway にWAF設定
- [ ] Lambda関数のVPC配置（必要に応じて）
- [ ] Secrets Managerで機密情報管理
- [ ] CloudWatch アラーム設定
  - [ ] Lambda エラー率
  - [ ] API Gateway 5xx エラー
  - [ ] DynamoDB スロットリング

**所要時間**: 3-5日

---

### 3.4 モニタリング・ログ
- [ ] CloudWatch Dashboards作成
- [ ] X-Ray トレーシング確認
- [ ] ログ保持期間設定（本番: 1ヶ月）
- [ ] コスト監視アラート設定

**所要時間**: 2-3日

---

### 3.5 バックアップ・DR（災害復旧）
- [ ] DynamoDB Point-in-Time Recovery有効化
- [ ] S3バケットのバージョニング有効化
- [ ] クロスリージョンレプリケーション検討
- [ ] バックアップ自動化（AWS Backup）

**所要時間**: 2-3日

---

### 3.6 本番デプロイ
- [ ] bin/app.ts で本番スタックのコメント解除
- [ ] 環境変数の本番用設定
- [ ] `npx cdk deploy --all`（本番環境）
- [ ] デプロイ後の動作確認
- [ ] 負荷テスト実施

**所要時間**: 1-2日

---

### 3.7 運用準備
- [ ] 運用マニュアル作成
- [ ] インシデント対応フロー策定
- [ ] オンコール体制構築
- [ ] ユーザーサポート体制

**所要時間**: 1週間

---

## Phase 3 所要時間（合計）
- **最短**: 約2週間
- **現実的**: 約3-4週間

---

## 📊 全体スケジュール（参考）

| Phase | 内容 | 所要時間 | 状態 |
|-------|------|---------|------|
| Phase 1 | 開発環境デプロイ | 完了 | ✅ |
| Phase 2 | 残り機能実装 | 1-2ヶ月 | ⏳ |
| Phase 3 | 本番環境準備 | 3-4週間 | 📅 |

**合計**: 約3-4ヶ月でフル機能の本番環境稼働

---

## 🎯 次のアクション

### 即座に実施
1. [ ] React Nativeアプリに `.env.development` を統合
2. [ ] Cognito認証フローのテスト
3. [ ] 既存16エンドポイントの動作確認

### 近日中に実施（Phase 2開始）
1. [ ] 実装優先度の最終確認
2. [ ] Conversation/Message機能の実装開始
3. [ ] Block機能の実装

### 長期的に実施（Phase 3）
1. [ ] ドメイン取得
2. [ ] 本番環境のセキュリティ設計
3. [ ] 運用体制の構築
