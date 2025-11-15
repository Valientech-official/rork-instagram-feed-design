# アプリアイコン設定ガイド

## 現在の状況
- ✅ SVGアイコン作成済み: `assets/images/app-icon-full.svg`
- ⏳ PNGへの変換が必要
- ⏳ Expo設定への適用が必要

## ステップ1: SVGをPNGに変換

### 方法A: オンラインツール（推奨・最も簡単）

1. https://svgtopng.com/ にアクセス
2. `assets/images/app-icon-full.svg` をアップロード
3. サイズを **1024x1024** に設定
4. 「Convert」をクリック
5. ダウンロードしたPNGファイルを以下のように配置：
   - `assets/images/icon.png` として保存
   - `assets/images/adaptive-icon.png` として保存（Androidに同じものを使用）

### 方法B: macOSのターミナル（技術的）

```bash
# プロジェクトのルートディレクトリで実行
cd /Users/kadotani/Documents/dev-projects/GitHub/rork-instagram-feed-design

# ImageMagickがインストールされていない場合
brew install imagemagick

# SVGをPNGに変換（1024x1024）
convert -background none -size 1024x1024 assets/images/app-icon-full.svg assets/images/icon.png
convert -background none -size 1024x1024 assets/images/app-icon-full.svg assets/images/adaptive-icon.png
```

### 方法C: Figmaを使用

1. Figmaを開く
2. 1024x1024のフレームを作成
3. SVGファイルをインポート
4. PNG形式でエクスポート（@1x, 1024x1024）

## ステップ2: ファイル配置の確認

変換後、以下のファイルが必要です：

```
assets/images/
├── icon.png (1024x1024) ← メインアイコン
├── adaptive-icon.png (1024x1024) ← Android用
├── splash-icon.png (既存)
└── favicon.png (既存)
```

## ステップ3: Expo設定の確認

`app.json` の設定（既に正しく設定されています）：

```json
{
  "expo": {
    "icon": "./assets/images/icon.png",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#1A1A1A"
      }
    }
  }
}
```

## ステップ4: アプリを再ビルド

PNGファイルを配置したら：

```bash
# Expoサーバーを再起動
npx expo start --clear

# iOSの場合
npx expo run:ios

# Androidの場合
npx expo run:android
```

## 注意事項

1. **背景色**: Android adaptive iconの背景色は `#1A1A1A`（ダークモード背景）に設定
2. **ファイルサイズ**: アイコンは1024x1024ピクセル必須
3. **透過**: app-icon-full.svgは背景が `#1A1A1A` なので透過なし
4. **キャッシュ**: アイコン変更後は `--clear` フラグで必ずキャッシュクリア

## トラブルシューティング

### アイコンが反映されない場合

1. ファイル名を確認: `icon.png` と `adaptive-icon.png`
2. ファイルサイズを確認: 1024x1024ピクセル
3. キャッシュをクリア: `npx expo start --clear`
4. アプリを削除してから再インストール

### アイコンが切れている場合

Android adaptive iconは外側の15%が切れる場合があります。
重要な要素は中央の70%に配置してください。

## 次のステップ

1. ✅ このファイルを読む
2. ⏳ SVGをPNGに変換（方法A推奨）
3. ⏳ PNGファイルをassets/imagesに配置
4. ⏳ Expoアプリを再起動して確認
