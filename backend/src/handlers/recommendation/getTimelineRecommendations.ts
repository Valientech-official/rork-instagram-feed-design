/**
 * タイムライン推薦ハンドラー
 * ユーザーの行動履歴に基づいておすすめ投稿を返す
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { PostItem, UserBehaviorItem, RecommendationCacheItem, AccountItem } from '../../types/dynamodb';
import { AccountSummary } from '../../types/api';
import {
  successResponse,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
} from '../../lib/utils/response';
import { validatePaginationLimit } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, query, getItem, putItem } from '../../lib/dynamodb';

/**
 * タイムライン推薦Lambda関数
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // TODO: JWTトークンから account_id を取得
    // const accountId = event.requestContext.authorizer?.claims?.sub;

    // 現在はヘッダーから取得（開発用）
    const accountId = event.headers['x-account-id'];

    if (!accountId) {
      return unauthorizedResponse('アカウントIDが取得できません');
    }

    // クエリパラメータを取得
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 20;

    const validatedLimit = validatePaginationLimit(limit);

    // 1. キャッシュチェック
    const cachedRecommendation = await getItem<RecommendationCacheItem>({
      TableName: TableNames.RECOMMENDATION_CACHE,
      Key: {
        account_id: accountId,
        recommendation_type: 'timeline',
      },
    });

    const now = getCurrentTimestamp();

    // キャッシュが存在し、有効期限内なら使用
    if (cachedRecommendation && cachedRecommendation.expires_at > now) {
      const recommendedPostIds = cachedRecommendation.recommended_items.slice(0, validatedLimit);

      // キャッシュから投稿を取得
      const postPromises = recommendedPostIds.map((postId) =>
        getItem<PostItem>({
          TableName: TableNames.POST,
          Key: { postId },
        })
      );

      const posts = (await Promise.all(postPromises)).filter(Boolean) as PostItem[];

      // 投稿者情報を取得
      const accountIds = [...new Set(posts.map((post) => post.accountId))];
      const accountPromises = accountIds.map((id) =>
        getItem<AccountItem>({
          TableName: TableNames.ACCOUNT,
          Key: {
            PK: `ACCOUNT#${id}`,
            SK: 'PROFILE',
          },
        })
      );

      const accounts = await Promise.all(accountPromises);
      const accountMap = new Map<string, AccountItem>();
      accounts.forEach((acc) => {
        if (acc) accountMap.set(acc.account_id, acc);
      });

      // 投稿にアカウント情報を付与
      const postsWithAuthor = posts.map((post, index) => {
        const account = accountMap.get(post.accountId);
        if (!account) return null;

        const accountSummary: AccountSummary = {
          account_id: account.account_id,
          username: account.username,
          handle: account.handle,
          profile_image: account.profile_image,
          account_type: account.account_type,
          is_private: account.is_private,
        };

        // スコアを追加（キャッシュのスコア配列から取得）
        const score = cachedRecommendation.scores?.[index] || 0;

        return {
          ...post,
          author: accountSummary,
          score,
        };
      }).filter((item): item is NonNullable<typeof item> => item !== null);

      return successResponse({
        items: postsWithAuthor,
        nextToken: undefined,
      });
    }

    // 2. キャッシュがない場合: 推薦を計算

    // ユーザーの行動履歴を取得（最近100件）
    const behaviorResult = await query<UserBehaviorItem>({
      TableName: TableNames.USER_BEHAVIOR,
      KeyConditionExpression: 'account_id = :accountId',
      ExpressionAttributeValues: {
        ':accountId': accountId,
      },
      ScanIndexForward: false,
      Limit: 100,
    });

    const behaviors = behaviorResult.items;

    // ユーザープロフィールを構築
    const interestCategories: string[] = [];
    const favoriteHashtags: string[] = [];

    behaviors.forEach((behavior) => {
      // 簡易的な興味カテゴリ・ハッシュタグ抽出
      if (behavior.behavior_type === 'like' && behavior.target_type === 'post') {
        // 実際には投稿からカテゴリ・ハッシュタグを取得する必要がある
        // ここでは簡略化
      }
    });

    // 公開投稿を取得（最新100件）
    const postsResult = await query<PostItem>({
      TableName: TableNames.POST,
      IndexName: 'GSI2',
      KeyConditionExpression: 'visibility = :visibility',
      ExpressionAttributeValues: {
        ':visibility': 'public',
        ':false': false,
      },
      FilterExpression: 'isDeleted = :false',
      ScanIndexForward: false,
      Limit: 100,
    });

    const posts = postsResult.items;

    // 簡易スコアリング（実際はlib/recommendation/engine.tsのロジックを使用）
    const scoredPosts = posts.map((post) => {
      // 新鮮度スコア（最近の投稿ほど高い）
      const hoursElapsed = (now - post.createdAt) / 3600;
      const freshnessScore = Math.exp(-hoursElapsed / 24);

      // 人気度スコア（いいね数が多いほど高い）
      const popularityScore = Math.log10(post.likeCount + 1) / 5;

      // 総合スコア（簡易版）
      const totalScore = freshnessScore * 0.5 + popularityScore * 0.5;

      return {
        post,
        score: totalScore,
      };
    });

    // スコア順にソート
    scoredPosts.sort((a, b) => b.score - a.score);

    // トップN件を取得
    const topPosts = scoredPosts.slice(0, validatedLimit);

    // キャッシュに保存（1時間有効）
    const recommendedPostIds = scoredPosts.map((sp) => sp.post.postId);
    const scores = scoredPosts.map((sp) => sp.score);

    await putItem({
      TableName: TableNames.RECOMMENDATION_CACHE,
      Item: {
        account_id: accountId,
        recommendation_type: 'timeline',
        recommended_items: recommendedPostIds,
        scores,
        updated_at: now,
        expires_at: now + 3600, // 1時間後
      } as RecommendationCacheItem,
    });

    // 投稿者情報を取得
    const accountIds = [...new Set(topPosts.map((sp) => sp.post.accountId))];
    const accountPromises = accountIds.map((id) =>
      getItem<AccountItem>({
        TableName: TableNames.ACCOUNT,
        Key: {
          PK: `ACCOUNT#${id}`,
          SK: 'PROFILE',
        },
      })
    );

    const accounts = await Promise.all(accountPromises);
    const accountMap = new Map<string, AccountItem>();
    accounts.forEach((acc) => {
      if (acc) accountMap.set(acc.account_id, acc);
    });

    // レスポンス作成
    const postsWithAuthor = topPosts.map((sp) => {
      const account = accountMap.get(sp.post.accountId);
      if (!account) return null;

      const accountSummary: AccountSummary = {
        account_id: account.account_id,
        username: account.username,
        handle: account.handle,
        profile_image: account.profile_image,
        account_type: account.account_type,
        is_private: account.is_private,
      };

      return {
        ...sp.post,
        author: accountSummary,
        score: sp.score,
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    return successResponse({
      items: postsWithAuthor,
      nextToken: undefined,
    });
  } catch (error: any) {
    logError(error as Error, { handler: 'getTimelineRecommendations' });

    // AppErrorの場合はそのエラー情報を使用
    if (error.code && error.statusCode) {
      return {
        statusCode: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
        },
        body: JSON.stringify({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        }),
      };
    }

    // 予期しないエラーの場合
    return internalErrorResponse('推薦取得中にエラーが発生しました');
  }
};
