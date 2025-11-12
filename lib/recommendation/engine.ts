/**
 * 推薦エンジン - 基盤実装
 * コンテンツベース + 協調フィルタリングのハイブリッドアプローチ
 */

import { Post, Product, Room, AccountSummary } from '@/types/api';

/**
 * ユーザープロフィール（推薦用）
 */
export interface UserProfile {
  account_id: string;
  interest_categories: string[]; // 興味のあるカテゴリ
  favorite_hashtags: string[]; // よく使うハッシュタグ
  following_ids: string[]; // フォロー中のユーザーID
  price_range?: { min: number; max: number }; // 好みの価格帯
  activity_level: number; // アクティビティレベル (0-10)
}

/**
 * スコアリング結果
 */
export interface ScoringResult {
  id: string;
  score: number;
  breakdown?: {
    content: number;
    popularity: number;
    freshness: number;
    similarity: number;
  };
}

/**
 * 重み設定
 */
export interface ScoreWeights {
  content: number;
  popularity: number;
  freshness: number;
  similarity: number;
}

// デフォルトの重み（タイムライン用）
const DEFAULT_WEIGHTS: ScoreWeights = {
  content: 0.35,
  popularity: 0.15,
  freshness: 0.15,
  similarity: 0.10,
};

/**
 * 1. コンテンツベーススコアを計算
 * ユーザーの興味とコンテンツの一致度
 */
export function calculateContentScore(
  item: Post | Product | Room,
  userProfile: UserProfile
): number {
  let score = 0.0;
  let matchCount = 0;

  // カテゴリマッチング
  if ('category' in item && userProfile.interest_categories.length > 0) {
    if (userProfile.interest_categories.includes(item.category)) {
      score += 0.5;
      matchCount++;
    }
  }

  // ハッシュタグマッチング
  if ('hashtags' in item && item.hashtags && userProfile.favorite_hashtags.length > 0) {
    const itemHashtags = Array.isArray(item.hashtags) ? item.hashtags : [];
    const commonHashtags = itemHashtags.filter(tag =>
      userProfile.favorite_hashtags.includes(tag)
    );

    if (commonHashtags.length > 0) {
      // 共通ハッシュタグの割合でスコアリング
      const ratio = commonHashtags.length / Math.max(itemHashtags.length, 1);
      score += ratio * 0.4;
      matchCount++;
    }
  }

  // 投稿者フォロー状況（投稿・商品の場合）
  if ('account_id' in item) {
    if (userProfile.following_ids.includes(item.account_id)) {
      score += 0.3;
      matchCount++;
    }
  }

  // 価格帯マッチング（商品の場合）
  if ('price' in item && userProfile.price_range) {
    const price = (item as Product).salePrice || (item as Product).price;
    if (price >= userProfile.price_range.min && price <= userProfile.price_range.max) {
      score += 0.2;
      matchCount++;
    }
  }

  // マッチがない場合は小さな基本スコア
  if (matchCount === 0) {
    return 0.1;
  }

  // スコアを正規化 (0.0 ~ 1.0)
  return Math.min(score, 1.0);
}

/**
 * 2. 人気度スコアを計算
 * エンゲージメント指標に基づく
 */
export function calculatePopularityScore(
  item: Post | Product | Room
): number {
  let engagementScore = 0;

  // 投稿の場合
  if ('likeCount' in item && 'commentCount' in item) {
    const post = item as Post;
    const totalEngagement = post.likeCount + (post.commentCount * 2) + (post.repostCount || 0);

    // 対数スケールで正規化（大きな数値を扱うため）
    engagementScore = Math.log10(totalEngagement + 1) / 5; // log10(100000) ≈ 5
  }

  // 商品の場合
  if ('clickCount' in item) {
    const product = item as Product;
    engagementScore = Math.log10(product.clickCount + 1) / 4;
  }

  // Roomの場合
  if ('member_count' in item && 'post_count' in item) {
    const room = item as Room;
    const roomEngagement = room.member_count + (room.post_count * 0.5);
    engagementScore = Math.log10(roomEngagement + 1) / 4;
  }

  // 0.0 ~ 1.0 に正規化
  return Math.min(engagementScore, 1.0);
}

