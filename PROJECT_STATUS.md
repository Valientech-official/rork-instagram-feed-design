# プロジェクト現状 - RORK Instagram Feed Design

**最終更新**: 2025年10月22日
**プロジェクトディレクトリ**: `/c/projects/rork-instagram-feed-design`

---

## 📱 プロジェクト概要

**アプリ名**: Instagram Feed Design (RORK)
**種類**: SNS × ショップ アプリ
**プラットフォーム**: iOS, Android, Web
**開発フレームワーク**: React Native + Expo Router
**状態管理**: Zustand
**スタイリング**: NativeWind (Tailwind CSS for React Native)
**言語**: TypeScript

---

## 🏗️ プロジェクト構造

```
rork-instagram-feed-design/
├── app/                         # Expo Router ページ（App Router構造）
│   ├── (auth)/                  # 認証関連ページ
│   │   ├── login.tsx           # ログイン画面
│   │   ├── signup.tsx          # サインアップ画面
│   │   ├── splash.tsx          # スプラッシュ画面
│   │   └── _layout.tsx         # 認証レイアウト
│   ├── (onboarding)/           # オンボーディングフロー
│   │   ├── welcome.tsx         # ウェルカム画面
│   │   ├── profile.tsx         # プロフィール設定
│   │   ├── avatar.tsx          # アバター設定
│   │   ├── styles.tsx          # スタイル選択
│   │   ├── genres.tsx          # ジャンル選択
│   │   ├── brands.tsx          # ブランド選択
│   │   ├── social.tsx          # SNSリンク設定
│   │   └── _layout.tsx
│   ├── (tabs)/                 # メインタブナビゲーション
│   │   ├── index.tsx           # ホームフィード
│   │   ├── search.tsx          # 検索画面
│   │   ├── user_search.tsx     # ユーザー検索
│   │   ├── create.tsx          # 投稿作成
│   │   ├── live-tab.tsx        # ライブ配信タブ
│   │   ├── notification.tsx    # 通知
│   │   ├── activity.tsx        # アクティビティ
│   │   ├── dm.tsx              # ダイレクトメッセージ
│   │   ├── profile.tsx         # プロフィール
│   │   ├── shop.tsx            # ショップ
│   │   ├── room.tsx            # ルーム機能
│   │   ├── dressup.tsx         # AI着せ替え機能
│   │   └── _layout.tsx
│   ├── api/                    # サーバーサイドAPI
│   │   └── genimage+api.ts     # AI画像生成エンドポイント
│   ├── live/                   # ライブ配信関連
│   ├── post/                   # 投稿詳細
│   ├── product/                # 商品詳細
│   ├── room/                   # ルーム詳細
│   ├── settings/               # 設定画面
│   ├── cart.tsx                # カート画面
│   ├── followers.tsx           # フォロワー一覧
│   ├── following.tsx           # フォロー中一覧
│   └── +not-found.tsx          # 404ページ
│
├── components/                  # 再利用可能なコンポーネント
│   ├── home/                   # ホーム画面用コンポーネント
│   │   ├── DailyChallengeCard.tsx
│   │   ├── RecommendedGrid.tsx
│   │   ├── ShopTheLook.tsx
│   │   ├── TopStylists.tsx
│   │   └── TrendingQA.tsx
│   ├── icons/                  # カスタムアイコン
│   │   ├── DMIcon.tsx
│   │   ├── NotificationIcon.tsx
│   │   └── SearchIcon.tsx
│   ├── AIDressUpModal.tsx      # AI着せ替えモーダル
│   ├── CartGrid.tsx
│   ├── CategoryScroll.tsx
│   ├── ClothingCategories.tsx
│   ├── CreateModeSelector.tsx
│   ├── DoubleTapLike.tsx
│   ├── FavoritesGrid.tsx
│   ├── FeaturedProducts.tsx
│   ├── FeedHeader.tsx
│   ├── ImageCarousel.tsx
│   ├── LiveComment.tsx
│   └── その他多数...
│
├── store/                       # Zustand ストア（状態管理）
│   ├── authStore.ts            # 認証状態・ユーザー情報・オンボーディング
│   ├── cartStore.ts            # ショッピングカート
│   ├── favoritesStore.ts       # お気に入り
│   ├── photoGalleryStore.ts    # 写真ギャラリー
│   └── themeStore.ts           # テーマ設定（ダーク/ライトモード）
│
├── constants/                   # 定数・設定
├── mocks/                       # モックデータ
├── assets/                      # 画像・フォント等のアセット
├── .env                         # 環境変数（APIキー等）
├── app.config.js               # Expo設定（動的）
├── app.json                    # Expo設定（静的）
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔧 技術スタック

### フロントエンド
- **React Native**: `0.81.4`
- **React**: `19.1.0`
- **Expo**: `^54.0.10`
- **Expo Router**: `~6.0.8` (App Router構造)
- **TypeScript**: `~5.8.3`
- **NativeWind**: `^4.1.23` (Tailwind CSS)

### 状態管理
- **Zustand**: `^5.0.2`
- **AsyncStorage**: ローカルストレージ

### UIライブラリ
- **Expo Vector Icons**: `^15.0.2`
- **Lucide React Native**: `^0.522.0`
- **React Native Reanimated**: `~4.1.1`
- **React Native Gesture Handler**: `~2.28.0`

### AI機能
- **Google Generative AI**: `^0.24.1` (Gemini API)

### ナビゲーション
- **React Navigation**: `^7.1.6`
- **Expo Router**: ファイルベースルーティング

### その他
- **Expo Image Picker**: 画像選択
- **Expo Media Library**: メディアライブラリアクセス
- **Expo Location**: 位置情報
- **Expo Haptics**: 触覚フィードバック

---

## 🎨 主要機能の実装状況

### ✅ 実装済み機能

#### 1. 認証・オンボーディング
- スプラッシュ画面
- ログイン/サインアップ
- 7ステップのオンボーディングフロー
  - ウェルカム → プロフィール → アバター → スタイル → ジャンル → ブランド → SNSリンク

#### 2. メインアプリ機能
- **ホームフィード**: セクション型レイアウト
  - デイリーチャレンジ
  - おすすめグリッド
  - Shop the Look (2x4グリッド)
  - トップスタイリスト
  - トレンドQ&A
- **検索機能**: ユーザー/コンテンツ検索
- **投稿作成**: 写真/動画投稿
- **プロフィール**: ユーザープロフィール表示・編集
- **ショップ**: EC機能
- **カート**: ショッピングカート
- **お気に入り**: いいね機能
- **通知**: プッシュ通知
- **DM**: ダイレクトメッセージ
- **ルーム機能**: グループチャット
- **ライブ配信タブ**: ライブストリーミング（UI準備済み）

#### 3. AI機能
- **AI着せ替え機能**: Gemini APIを使用した画像生成
  - Web版: クライアントサイドAPI呼び出し
  - アプリ版: サーバーサイドAPI (`/api/genimage+api.ts`) 経由

#### 4. デザイン・テーマ
- **ダークモード**: 完全実装
  - テーマ切り替え機能
  - 全ページ対応
  - ボトムナビゲーションバー対応
- **日本語ローカライゼーション**: ホーム画面完了

#### 5. 状態管理
- **authStore**: ユーザー認証、オンボーディングデータ
- **cartStore**: カート管理
- **favoritesStore**: お気に入り管理
- **themeStore**: テーマ設定
- **photoGalleryStore**: 写真ギャラリー

---

## 🚧 未実装・進行中の機能

### バックエンド統合
現在、フロントエンドのみが実装されており、**バックエンドAPI・データベース接続は未実装**です。

**次のステップ（DB設計完了後）**:
1. AWS Serverless バックエンド構築
   - Lambda関数
   - API Gateway
   - DynamoDB
2. 認証システム（JWT）
3. リアルタイム機能（WebSocket）
4. ライブ配信（Mux API統合）
5. 通知システム
6. メディアストレージ（S3）

---

## 📦 最近の変更（Git履歴より）

```
5f8f8e0 Apply dark theme to bottom navigation bar
c5c8d23 Move ShopTheLook position and localize all home components to Japanese
5a2308e Add Shop the Look section with 2x4 grid layout
269cb51 Redesign home page with section-based layout
04abf62 Fix createStyles function scope error
72246be Apply dark theme to all pages by default
c4eb9de Implement dark theme system with toggle
73083b2 Fix JSX syntax errors and Peace icon import issue
8c539c0 プロフィールページ改善（設定マーク統合）、ショップページ改善、登録ページ改善
12cbe7b スプラッシュページ実装
```

---

## 🔑 環境変数 (.env)

```bash
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🚀 開発コマンド

