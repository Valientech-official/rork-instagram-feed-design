# 実装TODO - チャット要求と画像の照合

このドキュメントは、チャット履歴の要求と`assets/images/todoimage`の画像を照合し、実装が必要な変更を詳細に記載しています。

---

## 📸 画像とチャット要求のマッピング

### 画像ファイルの対応関係
- **S__73285673_0.jpg〜S__73285700_0.jpg**: ホーム画面の各セクションの修正要求
- **S__73285716_0.jpg**: トップスタイリストセクション（維持）
- **S__73285870_0.jpg〜S__73285878_0.jpg**: オンボーディング画面の修正要求

---

## 🎯 実装タスク一覧

### 1. ウェーブスセクションの修正
**対応画像**: S__73285673_0.jpg, S__73285675_0.jpg
**チャット要求**:
> 赤マル箇所消して、左の赤マル箇所に「ウェーブス」と白文字で書いて
> 右上の赤マルSee All消して上に詰めて、
> 右にフォロワーのウェーブがスクロール延々と出来るようにして下さい。

**現在のファイル**: `components/LiveStreamsList.tsx`

**現在のコード** (18-19行目):
```typescript
title = "Live and ウェーブ",
showSeeAll = true
```

**変更内容**:
1. **タイトル変更**:
   - 18行目: `title = "Live and ウェーブ"` → `title = "ウェーブス"`
   - デフォルトタイトルを「ウェーブス」に変更

2. **See Allボタン削除**:
   - 19行目: `showSeeAll = true` → `showSeeAll = false`
   - または35-40行目のSee Allボタンのレンダリング部分を削除

3. **無限スクロール対応**:
   - 57-66行目のFlatListに`pagingEnabled={false}`を確認
   - データソースを拡張して無限スクロール可能にする

**変更後のイメージ**:
```typescript
// 18-19行目
title = "ウェーブス",
showSeeAll = false

// 33-42行目（See Allボタンを完全削除の場合）
<View style={styles.header}>
  <Text style={styles.title}>{title}</Text>
  {/* See Allボタンを削除 */}
</View>
```

---

### 2. デイリーチャレンジとトレンドQ&Aセクションの削除
**対応画像**: S__73285678_0.jpg, S__73285680_0.jpg
**チャット要求**:
> この2つの表示はいらないです。

**現在のファイル**: `app/(tabs)/index.tsx`

**現在のコード**:
- 29行目: `import DailyChallengeCard from '@/components/home/DailyChallengeCard';`
- 30行目: `import TrendingQA from '@/components/home/TrendingQA';`
- 264-268行目:
```typescript
{/* Daily Challenge Section */}
<DailyChallengeCard />

{/* Trending Q&A Section */}
<TrendingQA />
```

**変更内容**:
1. **インポート文を削除**:
   - 29行目と30行目を削除

2. **コンポーネント使用箇所を削除**:
   - 264-268行目を削除

**変更後**:
```typescript
// インポート部分（29-30行目削除）
// import DailyChallengeCard from '@/components/home/DailyChallengeCard'; // 削除
// import TrendingQA from '@/components/home/TrendingQA'; // 削除

// レンダリング部分（264-268行目削除）
{/* Daily Challenge Section - 削除 */}
{/* Trending Q&A Section - 削除 */}
```

---

### 3. おすすめアイテムセクションのタイトル変更とmoreボタン機能追加
**対応画像**: S__73285685_0.jpg
**チャット要求**:
> 赤マル箇所「おすすめ&トレンドアイテム」に変えて下さい。
> この縦2分割表示で8枚表示して、その続きをさらに見たかったら8枚目の後に右下あたりにmoreと書いて、押すとさらに8枚、さらに見たかったらまたmore押して8枚、とゆう表示に変えて欲しいです。

**現在のファイル**: `components/home/RecommendedGrid.tsx`

**現在のコード** (93行目):
```typescript
<Text style={styles.title}>おすすめアイテム</Text>
```

**変更内容**:
1. **タイトル変更**:
   - 93行目: `おすすめアイテム` → `おすすめ&トレンドアイテム`

2. **表示枚数制限とmoreボタン追加**:
   - 78行目あたりでstateを追加: `const [displayCount, setDisplayCount] = useState(8);`
   - 104行目のmapを変更: `{items.slice(0, displayCount).map((item, index) => (`
   - 8枚目の後にmoreボタンを追加するロジックを実装

