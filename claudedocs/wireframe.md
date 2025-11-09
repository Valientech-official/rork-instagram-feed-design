# Rork Instagram Feed アプリ ワイヤーフレーム

## 全体構造

```mermaid
graph TD
    A[アプリ起動] --> B[タブナビゲーション]
    B --> C[ホーム/フィード]
    B --> D[検索]
    B --> E[投稿作成]
    B --> F[アクティビティ]
    B --> G[ルーム]
    B --> H[プロフィール]
    
    C --> C1[フィード画面詳細]
    D --> D1[検索画面詳細]
    E --> E1[投稿作成詳細]
    F --> F1[アクティビティ詳細]
    G --> G1[ルーム詳細]
    H --> H1[プロフィール詳細]
```

## 1. ホーム/フィード画面 (index.tsx)

```mermaid
graph TB
    subgraph "フィード画面 (5:1 分割レイアウト)"
        A[フィードヘッダー<br/>お気に入り・カート・ギャラリーボタン]
        
        subgraph "メインコンテンツ (5/6幅)"
            B[ライブストリーム一覧<br/>アクティブ配信のみ表示]
            C[投稿フィード]
            C --> C1[通常投稿]
            C --> C2[ショッピング投稿]
            C --> C3[おすすめカード]
            C --> C4[おすすめスライダー]
            C --> C5[ルームライブ一覧]
            C --> C6[おすすめユーザー]
        end
        
        subgraph "サイドバー (1/6幅)"
            D[ユーザー一覧<br/>ステータス付き]
            D --> D1[ライブ中ユーザー]
            D --> D2[新規投稿ユーザー]
            D --> D3[オンラインユーザー]
        end
        
        A --> B
        B --> C
    end
    
    E[お気に入りモーダル] -.-> A
    F[カートモーダル] -.-> A
    G[フォトギャラリー] -.-> A
```

## 2. 検索画面 (search.tsx)

```mermaid
graph TB
    subgraph "検索画面"
        A[検索バー]
        B[性別選択<br/>メンズ・レディース・ユニセックス・キッズ]
        C[予算選択<br/>～5,000円、～10,000円など]
        D[スタイルカテゴリ<br/>カジュアル・フォーマルなど]
        E[アイテムカテゴリ<br/>トップス・ボトムスなど]
        F[リサーチボタン]
        G[検索結果<br/>商品グリッド]
        H[トレンドアイテム<br/>おすすめ商品]
        
        A --> B
        B --> C
        C --> D
        D --> E
        E --> F
        F --> G
        G --> H
    end
    
    I[お気に入り画面] -.-> A
    J[カート画面] -.-> A
    K[フォトギャラリー] -.-> A
```

## 3. 投稿作成画面 (create.tsx)

```mermaid
graph TB
    subgraph "投稿作成画面"
        A[タイトル: Create Post Screen]
        B[※現在はプレースホルダー画面]
        C[実装予定機能]
        C --> C1[写真選択]
        C --> C2[キャプション入力]
        C --> C3[ハッシュタグ]
        C --> C4[位置情報]
        C --> C5[投稿ボタン]
    end
```

## 4. アクティビティ画面 (activity.tsx)

```mermaid
graph TB
    subgraph "アクティビティ画面"
        A[ビューモード切替<br/>水平・垂直レイアウト]
        B[お気に入り統計<br/>商品＋投稿数]
        C[カート統計<br/>アイテム総数]
        
        subgraph "お気に入りセクション"
            D[お気に入り投稿一覧]
            D --> D1[グリッド表示]
            D --> D2[ハート数表示]
        end
        
        subgraph "カートセクション"
            E[カート商品一覧]
            E --> E1[商品画像]
            E --> E2[価格表示]
            E --> E3[数量コントロール]
        end
        
        F[服カテゴリ表示]
        
        A --> B
        B --> C
        C --> D
        D --> E
        E --> F
    end
```

## 5. ルーム画面 (room.tsx)

