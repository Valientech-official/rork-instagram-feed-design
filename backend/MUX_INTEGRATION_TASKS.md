# Mux Integration Tasks（ライブ配信機能）

## 📹 Muxとは

**Mux** = ビデオストリーミング・オンデマンド配信プラットフォーム

- **Mux Video**: オンデマンド動画配信（録画済み動画）
- **Mux Live**: リアルタイムライブストリーミング
- **Mux Data**: ビデオアナリティクス（視聴データ、QoE）

---

## 🎯 Phase 0: Mux準備（Phase 2開始前）

### タスク
- [ ] **Muxアカウント作成**
  - https://mux.com/ でサインアップ
  - 開発環境用プロジェクト作成

- [ ] **Mux API認証情報取得**
  - Settings → Access Tokens
  - **Access Token ID** 取得
  - **Secret Key** 取得
  - **Webhook Signing Secret** 取得

- [ ] **AWS Secrets Managerに保存**
  ```json
  {
    "MUX_TOKEN_ID": "xxx",
    "MUX_TOKEN_SECRET": "xxx",
    "MUX_WEBHOOK_SECRET": "xxx"
  }
  ```

- [ ] **Mux SDK for Node.js 調査**
  - `@mux/mux-node` パッケージ
  - API使用方法の確認

**所要時間**: 半日

---

## 🎬 Phase 2.6: Live Stream機能（Mux統合版）

### 📋 概要
ユーザーがライブ配信を開始・視聴できる機能

---

### 🔧 必要なインフラストラクチャ

#### 1. Secrets Manager Stack（新規）
**目的**: Mux認証情報の安全な管理

**タスク**:
- [ ] `secrets-manager-stack.ts` 作成
  - [ ] Mux API認証情報のSecret作成
  - [ ] Lambda関数にアクセス権限付与
- [ ] bin/app.ts に追加
- [ ] デプロイ

**所要時間**: 1日

---

#### 2. Mux Webhook用API（新規）
**目的**: Muxからのイベント通知を受信

**タスク**:
- [ ] Lambda関数: `muxWebhook.ts` 作成
  - [ ] Webhook署名検証
  - [ ] イベントタイプ別処理
    - `video.live_stream.active` - 配信開始
    - `video.live_stream.idle` - 配信終了
    - `video.live_stream.created` - ストリーム作成
    - `video.live_stream.deleted` - ストリーム削除
    - `video.asset.ready` - アーカイブ準備完了
  - [ ] DynamoDBステータス更新
- [ ] API Gateway エンドポイント追加
  - `POST /webhooks/mux`（認証不要、署名検証のみ）
- [ ] Mux Dashboard でWebhook URL登録

**所要時間**: 2日

---

#### 3. Lambda関数（Live Stream管理）

##### 3.1 配信管理系（4個）

**`createLiveStream.ts`** - ライブ配信作成
- [ ] Mux API で Live Stream作成
  - `POST https://api.mux.com/video/v1/live-streams`
  - Playback Policy: `public`
  - New Asset Settings: 録画を有効化
- [ ] DynamoDB LIVE_STREAMテーブルに保存
  - `stream_id`, `mux_stream_id`, `mux_playback_id`
  - `stream_key`（配信用キー）
  - `status: 'idle'`
- [ ] レスポンス
  - Stream Key（OBS等で使用）
  - Playback URL

**`startLiveStream.ts`** - 配信開始通知
- [ ] DynamoDB ステータス更新 `'idle'` → `'active'`
- [ ] 通知作成（フォロワーへ）
- ⚠️ 実際の配信開始はMux側で自動検知（Webhook経由）

**`endLiveStream.ts`** - 配信終了
- [ ] DynamoDB ステータス更新 `'active'` → `'ended'`
- [ ] Mux API で配信終了（オプション）
  - `PUT https://api.mux.com/video/v1/live-streams/:id/complete`
- [ ] アーカイブ処理開始

**`deleteLiveStream.ts`** - 配信削除
- [ ] Mux API で Live Stream削除
  - `DELETE https://api.mux.com/video/v1/live-streams/:id`
- [ ] DynamoDB から削除

---

##### 3.2 視聴管理系（4個）