**変更後のイメージ**:
```typescript
// 78行目付近
const [displayCount, setDisplayCount] = useState(8);

const handleLoadMore = () => {
  setDisplayCount(prev => prev + 8);
};

// 93行目
<Text style={styles.title}>おすすめ&トレンドアイテム</Text>

// 104-135行目のgrid部分
<View style={styles.grid}>
  {items.slice(0, displayCount).map((item, index) => (
    // 既存のグリッドアイテム
  ))}
  {displayCount < items.length && (
    <TouchableOpacity style={styles.moreButton} onPress={handleLoadMore}>
      <Text style={styles.moreButtonText}>more</Text>
    </TouchableOpacity>
  )}
</View>
```

---

### 4. Room Livesセクションの配置変更
**対応画像**: S__73285691_0.jpg, S__73285694_0.jpg
**チャット要求**:
> フォロワーではないオススメのウェーブが右スクロールで出てくるのは、ホーム画面をスクロールしていって投稿の途中に出てくる感じでお願いします。

**現在のファイル**: `app/(tabs)/index.tsx`

**現在のコード** (270-271行目):
```typescript
{/* Room Lives Section */}
<RoomLivesList />
```

**変更内容**:
1. **配置位置の変更**:
   - 270-271行目のRoomLivesListを、投稿（ShoppingPostやPost）の間に移動
   - 例: 277-279行目のShoppingPost表示の間に挿入

**変更後のイメージ**:
```typescript
{/* Shopping Posts */}
{shoppingPosts.slice(0, 1).map((post) => (
  <ShoppingPost key={post.id} post={post} />
))}

{/* Room Lives Section - ここに移動 */}
<RoomLivesList />

{shoppingPosts.slice(1, 3).map((post) => (
  <ShoppingPost key={post.id} post={post} />
))}
```

---

### 5. おすすめユーザーセクションのタイトル変更とSee All削除
**対応画像**: S__73285691_0.jpg, S__73285693_0.jpg
**チャット要求**:
> ここの赤マル箇所「あなたにおすすめアイテム&ユーザー」でお願いします。
> 「See All」消して

**現在のファイル**: `components/RecommendedUsersSlider.tsx`

**現在のコード**:
- 46行目: `<Text style={styles.title}>あなたにオススメのユーザー</Text>`
- 47-50行目: See Allボタンのレンダリング

**変更内容**:
1. **タイトル変更**:
   - 46行目: `あなたにオススメのユーザー` → `あなたにおすすめアイテム&ユーザー`

2. **See Allボタン削除**:
   - 47-50行目を削除

**変更後**:
```typescript
// 46行目
<Text style={styles.title}>あなたにおすすめアイテム&ユーザー</Text>

// 47-50行目削除
{/* See Allボタンを削除 */}
```

---

### 6. HOT ITEMセクションのタイトル変更とレイアウト変更
**対応画像**: S__73285697_0.jpg
**チャット要求**:
> ここの「あなたにおすすめ」って書いてる文字を「HOT ITEM」に変えて横スクロールしていけて見れるようにして下さい。
> 横1列でもいい気するんですが、一旦このまま2列でお願いします。

**現在のファイル**: `components/home/ShopTheLook.tsx`

**現在のコード**:
- 93行目: `<Text style={styles.title}>あなたにおすすめ</Text>`
- 104-134行目: 固定グリッドレイアウト（4列×2行）

**変更内容**:
1. **タイトル変更**:
   - 93行目: `あなたにおすすめ` → `HOT  ITEM`（スペース2つ）

2. **横スクロール対応の2列グリッドに変更**:
   - FlatListまたはScrollViewを使用した横スクロール実装
   - 2列表示を維持しながら横スクロール可能にする

**変更後のイメージ**:
```typescript
// 93行目
<Text style={styles.title}>HOT  ITEM</Text>

// 104-134行目を横スクロール対応に変更
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.scrollContent}
>
  {/* 2列ずつのグループを横に並べる */}
  {Array.from({ length: Math.ceil(items.length / 2) }).map((_, groupIndex) => (
    <View key={groupIndex} style={styles.columnGroup}>
      {items.slice(groupIndex * 2, groupIndex * 2 + 2).map((item) => (
        // 既存のグリッドアイテム
      ))}
    </View>
  ))}
</ScrollView>
```

---

### 7. ダークモード時のStatusBar設定
**対応画像**: S__73285700_0.jpg
**チャット要求**:
> ダークモードの時、デバイスの時間や充電表示などは白になるようにお願いします。

**対象ファイル**: `app/_layout.tsx` または `app/(tabs)/_layout.tsx`

**変更内容**:
1. **StatusBarコンポーネントの追加または設定変更**:
   - テーマに応じてStatusBarのスタイルを変更
   - ダークモード時は`barStyle="light-content"`
   - ライトモード時は`barStyle="dark-content"`

