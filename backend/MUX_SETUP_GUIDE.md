# Mux セットアップガイド

このガイドでは、ライブストリーミング機能に必要なMuxの設定手順を説明します。

---

## 📋 前提条件

- クレジットカード（無料プランでも必要）
- メールアドレス
- AWS CLIがインストール済み
- AWSアカウントへのアクセス権限

---

## ステップ1: Muxアカウント作成

### 1.1 サインアップ

1. Mux公式サイトにアクセス
   ```
   https://dashboard.mux.com/signup
   ```

2. 以下の情報を入力：
   - **Email**: あなたのメールアドレス
   - **Password**: 強力なパスワード（8文字以上）
   - **Company Name**: 会社名またはプロジェクト名（例: Piece App）

3. **Sign Up**ボタンをクリック

4. 確認メールが届くので、メール内のリンクをクリックして認証

### 1.2 プランの選択

1. ログイン後、プランの選択画面が表示されます
2. **Pay As You Go**（従量課金プラン）を選択
   - 無料クレジット: 月$20（約1,333分のライブ配信）
   - 超過分: $0.015/分

3. クレジットカード情報を入力
   - 無料枠内であれば請求されません

---

## ステップ2: API認証情報の取得

### 2.1 Access Token の作成

1. Muxダッシュボードにログイン
   ```
   https://dashboard.mux.com/
   ```

2. 左メニューから **Settings** をクリック

3. **Access Tokens** タブを選択

4. **Generate new token** ボタンをクリック

5. トークン情報を入力：
   - **Token Name**: `Piece App Backend` (任意の名前)
   - **Environment**: `Development` を選択
   - **Permissions**: 以下をチェック
     - ✅ **Mux Video** - Full Access
     - ✅ **Mux Data** - Read (オプション、分析用)

6. **Generate Token** をクリック

7. 表示される情報を**必ず控えます**：
   ```
   Access Token ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   Secret Key: yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
   ```

   ⚠️ **重要**: Secret Keyは二度と表示されません！必ず今コピーして安全な場所に保存してください。

### 2.2 保存した情報の確認

以下の2つの情報が手元にあることを確認：
- ✅ Access Token ID
- ✅ Secret Key

---

## ステップ3: Webhook の設定

### 3.1 Webhook の作成

1. Muxダッシュボードで **Settings** → **Webhooks** を選択

2. **Create new webhook** ボタンをクリック

3. 一旦、仮のURLを入力（後で変更します）：
   ```
   https://example.com/webhooks/mux
   ```

4. **Events to send** で以下をチェック：
   - ✅ `video.live_stream.active` - 配信開始時
   - ✅ `video.live_stream.idle` - 配信停止時
   - ✅ `video.asset.ready` - VOD作成完了時
   - ✅ `video.asset.errored` - エラー発生時

5. **Create webhook** をクリック

6. 表示される **Webhook Signing Secret** を控えます：
   ```
   Webhook Secret: zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz
   ```

### 3.2 保存した情報の確認

以下の3つの情報が手元にあることを確認：
- ✅ Access Token ID
- ✅ Secret Key
- ✅ Webhook Secret

---

## ステップ4: AWS Secrets Manager に保存

### 4.1 Secretの作成（初回のみ）

```bash
# AWS CLIで認証情報を保存
aws secretsmanager create-secret \
  --name rork/mux-credentials \
  --description "Mux API credentials for live streaming" \
  --secret-string '{
    "accessTokenId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "secretKey": "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
    "webhookSecret": "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"
  }' \
  --region ap-northeast-1
```

⚠️ **重要**:
- `xxxxxxxx...` の部分を実際のAccess Token IDに置き換え
- `yyyyyyy...` の部分を実際のSecret Keyに置き換え
- `zzzzzzz...` の部分を実際のWebhook Secretに置き換え

### 4.2 Secretの更新（既に作成済みの場合）

```bash
# 既存のSecretを更新
aws secretsmanager put-secret-value \
  --secret-id rork/mux-credentials \
  --secret-string '{
    "accessTokenId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "secretKey": "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
    "webhookSecret": "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"
  }' \
  --region ap-northeast-1
```

### 4.3 保存確認

```bash
# 保存した認証情報を確認
aws secretsmanager get-secret-value \
  --secret-id rork/mux-credentials \
  --region ap-northeast-1 \
  --query SecretString \
  --output text | jq .
```

出力例：
```json
{
  "accessTokenId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "secretKey": "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
  "webhookSecret": "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"
}
```

---

## ステップ5: CDK デプロイ

### 5.1 パッケージの最終確認

```bash
# srcディレクトリに移動
cd C:\projects\rork-instagram-feed-design\backend\src

# 必要なパッケージがインストールされているか確認
npm list @mux/mux-node @aws-sdk/client-secrets-manager @aws-sdk/client-apigatewaymanagementapi
```

### 5.2 TypeScriptビルド

```bash
# ソースコードをビルド
npm run build

# エラーがないか確認
echo $?  # 0ならOK
```

### 5.3 CDKインフラのビルド

```bash
# infrastructureディレクトリに移動
cd C:\projects\rork-instagram-feed-design\backend\infrastructure

# CDKをビルド
npm run build

# エラーがないか確認
echo $?  # 0ならOK
```

### 5.4 デプロイ前の確認

```bash
# 変更内容を確認（Dry run）
cdk diff
```

### 5.5 デプロイ実行

