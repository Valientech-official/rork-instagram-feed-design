# AI着せ替え機能 セットアップガイド

## 📋 現在の実装

### 環境別の動作
- **Web版**: クライアント側から直接Gemini API呼び出し（開発用）
- **アプリ版（iOS/Android）**: サーバー側API経由（本番用、APIキー安全）

### 自動切り替え
`Platform.OS !== 'web'` で環境を判定し、自動的に切り替わります。

---

## 🔧 セットアップ手順

### 1. APIキーの設定
`.env` ファイルに以下を設定：
```bash
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. アプリ起動
```bash
# Web版
npm start

# Android Development Build
npx expo run:android

# iOS Development Build (Macのみ)
npx expo run:ios
```

---

## 📝 将来の変更: クライアント側実装を削除する場合

Web版を廃止してアプリ版のみにする場合、以下をClaude Codeに伝えてください：

```
components/AIDressUpModal.tsxのhandleGenerate関数から、クライアント側のGemini API呼び出し実装を削除してください。サーバー側API（/api/genimage）呼び出しのみを残し、以下も削除：

1. GoogleGenerativeAIのインポート
2. Constants, expo-constantsのインポート
3. process.env.EXPO_PUBLIC_GEMINI_API_KEYの参照
4. else分岐のクライアント側実装全体（136-186行目）

サーバー側APIのfetch呼び出しのみを残してください。
```

---

## 🔒 セキュリティ

### 現在の状態
- ✅ **アプリ版**: APIキーは`app/api/genimage+api.ts`のサーバー側のみ（安全）
- ⚠️ **Web版**: APIキーがクライアント側に露出（開発用のみ推奨）

### 本番リリース時の推奨
Production Buildでは、サーバー側API経由で呼び出されるため、APIキーは露出しません。

---

## 📂 関連ファイル

- **components/AIDressUpModal.tsx** (89-197行目): 画像生成ロジック
- **app/api/genimage+api.ts**: サーバー側API（アプリ版で使用）
- **.env**: 環境変数（APIキー）
- **app.config.js**: 環境変数の読み込み設定

---

## 🎨 プロンプトのカスタマイズ

`components/AIDressUpModal.tsx` の109行目でプロンプトを変更できます：

```typescript
const prompt = `あなたのカスタムプロンプト ${sizeDescriptions[selectedSize]}`;
```