**実装例**:
```typescript
import { StatusBar } from 'expo-status-bar';
import { useThemeStore } from '@/store/themeStore';

export default function TabLayout() {
  const { theme } = useThemeStore();

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      {/* 既存のレイアウト */}
    </>
  );
}
```

---

### 8. トップスタイリストセクション（現状維持）
**対応画像**: S__73285716_0.jpg
**チャット要求**:
> この赤マル箇所はこのままにしといてくれますか？
> 表記をトップスタイリストではなく何にするかまた思考しますので、とりあえずこのまま置いといて下さい

**現在のファイル**: `components/home/TopStylists.tsx`

**変更内容**: なし（現状維持）

---

### 9. ウェーブスセクションのドア画像変更
**対応画像**: S__73285874_0.jpg
**チャット要求**:
> この写真が並んでるのは消して、こんな感じのオシャレなドア（部屋を連想させるため）に変えて欲しいです。

**現在のファイル**: `components/LiveStreamsList.tsx`

**現在のコード** (45-54行目):
```typescript
<View style={styles.doorImageContainer}>
  <Image
    source={{ uri: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1000" }}
    style={styles.doorImage}
    contentFit="cover"
  />
  <View style={styles.doorOverlay}>
    <Text style={styles.doorText}>Room</Text>
  </View>
</View>
```

**変更内容**:
1. **画像URLの変更**:
   - 47行目の画像URLを、S__73285874_0.jpgのようなおしゃれなドアの画像に変更
   - 推奨URL: `https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=400` （木製のおしゃれなドア）

**変更後**:
```typescript
<Image
  source={{ uri: "https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=400" }}
  style={styles.doorImage}
  contentFit="cover"
/>
```

---

### 10. オンボーディング画面のテキスト変更
**対応画像**: S__73285870_0.jpg, S__73285872_0.jpg
**チャット要求**:
> ここの赤マルのところ「Pièce」に変えて欲しいです。

**対象ファイル**: オンボーディング関連のファイル（要確認）
- 可能性のあるファイル: `app/onboarding/`, `components/Onboarding/`, `app/welcome/` など

**変更内容**:
1. **オンボーディング画面のファイルを特定**:
   - プロジェクト内でオンボーディング関連のファイルを検索
   - 「ぴーすへようこそ」というテキストを含むファイルを探す

2. **テキスト変更**:
   - 「ぴーすへようこそ」→「Pièce」または「Pièceへようこそ」
   - 「あなたのファッションの旅が始まります」は維持

**確認が必要**: オンボーディング画面のファイルが現在存在するか要確認

---

### 11. AI着せ替え機能（将来対応）
**チャット要求**:
> 投稿画像で服のみの画面がある場合、その画面を長押ししたらAI着せ替えしますか？みたいなアイコンがフワッと出てくるとか出来ますかね？
> 投稿以外でも、piece内で基本的に服のみの画像がある場合いつでもそれが出来るようになったらいいかなと思いまして。

**対象ファイル**: `components/Post.tsx`, `components/ShoppingPost.tsx`, `components/PhotoGallery.tsx`

**変更内容**（将来対応）:
1. **長押しジェスチャーの実装**:
   - `onLongPress`イベントハンドラを追加

2. **AI着せ替えアイコンの表示**:
   - Animated APIを使用したフェードイン/アウトアニメーション
   - 服のみの画像判定ロジック（画像分類APIまたは手動タグ付け）

3. **AI着せ替え機能の実装**:
   - AIサービスとの連携
   - モーダル表示でAI着せ替え結果を表示

**実装スコープ**: フェーズ2以降で対応

---

### 12. 投稿表示ロジックの変更
**対応画像**: S__73285689_0.jpg
**チャット要求**:
> で、その下からは、この感じで、フォロワーメインでオススメの投稿も混ぜながら表示していって欲しいです。

**現在のファイル**: `app/(tabs)/index.tsx`

**現在のコード** (277-287行目):
```typescript
{/* Shopping Posts */}
{shoppingPosts.slice(0, 3).map((post) => (
  <ShoppingPost key={post.id} post={post} />
))}

{/* Recommendations Slider */}
<RecommendationsSlider />

{/* More Posts */}
{posts.slice(0, 2).map((post) => (
  <Post key={post.id} post={post} />
))}
```

**変更内容**:
1. **投稿のミックス表示**:
   - フォロワーの投稿とおすすめの投稿を混在させるロジックを実装
   - 例: フォロワー投稿2つ → おすすめ投稿1つ → フォロワー投稿2つ...

2. **データソースの統合**:
   - `posts`と`shoppingPosts`を統合した配列を作成
   - ソート順序をカスタマイズ