**`joinLiveStream.ts`** - 視聴参加
- [ ] DynamoDB LIVE_VIEWERテーブルに追加
  - `stream_id`, `account_id`, `joined_at`
- [ ] 視聴者数カウントアップ
- [ ] レスポンス
  - Mux Playback URL
  - 現在の視聴者数

**`leaveLiveStream.ts`** - 視聴退出
- [ ] LIVE_VIEWERテーブルから削除
- [ ] 視聴者数カウントダウン

**`getLiveStream.ts`** - 配信情報取得
- [ ] DynamoDB から配信情報取得
- [ ] 視聴者数取得
- [ ] Mux Playback URL返却

**`getLiveStreams.ts`** - 配信一覧取得
- [ ] アクティブな配信一覧
- [ ] GSI: `status-created_at-index` でクエリ

---

##### 3.3 チャット・ギフト系（3個）

**`sendLiveChat.ts`** - チャット送信
- [ ] WebSocket API経由で実装
- [ ] LIVE_CHATテーブルに保存
- [ ] 接続中の視聴者全員に送信

**`sendGift.ts`** - ギフト送信
- [ ] LIVE_GIFTテーブルに保存
- [ ] 配信者への通知
- [ ] ギフトアニメーション用データ

**`getLiveChats.ts`** - チャット履歴取得
- [ ] LIVE_CHATテーブルからクエリ
- [ ] ページネーション対応

---

##### 3.4 モデレーション系（2個）

**`addModerator.ts`** - モデレーター追加
- [ ] LIVE_MODERATORテーブルに追加
- [ ] 権限チェックロジック

**`banUserFromLive.ts`** - ユーザーBAN
- [ ] MODERATOR_ACTION_LOGテーブルに記録
- [ ] LIVE_VIEWERから削除
- [ ] WebSocket接続切断

---

#### 4. WebSocket API Stack（新規）
**目的**: リアルタイムチャット機能

**タスク**:
- [ ] `websocket-stack.ts` 作成
- [ ] WebSocket API Gateway作成
- [ ] Lambda関数（3個）
  - [ ] `wsConnect.ts` - 接続処理
  - [ ] `wsDisconnect.ts` - 切断処理
  - [ ] `wsMessage.ts` - メッセージ処理
- [ ] DynamoDB CONNECTIONSテーブル作成（接続管理用）
- [ ] bin/app.ts に追加
- [ ] デプロイ

**所要時間**: 3-4日

---

#### 5. API Gateway エンドポイント追加

**REST API** (10個):
- [ ] `POST /live` - ライブ配信作成
- [ ] `PUT /live/{stream_id}/start` - 配信開始通知
- [ ] `PUT /live/{stream_id}/end` - 配信終了
- [ ] `DELETE /live/{stream_id}` - 配信削除
- [ ] `POST /live/{stream_id}/join` - 視聴参加
- [ ] `POST /live/{stream_id}/leave` - 視聴退出
- [ ] `GET /live/{stream_id}` - 配信情報取得
- [ ] `GET /live` - 配信一覧
- [ ] `POST /live/{stream_id}/gift` - ギフト送信
- [ ] `GET /live/{stream_id}/chats` - チャット履歴

**WebSocket API** (3個):
- [ ] `$connect` - 接続
- [ ] `$disconnect` - 切断
- [ ] `sendMessage` - メッセージ送信

**Webhook** (1個):
- [ ] `POST /webhooks/mux` - Mux Webhook

---

### 6. React Native実装

#### 6.1 Mux Player統合
- [ ] `@mux/mux-player-react-native` インストール検討
- [ ] または `react-native-video` でMux HLS再生
- [ ] Playback URL形式
  ```
  https://stream.mux.com/{PLAYBACK_ID}.m3u8
  ```

#### 6.2 配信機能（配信者側）
- [ ] OBS等の配信ソフトウェア連携
  - RTMP URL: `rtmps://global-live.mux.com:443/app`
  - Stream Key: Mux APIから取得
- [ ] または React Native RTMP配信ライブラリ検討
  - `react-native-nodemediaclient` 等

