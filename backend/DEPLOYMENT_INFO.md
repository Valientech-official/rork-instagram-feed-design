# Piece App - Backend Deployment Information

## 🚀 デプロイ完了日時
2025-10-29

## 📊 デプロイ済みスタック（開発環境）

### 1. DynamoDB Stack
- **スタック名**: PieceApp-DynamoDB-Dev
- **テーブル数**: 27
- **GSI数**: 50
- **TTL設定**: 13

### 2. S3 Stack
- **スタック名**: PieceApp-S3-Dev
- **バケット名**: `piece-app-1983-dev`
- **バケットARN**: `arn:aws:s3:::piece-app-1983-dev`
- **用途**: メディアファイル（画像、動画）

### 3. Lambda Stack
- **スタック名**: PieceApp-Lambda-Dev
- **関数数**: 16
- **ランタイム**: Node.js 20.x
- **関数リスト**:
  1. piece-app-create-account-dev
  2. piece-app-get-profile-dev
  3. piece-app-update-profile-dev
  4. piece-app-create-post-dev
  5. piece-app-get-post-dev
  6. piece-app-delete-post-dev
  7. piece-app-get-timeline-dev
  8. piece-app-like-post-dev
  9. piece-app-unlike-post-dev
  10. piece-app-create-comment-dev
  11. piece-app-delete-comment-dev
  12. piece-app-get-comments-dev
  13. piece-app-follow-user-dev
  14. piece-app-unfollow-user-dev
  15. piece-app-create-room-dev
  16. piece-app-join-room-dev

### 4. Cognito Stack
- **スタック名**: PieceApp-Cognito-Dev
- **User Pool ID**: `ap-northeast-1_LKhwTdez4`
- **Client ID**: `4dvma3506cs34sfs1c59he8i2l`
- **Domain**: `https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_LKhwTdez4`
- **MFA**: TOTP（オプション）
- **Advanced Security**: OFF（開発環境のため課金回避）

### 5. API Gateway Stack
- **スタック名**: PieceApp-ApiGateway-Dev
- **API ID**: `b6om6sz99f`
- **エンドポイント**: `https://b6om6sz99f.execute-api.ap-northeast-1.amazonaws.com/dev/`
- **タイプ**: REST API
- **認証**: Cognito User Pool
- **エンドポイント数**: 17

---

## 🔑 React Native アプリ設定値

`.env.development` ファイルに以下を設定済み:

```env
API_URL=https://b6om6sz99f.execute-api.ap-northeast-1.amazonaws.com/dev/
COGNITO_USER_POOL_ID=ap-northeast-1_LKhwTdez4
COGNITO_CLIENT_ID=4dvma3506cs34sfs1c59he8i2l
COGNITO_REGION=ap-northeast-1
S3_BUCKET_NAME=piece-app-1983-dev
S3_REGION=ap-northeast-1
```

---

## 📋 デプロイ済みAPIエンドポイント

### Account（アカウント）
- `POST /accounts` - アカウント作成（認証不要）
- `GET /accounts/{account_id}` - プロフィール取得
- `PUT /accounts/{account_id}` - プロフィール更新

### Post（投稿）
- `POST /posts` - 投稿作成
- `GET /posts/{post_id}` - 投稿取得
- `DELETE /posts/{post_id}` - 投稿削除
- `GET /timeline` - タイムライン取得

### Like（いいね）
- `POST /posts/{post_id}/like` - いいね追加
- `DELETE /posts/{post_id}/like` - いいね削除

### Comment（コメント）
- `POST /posts/{post_id}/comments` - コメント作成
- `DELETE /comments/{comment_id}` - コメント削除
- `GET /posts/{post_id}/comments` - コメント取得

### Follow（フォロー）
- `POST /follow` - フォロー
- `DELETE /follow` - フォロー解除

### Room（ROOM機能）
- `POST /rooms` - ROOM作成
- `POST /rooms/{room_id}/join` - ROOM参加

---

## 🔮 未実装機能（Phase 2で実装予定）

### Repost（リポスト）
- [ ] `POST /posts/{post_id}/repost` - リポスト作成
- [ ] `DELETE /reposts/{repost_id}` - リポスト削除

### Block（ブロック）
- [ ] `POST /block` - ユーザーブロック
- [ ] `DELETE /block/{account_id}` - ブロック解除
- [ ] `GET /block` - ブロックリスト取得

### Report（通報）
- [ ] `POST /report` - 通報作成
- [ ] `GET /reports` - 通報一覧（管理者用）

### Product/Shop（商品・ショップ）
- [ ] `POST /products` - 商品作成
- [ ] `GET /products/{product_id}` - 商品取得
- [ ] `PUT /products/{product_id}` - 商品更新
- [ ] `DELETE /products/{product_id}` - 商品削除
- [ ] `GET /products` - 商品一覧

### Conversation/Message（DM）
- [ ] `POST /conversations` - 会話作成
- [ ] `GET /conversations` - 会話一覧
- [ ] `POST /conversations/{conversation_id}/messages` - メッセージ送信
- [ ] `GET /conversations/{conversation_id}/messages` - メッセージ取得
- [ ] WebSocket API（リアルタイムメッセージング）

### Live Stream（ライブ配信）
- [ ] `POST /live/start` - 配信開始
- [ ] `POST /live/end` - 配信終了
- [ ] `POST /live/{stream_id}/join` - 視聴参加
- [ ] `POST /live/{stream_id}/chat` - チャット送信
- [ ] `POST /live/{stream_id}/gift` - ギフト送信
- [ ] WebSocket API（リアルタイムチャット）

### Analytics（分析）
- [ ] `GET /analytics/post/{post_id}` - 投稿分析
- [ ] `GET /analytics/account/{account_id}` - アカウント分析
- [ ] `GET /analytics/dashboard` - ダッシュボード

---

## 🚀 Phase 3: 本番環境準備（未実施）

### SES設定
- [ ] ドメイン取得（Route 53）
- [ ] SES ドメイン認証（SPF/DKIM）
- [ ] SES サンドボックス解除申請
- [ ] メール送信テスト

### Cognito本番設定
- [ ] Advanced Security Mode → StandardThreatProtectionMode (ENFORCED)
- [ ] Email → SES に切り替え
- [ ] 本番環境用カスタムドメイン設定

### 本番デプロイ
- [ ] bin/app.ts で本番スタックのコメント解除
- [ ] `npx cdk deploy --all`（本番環境）
- [ ] モニタリング・アラート設定
- [ ] バックアップ設定

---

## 💰 課金に関する注意

### 開発環境（現在）
- **Cognito**: Advanced Security OFF（無料）
- **Lambda**: 月100万リクエストまで無料
- **DynamoDB**: オンデマンド課金
- **API Gateway**: 月100万リクエストまで無料
- **S3**: ストレージ使用量に応じて課金

### 本番環境（Phase 3）
- **Cognito**: Advanced Security ENFORCED（$0.05/MAU）
- **SES**: 62,000通/月まで無料、以降 $0.10/1,000通
- その他は開発環境と同様

---

## 🔧 デプロイコマンド（参考）

### Bootstrap（初回のみ）
```powershell
npx cdk bootstrap
```

### デプロイ
```powershell
npx cdk deploy --all
```

### 削除（開発環境のみ）
```powershell
npx cdk destroy --all
```

⚠️ **本番環境は RemovalPolicy.RETAIN のため、destroy しても削除されません**

---

## 📞 AWS リソース

- **リージョン**: ap-northeast-1（東京）
- **アカウントID**: 620666897697
- **IAMユーザー**: piece-app-1983-dev