**変更後のイメージ**:
```typescript
// 新しいロジック
const mixedPosts = useMemo(() => {
  const followerPosts = posts.filter(p => p.isFollowing);
  const recommendedPosts = posts.filter(p => !p.isFollowing);
  const mixed = [];

  // フォロワー投稿をメインに、おすすめを混ぜる
  for (let i = 0; i < followerPosts.length; i++) {
    mixed.push(followerPosts[i]);
    if ((i + 1) % 3 === 0 && recommendedPosts.length > 0) {
      mixed.push(recommendedPosts.shift());
    }
  }

  return mixed;
}, [posts]);

// レンダリング
{mixedPosts.map((post) => (
  post.type === 'shopping' ? (
    <ShoppingPost key={post.id} post={post} />
  ) : (
    <Post key={post.id} post={post} />
  )
))}
```

---

## 📋 実装優先順位

### 優先度: 高
1. ✅ デイリーチャレンジとトレンドQ&Aの削除（簡単、即効性あり）
2. ✅ タイトル変更（ウェーブス、おすすめ&トレンドアイテム、HOT ITEM等）
3. ✅ See Allボタンの削除（ウェーブス、おすすめユーザー）
4. ✅ StatusBarのダークモード対応

### 優先度: 中
5. ⏳ RecommendedGridのmoreボタン機能追加
6. ⏳ ShopTheLookの横スクロール2列グリッド実装
7. ⏳ RoomLivesListの配置変更（投稿の途中に表示）
8. ⏳ ドア画像の変更

### 優先度: 低
9. ⏳ オンボーディング画面のテキスト変更（ファイル確認が必要）
10. ⏳ 投稿表示ロジックの変更（フォロワーメインでおすすめ混在）
11. ⏳ 無限スクロール対応（ウェーブス）
12. 🔮 AI着せ替え機能（将来対応）

---

## 🛠️ 変更が必要なファイル一覧

1. **app/(tabs)/index.tsx**
   - DailyChallengeCard, TrendingQA削除
   - RoomLivesList配置変更
   - 投稿表示ロジック変更

2. **components/LiveStreamsList.tsx**
   - タイトル変更（ウェーブス）
   - See All削除
   - ドア画像変更
   - 無限スクロール対応

3. **components/home/RecommendedGrid.tsx**
   - タイトル変更（おすすめ&トレンドアイテム）
   - moreボタン機能追加

4. **components/RecommendedUsersSlider.tsx**
   - タイトル変更（あなたにおすすめアイテム&ユーザー）
   - See All削除

5. **components/home/ShopTheLook.tsx**
   - タイトル変更（HOT ITEM）
   - 横スクロール2列グリッド実装

6. **app/_layout.tsx または app/(tabs)/_layout.tsx**
   - StatusBarダークモード対応

7. **オンボーディング関連ファイル（要確認）**
   - テキスト変更（Pièce）

---

## 📝 注意事項

1. **段階的な実装**:
   - 優先度の高いタスクから実装
   - 各変更後にビルドとテストを実行

2. **デザインの一貫性**:
   - フォント、色、スペーシングは既存のデザインシステムに従う
   - ダークモード対応を忘れずに

3. **パフォーマンス**:
   - 無限スクロールはページネーション実装を推奨
   - 画像の最適化（適切なサイズ、lazy loading）

4. **今後の追加要素**:
   - AI着せ替え機能は別タスクとして管理
   - オンボーディング画面の存在確認が必要

---

## ✅ 実装完了チェックリスト

- [ ] LiveStreamsList.tsx: タイトルを「ウェーブス」に変更
- [ ] LiveStreamsList.tsx: See Allボタン削除
- [ ] LiveStreamsList.tsx: ドア画像を変更
- [ ] app/(tabs)/index.tsx: DailyChallengeCard削除
- [ ] app/(tabs)/index.tsx: TrendingQA削除
- [ ] RecommendedGrid.tsx: タイトルを「おすすめ&トレンドアイテム」に変更
- [ ] RecommendedGrid.tsx: moreボタン機能追加
- [ ] RoomLivesList.tsx: 投稿の途中に配置変更
- [ ] RecommendedUsersSlider.tsx: タイトルを「あなたにおすすめアイテム&ユーザー」に変更
- [ ] RecommendedUsersSlider.tsx: See All削除
- [ ] ShopTheLook.tsx: タイトルを「HOT ITEM」に変更
- [ ] ShopTheLook.tsx: 横スクロール2列グリッド実装
- [ ] app/_layout.tsx: StatusBarダークモード対応
- [ ] オンボーディング画面: テキスト変更（要ファイル確認）
- [ ] 投稿表示ロジック: フォロワーメインでおすすめ混在
- [ ] LiveStreamsList.tsx: 無限スクロール対応

---

**作成日**: 2025-10-23
**最終更新**: 2025-10-23