/**
 * 3. 新鮮度スコアを計算
 * 投稿時刻からの経過時間で減衰
 */
export function calculateFreshnessScore(
  item: Post | Product | Room
): number {
  const now = Date.now() / 1000; // Unix秒
  // Room型はcreated_at、Post/Product型はcreatedAtを使用
  const createdAt = 'createdAt' in item ? item.createdAt : (item as any).created_at;

  // 経過時間（時間単位）
  const hoursElapsed = (now - createdAt) / 3600;

  // 指数減衰: e^(-t/24) （24時間で約1/e ≈ 0.37に減衰）
  const decayRate = 24; // 24時間で半減
  const freshnessScore = Math.exp(-hoursElapsed / decayRate);

  return Math.max(freshnessScore, 0.05); // 最低スコアを設定
}

/**
 * 4. 類似度スコアを計算
 * ユーザーの過去の行動との類似性
 */
export function calculateSimilarityScore(
  item: Post | Product | Room,
  userHistory: Array<{ item_id: string; weight: number }>
): number {
  // 簡易実装: 同じユーザーの投稿や同じカテゴリの履歴があればスコアアップ
  let similarityScore = 0.0;

  // 投稿者が過去に反応したユーザーと同じか
  if ('account_id' in item) {
    const hasInteraction = userHistory.some(h => {
      // 履歴に同じaccount_idのアイテムがあるか
      return h.item_id.startsWith(item.account_id);
    });
    if (hasInteraction) {
      similarityScore += 0.5;
    }
  }

  // カテゴリが過去に反応したものと同じか
  if ('category' in item) {
    const categoryMatch = userHistory.some(h => {
      // 実際は履歴アイテムのカテゴリと比較するが、簡易実装
      return h.weight > 5; // 高い重みの履歴があればマッチとみなす
    });
    if (categoryMatch) {
      similarityScore += 0.3;
    }
  }

  // ベースライン
  if (similarityScore === 0) {
    similarityScore = 0.2;
  }

  return Math.min(similarityScore, 1.0);
}

/**
 * 5. スコアを統合
 * 各スコアを重み付けして最終スコアを計算
 */
export function combineScores(
  scores: {
    content: number;
    popularity: number;
    freshness: number;
    similarity: number;
  },
  weights: ScoreWeights = DEFAULT_WEIGHTS
): number {
  const totalScore =
    scores.content * weights.content +
    scores.popularity * weights.popularity +
    scores.freshness * weights.freshness +
    scores.similarity * weights.similarity;

  // 重みの合計で正規化（通常は1.0だが念のため）
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

  return totalScore / totalWeight;
}

/**
 * 6. スコアの正規化
 * Min-Max正規化でスコアを0.0 ~ 1.0に変換
 */
export function normalizeScores(scores: number[]): number[] {
  if (scores.length === 0) return [];

  const min = Math.min(...scores);
  const max = Math.max(...scores);

  // すべて同じ値の場合
  if (max === min) {
    return scores.map(() => 0.5);
  }

  return scores.map(score => (score - min) / (max - min));
}

/**
 * 7. カテゴリでフィルタ
 */
export function filterByCategory<T extends { category?: string }>(
  items: T[],
  categories: string[]
): T[] {
  if (categories.length === 0) return items;

  return items.filter(item =>
    item.category && categories.includes(item.category)
  );
}

/**
 * 8. 重複アイテムを除去
 */
export function deduplicateItems<T extends { postId?: string; productId?: string; room_id?: string }>(
  items: T[]
): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const id = item.postId || item.productId || item.room_id;
    if (id && !seen.has(id)) {
      seen.add(id);
      result.push(item);
    }
  }

  return result;
}

/**
 * 9. バケット内でシャッフル
 * スコアが近いアイテムをランダムに並べ替え（多様性のため）
 */