```bash
# アプリ起動（トンネル経由）
npm start

# Web版起動
npm run start-web

# Web版（デバッグモード）
npm run start-web-dev
```

---

## 📱 アプリ設定

**Bundle ID (iOS)**: `app.rork.instagramfeeddesign`
**Package (Android)**: `app.rork.instagramfeeddesign`
**スキーマ**: `myapp://`

### パーミッション
- カメラアクセス
- 写真ライブラリアクセス
- マイクアクセス
- 位置情報アクセス（準備済み）
- メディアライブラリ（読み書き）

---

## 🧩 Expo Router 構造

このプロジェクトは **Expo Router** (ファイルベースルーティング) を採用しています。

### ルーティング例
| ファイルパス | URL |
|------------|-----|
| `app/(tabs)/index.tsx` | `/` (ホーム) |
| `app/(tabs)/search.tsx` | `/search` |
| `app/(auth)/login.tsx` | `/login` |
| `app/post/[id].tsx` | `/post/123` |
| `app/product/[id].tsx` | `/product/456` |

### レイアウトネスト
```
app/
├── _layout.tsx (ルートレイアウト)
├── (auth)/_layout.tsx (認証レイアウト)
├── (tabs)/_layout.tsx (タブレイアウト)
└── (onboarding)/_layout.tsx (オンボーディングレイアウト)
```