#### 6.3 視聴機能（視聴者側）
- [ ] Mux Playerで再生
- [ ] チャット機能（WebSocket）
- [ ] ギフト送信UI
- [ ] 視聴者数表示

---

### 7. 型定義追加（types/api.ts）

```typescript
// ライブ配信作成
export interface CreateLiveStreamRequest {
  title: string;
  description?: string;
  thumbnail?: string;
}

export interface CreateLiveStreamResponse {
  stream_id: string;
  stream_key: string; // OBS等で使用
  rtmp_url: string;
  playback_url: string;
}

// 配信参加
export interface JoinLiveStreamResponse {
  playback_url: string;
  viewer_count: number;
  status: 'idle' | 'active' | 'ended';
}

// チャット送信
export interface SendLiveChatRequest {
  message: string;
}

// ギフト送信
export interface SendGiftRequest {
  gift_type: string;
  amount: number;
}
```

---

### 8. Mux料金の確認
- [ ] **Mux Live Streaming**
  - $0.015 / 分（配信時間）
  - ストレージ: $0.005 / GB / 月
- [ ] **Mux Video**（アーカイブ）
  - $0.005 / GB（配信）
  - $0.005 / GB（ストレージ）
- [ ] **Mux Data**（アナリティクス）
  - 月10,000視聴まで無料
  - 以降 $0.05 / 1,000視聴

⚠️ **開発環境では配信テストの頻度に注意**

---

## 📊 Phase 2.6 タイムライン（詳細）

```
Day 1:        Muxアカウント設定 + Secrets Manager
Day 2-3:      Mux Webhook Lambda作成
Day 4-6:      配信管理Lambda（4個）
Day 7-9:      視聴管理Lambda（4個）
Day 10-11:    チャット・ギフトLambda（3個）
Day 12:       モデレーションLambda（2個）
Day 13-16:    WebSocket API Stack作成
Day 17-18:    API Gateway統合・デプロイ
Day 19-21:    React Native実装（視聴機能）
Day 22-24:    React Native実装（配信機能）
Day 25-28:    テスト・バグ修正
```

**合計**: 約4週間（20-28日）

---

## ⚠️ 重要な注意事項

### 1. Mux vs Amazon IVS
- **Mux**: 使いやすい、実績豊富、グローバル対応
- **Amazon IVS**: AWS統合、低レイテンシ

→ **Mux採用** ✅（元々の計画通り）

### 2. RTMP配信の課題
- React Nativeから直接RTMP配信は難しい
- **推奨**: OBS等の配信ソフトウェアを使用
- または専用ライブラリ（`react-native-nodemediaclient`）

### 3. 録画・アーカイブ
- Mux Live Streamは自動的に録画可能
- 録画したVideoはMux Video Assetとして保存
- Playback IDで視聴可能

---

## 📋 チェックリスト

### Phase 0（準備）
- [ ] Muxアカウント作成
- [ ] API認証情報取得
- [ ] Secrets Manager設定

### Infrastructure
- [ ] Secrets Manager Stack
- [ ] WebSocket API Stack
- [ ] Mux Webhook Lambda
- [ ] 配信管理Lambda（4個）
- [ ] 視聴管理Lambda（4個）
- [ ] チャット・ギフトLambda（3個）
- [ ] モデレーションLambda（2個）

### API
- [ ] REST API エンドポイント（10個）
- [ ] WebSocket API（3個）
- [ ] Webhook（1個）

### Client
- [ ] Mux Player統合
- [ ] 配信機能（RTMP）
- [ ] 視聴機能
- [ ] チャット機能
- [ ] ギフト機能

### Testing
- [ ] 配信テスト
- [ ] 視聴テスト
- [ ] チャットテスト
- [ ] Webhook動作確認

---

## 🔗 参考リンク

- **Mux Docs**: https://docs.mux.com/
- **Mux API Reference**: https://docs.mux.com/api-reference
- **Mux Node SDK**: https://github.com/muxinc/mux-node-sdk
- **Mux Live Streaming Guide**: https://docs.mux.com/guides/video/stream-live-video

---

**Phase 2.6のLive Stream機能は、すべての基本機能（Phase 2.1〜2.5）が完了してから着手することを推奨します。**