export function shuffleWithinBuckets<T>(
  items: T[],
  scores: number[],
  bucketSize: number = 5
): T[] {
  if (items.length !== scores.length) {
    throw new Error('Items and scores must have the same length');
  }

  // スコアでソート（降順）
  const indexed = items.map((item, index) => ({ item, score: scores[index], index }));
  indexed.sort((a, b) => b.score - a.score);

  // バケットごとにシャッフル
  const result: T[] = [];
  for (let i = 0; i < indexed.length; i += bucketSize) {
    const bucket = indexed.slice(i, i + bucketSize);

    // Fisher-Yates shuffle
    for (let j = bucket.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [bucket[j], bucket[k]] = [bucket[k], bucket[j]];
    }

    result.push(...bucket.map(b => b.item));
  }

  return result;
}

/**
 * 10. 推薦アイテムのスコアリング（統合関数）
 * すべてのスコアリング関数を使って最終スコアを計算
 */
export function scoreItem(
  item: Post | Product | Room,
  userProfile: UserProfile,
  userHistory: Array<{ item_id: string; weight: number }>,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): ScoringResult {
  const contentScore = calculateContentScore(item, userProfile);
  const popularityScore = calculatePopularityScore(item);
  const freshnessScore = calculateFreshnessScore(item);
  const similarityScore = calculateSimilarityScore(item, userHistory);

  const finalScore = combineScores(
    {
      content: contentScore,
      popularity: popularityScore,
      freshness: freshnessScore,
      similarity: similarityScore,
    },
    weights
  );

  const itemId = ('postId' in item ? item.postId :
                  'productId' in item ? item.productId :
                  'room_id' in item ? item.room_id : '');

  return {
    id: itemId,
    score: finalScore,
    breakdown: {
      content: contentScore,
      popularity: popularityScore,
      freshness: freshnessScore,
      similarity: similarityScore,
    },
  };
}

/**
 * 11. 複数アイテムのスコアリング
 */
export function scoreItems<T extends (Post | Product | Room)>(
  items: T[],
  userProfile: UserProfile,
  userHistory: Array<{ item_id: string; weight: number }>,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): Array<T & { score: number }> {
  return items.map(item => {
    const scoringResult = scoreItem(item, userProfile, userHistory, weights);
    return {
      ...item,
      score: scoringResult.score,
    };
  });
}

/**
 * 12. トップN推薦を取得
 */
export function getTopRecommendations<T extends (Post | Product | Room)>(
  items: T[],
  userProfile: UserProfile,
  userHistory: Array<{ item_id: string; weight: number }>,
  limit: number = 20,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
  enableShuffle: boolean = true
): Array<T & { score: number }> {
  // スコアリング
  const scoredItems = scoreItems(items, userProfile, userHistory, weights);

  // スコアでソート（降順）
  scoredItems.sort((a, b) => b.score - a.score);

  // トップNを取得
  let topItems = scoredItems.slice(0, limit);

  // バケット内シャッフル（多様性）
  if (enableShuffle && topItems.length > 5) {
    const scores = topItems.map(item => item.score);
    topItems = shuffleWithinBuckets(topItems, scores, 5) as Array<T & { score: number }>;
  }

  return topItems;
}

/**
 * 13. 推薦結果をミックス
 * フォロワーの投稿とおすすめ投稿を適切な比率で混ぜる
 */
export function mixRecommendations<T>(
  followingItems: T[],
  recommendedItems: T[],
  ratio: { following: number; recommended: number } = { following: 2, recommended: 1 }
): T[] {
  const result: T[] = [];
  let followingIndex = 0;
  let recommendedIndex = 0;

  while (followingIndex < followingItems.length || recommendedIndex < recommendedItems.length) {
    // フォロー中のアイテムを追加
    for (let i = 0; i < ratio.following && followingIndex < followingItems.length; i++) {
      result.push(followingItems[followingIndex++]);
    }

    // おすすめアイテムを追加
    for (let i = 0; i < ratio.recommended && recommendedIndex < recommendedItems.length; i++) {
      result.push(recommendedItems[recommendedIndex++]);
    }
  }

  return result;
}