```bash
# 全スタックをデプロイ
cdk deploy --all

# または、スタックごとにデプロイ
# cdk deploy PieceApp-DynamoDB-Dev
# cdk deploy PieceApp-SecretsManager-Dev
# cdk deploy PieceApp-Lambda-Dev
# cdk deploy PieceApp-ApiGateway-Dev
# cdk deploy PieceApp-WebSocket-Dev
# cdk deploy PieceApp-Cognito-Dev
```

デプロイには10-15分かかります。完了するまで待ちましょう。

---

## ステップ6: API Gateway URL の取得

### 6.1 REST API URL の取得

```bash
# API Gateway URLを取得
aws cloudformation describe-stacks \
  --stack-name PieceApp-ApiGateway-Dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text
```

出力例：
```
https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/
```

### 6.2 WebSocket API URL の取得

```bash
# WebSocket URLを取得
aws cloudformation describe-stacks \
  --stack-name PieceApp-WebSocket-Dev \
  --query 'Stacks[0].Outputs[?OutputKey==`WebSocketUrl`].OutputValue' \
  --output text
```

出力例：
```
wss://yyyyyyyyyy.execute-api.ap-northeast-1.amazonaws.com/prod
```

---

## ステップ7: Mux Webhook URL の更新

### 7.1 Webhook URLの設定

1. Muxダッシュボードで **Settings** → **Webhooks** を選択

2. 先ほど作成したWebhookの **Edit** をクリック

3. **Webhook URL** を実際のAPI Gateway URLに更新：
   ```
   https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/webhooks/mux
   ```
   （`xxxxxxxxxx`の部分は実際のAPI Gateway URLに置き換え）

4. **Update webhook** をクリック

5. **Test webhook** ボタンで接続テスト
   - ✅ "Webhook successfully sent" と表示されればOK
   - ❌ エラーが出た場合は、URLを再確認

---

## ステップ8: 動作確認

### 8.1 ライブ配信作成のテスト

```bash
# API Gatewayエンドポイントを環境変数に設定
export API_URL="https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod"

# ライブ配信を作成（テスト用）
curl -X POST "${API_URL}/live-streams" \
  -H "Content-Type: application/json" \
  -H "x-account-id: test_user_001" \
  -d '{
    "room_id": "test_room_001",
    "title": "テスト配信",
    "description": "Mux連携のテスト"
  }'
```

期待されるレスポンス：
```json
{
  "success": true,
  "data": {
    "stream_id": "01HXXXXXXXXXXXXXXXXXXXXX",
    "mux_stream_key": "xxxx-xxxx-xxxx-xxxx",
    "mux_playback_id": "yyyy...yyyy",
    "rtmp_url": "rtmps://global-live.mux.com:443/app",
    "stream_key": "xxxx-xxxx-xxxx-xxxx",
    "playback_url": "https://stream.mux.com/yyyy...yyyy.m3u8",
    "status": "idle",
    "created_at": 1234567890
  }
}
```

### 8.2 CloudWatch Logs の確認

```bash
# ログを確認
aws logs tail /aws/lambda/piece-app-create-live-stream-dev --follow
```

### 8.3 Webhookのテスト

1. Muxダッシュボードで **Settings** → **Webhooks** を選択
2. 作成したWebhookの **Test webhook** をクリック
3. CloudWatch Logsで受信ログを確認：
   ```bash
   aws logs tail /aws/lambda/piece-app-mux-webhook-dev --follow
   ```

---

## ✅ セットアップ完了チェックリスト

- [ ] Muxアカウント作成完了
- [ ] Access Token ID取得
- [ ] Secret Key取得
- [ ] Webhook Secret取得
- [ ] AWS Secrets Manager設定完了
- [ ] CDKデプロイ成功
- [ ] API Gateway URL取得
- [ ] Mux Webhook URL設定完了
- [ ] Webhookテスト成功
- [ ] ライブ配信作成テスト成功

---

## 🎉 次のステップ

セットアップが完了したら、以下を実施できます：

1. **フロントエンドアプリとの統合**
   - API Clientの実装
   - Mux Playerの統合
   - ライブ配信UIの実装

2. **本番環境へのデプロイ**
   - 本番用Muxアカウント作成
   - 本番用CDKスタックのデプロイ

3. **テストと検証**
   - エンドツーエンドテスト
   - パフォーマンステスト
   - 負荷テスト

---

## 🆘 トラブルシューティング

### Q1: Webhook URLのテストが失敗する

**A1**: 以下を確認してください：
- API Gateway URLが正しいか
- Lambda関数がデプロイされているか
- CloudWatch Logsでエラーを確認

```bash
# Lambda関数の確認
aws lambda get-function --function-name piece-app-mux-webhook-dev

# CloudWatch Logsでエラー確認
aws logs tail /aws/lambda/piece-app-mux-webhook-dev --follow
```

### Q2: ライブ配信作成APIがエラーになる

**A2**: Secrets Managerの認証情報を確認：
```bash
# Secret値を確認
aws secretsmanager get-secret-value \
  --secret-id rork/mux-credentials \
  --query SecretString \
  --output text
```

### Q3: CloudWatch Logsに "Failed to get Mux credentials" エラー

**A3**: Lambda関数にSecrets Manager権限があるか確認：
```bash
# Lambda関数のIAMロールを確認
aws lambda get-function-configuration \
  --function-name piece-app-create-live-stream-dev \
  --query Role
```

---

## 📚 参考リンク

- [Mux公式ドキュメント](https://docs.mux.com/)
- [Mux Live Streaming Guide](https://docs.mux.com/guides/video/stream-live-video)
- [Mux Webhooks](https://docs.mux.com/guides/video/listen-for-webhooks)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [AWS CDK](https://docs.aws.amazon.com/cdk/)

---

**作成日**: 2025年1月
**最終更新**: 2025年1月