---

## 📊 データベース設計状況

**全27テーブル設計完了** ✅
詳細は以下のドキュメントを参照:

📂 **AI Drive**: `/SNS_Shop_App_DB_Design/`
- `README.md` - 目次・概要
- `01_Phase1-2_基本SNS機能.md` - 14テーブル
- `02_Phase3_ライブ配信.md` - 5テーブル + Mux連携
- `03_Phase4_ショップ機能.md` - 2テーブル
- `04_Phase5_追加機能.md` - 5テーブル
- `05_GSI一覧.md` - 全35個のGSI
- `06_TTL設定.md` - 自動削除設定
- `07_実装ガイド.md` - ベストプラクティス
- `08_用語集.md` - 専門用語解説

---

## 🎯 次のステップ（10/23～10/31実装予定）

1. **プロジェクトセットアップ**
   - AWS SAM / Serverless Framework選択
   - ディレクトリ構造作成
   - 環境変数設定

2. **DynamoDBテーブル作成**
   - 全27テーブル作成
   - GSI設定（35個）
   - TTL設定（6テーブル）

3. **Lambda関数実装**
   - 認証API
   - 投稿API
   - ライブ配信API（Mux連携）
   - 通知API

4. **フロントエンド統合**
   - APIクライアント作成
   - 状態管理とAPI連携
   - エラーハンドリング

5. **テスト・デプロイ**
   - 統合テスト
   - AWS環境デプロイ
   - 最終確認

---

## 👨‍💻 開発チーム

**株式会社Valientech**
代表取締役: 角谷史恩

---

## 📝 メモ

- **App Router vs Pages Router**: Expo Routerを使用（ファイルベースルーティング）
- **TypeScript**: 全ファイルでTypeScript使用
- **スタイリング**: NativeWind (Tailwind CSS) を採用
- **状態管理**: Zustand（軽量・シンプル）
- **AI機能**: Gemini APIを使用した画像生成機能実装済み

---

**このドキュメントは、AIエージェント（Claude Code等）がプロジェクトの現状を理解するために作成されました。**