```mermaid
graph TB
    subgraph "ルーム画面"
        A[ルーム/ライブ切替ボタン]
        
        subgraph "ルームモード"
            B[利用可能なルーム一覧]
            B --> B1[コーデQ&A Room]
            B --> B2[全身コーデ Room]
            B --> B3[ペアルック Room]
            B --> B4[シチュエーション Room]
            B --> B5[オススメALL Room]
            B --> B6[Nextトレンド Room]
            
            C[各ルームの情報]
            C --> C1[参加者数]
            C --> C2[ライブ状態]
            C --> C3[ルーム名]
        end
        
        subgraph "ライブモード"
            D[アクティブライブ一覧]
            D --> D1[ライブ配信者情報]
            D --> D2[視聴者数]
            D --> D3[配信タイトル]
        end
        
        E[選択されたルーム詳細]
        E --> E1[ルーム投稿一覧]
        E --> E2[コメント機能]
        
        A --> B
        A --> D
        B --> E
    end
```

## 6. プロフィール画面 (profile.tsx)

```mermaid
graph TB
    subgraph "プロフィール画面"
        A[ヘッダー部分]
        A --> A1[プロフィール画像]
        A --> A2[ユーザー名]
        A --> A3[自己紹介文]
        
        B[プロフィールアイコン行]
        
        C[スタイルセクション]
        C --> C1[スタイル画像一覧]
        
        D[お気に入りセクション]
        D --> D1[お気に入りアイテム]
        
        E[ソーシャルアカウント]
        E --> E1[連携アカウント一覧]
        
        F[管理アイコン]
        F --> F1[各種設定ボタン]
        
        G[ルームセクション]
        G --> G1[参加ルーム一覧]
        
        H[投稿グリッド]
        H --> H1[過去の投稿]
        H --> H2[グリッド表示]
        
        A --> B
        B --> C
        C --> D
        D --> E
        E --> F
        F --> G
        G --> H
    end
```

## タブナビゲーション構造

```mermaid
graph LR
    subgraph "下部タブバー"
        A[🏠 ホーム] 
        B[🔍 検索]
        C[➕ 作成]
        D[❤️ アクティビティ]
        E[🚪 ルーム]
        F[👤 プロフィール]
    end
    
    subgraph "隠しタブ"
        G[🛍️ ショップ]
        H[📺 ライブタブ]
    end
```

## モーダル・詳細画面の関係

```mermaid
graph TD
    A[メイン画面] --> B[お気に入りモーダル]
    A --> C[カートモーダル]
    A --> D[フォトギャラリー]
    A --> E[商品詳細ページ]
    A --> F[投稿詳細ページ]
    A --> G[ライブ詳細ページ]
    A --> H[フォロワー/フォロー画面]
    A --> I[保存済みアイテム]
    A --> J[分割ビュー]
```

## 主要機能フロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant H as ホーム画面
    participant S as 検索画面
    participant Sh as ショップ
    participant C as カート
    
    U->>H: アプリ起動
    H->>H: フィード表示
    U->>H: サイドバーでライブユーザー確認
    U->>S: 検索タブ選択
    S->>S: 条件設定（性別・予算・スタイル）
    U->>S: リサーチ実行
    S->>Sh: 商品一覧表示
    U->>Sh: 商品選択
    Sh->>C: カートに追加
    U->>C: カート確認・購入
```

## データ構造と状態管理

```mermaid
graph TB
    subgraph "Zustand Store"
        A[cartStore<br/>カート管理]
        B[favoritesStore<br/>お気に入り管理]
        C[photoGalleryStore<br/>写真ギャラリー]
    end
    
    subgraph "Mock Data"
        D[posts<br/>通常投稿]
        E[shoppingPosts<br/>ショッピング投稿]
        F[products<br/>商品データ]
        G[users<br/>ユーザーデータ]
        H[liveStreams<br/>ライブ配信]
        I[roomPosts<br/>ルーム投稿]
    end
    
    A --> D
    A --> E
    A --> F
    B --> D
    B --> F
    C --> G
```

## 画面サイズとレイアウト

```mermaid
graph TB
    subgraph "レスポンシブ設計"
        A[画面幅: window.width]
        A --> B[メインコンテンツ: 5/6 幅]
        A --> C[サイドバー: 1/6 幅]
        
        subgraph "カード設計"
            D[カード幅: (メイン幅 / 2) - 24px]
            E[カード高さ: カード幅 * 0.8]
        end
        
        subgraph "安全エリア対応"
            F[上部: useSafeAreaInsets]
            G[下部: タブバー + insets.bottom]
        end
    end
```