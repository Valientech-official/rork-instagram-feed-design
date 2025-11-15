# アプリアイコンの作成手順

## 作成したSVGファイル

1. **app-icon.svg** - グラデーション背景に大きな「P」
2. **app-icon-full.svg** - 白背景にカラフルな「Pièce」

## PNG形式に変換する方法

### オンラインツールを使用（推奨）
1. https://svgtopng.com/ にアクセス
2. SVGファイルをアップロード
3. サイズを1024x1024に設定
4. ダウンロード

### macOSの場合
```bash
# SVGをPNGに変換（ImageMagickが必要）
brew install imagemagick
convert -background none -size 1024x1024 app-icon.svg icon.png
```

## Expoアプリに適用する方法

1. 以下のサイズのPNGを用意：
   - iOS: 1024x1024px (icon.png)
   - Android Adaptive: 1024x1024px (adaptive-icon.png)

2. ファイルを配置：
   ```
   assets/
     ├── icon.png (1024x1024)
     ├── adaptive-icon.png (1024x1024)
     └── splash.png (任意)
   ```

3. app.json / app.config.js で設定：
   ```json
   {
     "expo": {
       "icon": "./assets/icon.png",
       "android": {
         "adaptiveIcon": {
           "foregroundImage": "./assets/adaptive-icon.png",
           "backgroundColor": "#FFFFFF"
         }
       },
       "ios": {
         "icon": "./assets/icon.png"
       }
     }
   }
   ```

## デザイン選択のガイド

### app-icon.svg (グラデーション + P)
- ✅ モダンでシンプル
- ✅ 視認性が高い
- ✅ 小さいサイズでも認識しやすい
- 推奨: メインアイコンとして使用

### app-icon-full.svg (白背景 + Pièce)
- ✅ ブランド名がわかりやすい
- ⚠️ 小さいサイズでは文字が読みにくい可能性
- 推奨: スプラッシュスクリーンやAbout画面で使用

## カラーコード
- P: #9ACD32 (Yellow-green)
- i: #FF69B4 (Pink)
- è: #87CEEB (Sky blue)
- c: #FFD700 (Gold/Yellow)
- e: #DDA0DD (Plum/Light purple)
