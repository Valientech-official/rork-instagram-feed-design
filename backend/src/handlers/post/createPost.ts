/**
 * 投稿作成ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { CreatePostRequest, CreatePostResponse } from '../../types/api';
import { PostItem, AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
} from '../../lib/utils/response';
import {
  validateRequired,
  validatePostContent,
  validatePostType,
  validatePostVisibility,
  validateHashtags,
  validateMediaUrls,
} from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { generateULID } from '../../lib/utils/ulid';
import { TableNames, putItem, getItemRequired, incrementCounter, batchWrite } from '../../lib/dynamodb';

/**
 * 投稿作成Lambda関数
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

    // リクエストボディをパース
    const request = parseRequestBody<CreatePostRequest>(event.body);

    // バリデーション
    validateRequired(request.content, '投稿内容');
    validateRequired(request.visibility, '公開範囲');
    validateRequired(request.post_type, '投稿タイプ');

    validatePostContent(request.content);
    validatePostVisibility(request.visibility);
    validatePostType(request.post_type);

    if (request.hashtags && request.hashtags.length > 0) {
      validateHashtags(request.hashtags);
    }

    if (request.media_urls && request.media_urls.length > 0) {
      validateMediaUrls(request.media_urls);
    }

    // アカウントが存在するか確認
    await getItemRequired<AccountItem>(
      {
        TableName: TableNames.ACCOUNT,
        Key: {
          PK: `ACCOUNT#${accountId}`,
          SK: 'PROFILE',
        },
      },
      'アカウント'
    );

    // 投稿IDを生成
    const postId = generateULID();
    const now = getCurrentTimestamp();

    // ハッシュタグをSetに変換（重複除去）
    const hashtagSet = request.hashtags
      ? new Set(request.hashtags.map((tag) => tag.startsWith('#') ? tag.slice(1) : tag))
      : undefined;

    // 投稿アイテムを作成
    const postItem: PostItem = {
      postId,
      accountId,
      createdAt: now,
      isEdited: false,
      editCount: 0,
      content: request.content,
      mediaUrls: request.media_urls,
      mediaType: request.media_type,
      visibility: request.visibility,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      repostCount: 0,
      hashtags: hashtagSet,
      isDeleted: false,
      room_id: request.room_id,
      post_type: request.post_type,
      wave_video_url: request.wave_video_url,
      wave_duration: request.wave_duration,
      allow_repost: true,
      allow_wave_duet: request.post_type === 'wave',
    };

    // バッチ書き込み用のリクエストを準備
    const batchRequests: any[] = [
      {
        PutRequest: {
          Item: postItem,
        },
      },
    ];

    // ハッシュタグインデックスとカウント更新
    if (hashtagSet && hashtagSet.size > 0) {
      for (const hashtag of hashtagSet) {
        // HASHTAG_INDEX に追加
        batchRequests.push({
          PutRequest: {
            Item: {
              hashtag,
              postId,
              accountId,
              createdAt: now,
              visibility: request.visibility,
            },
          },
        });
      }
    }

    // DynamoDBに保存
    await putItem({
      TableName: TableNames.POST,
      Item: postItem,
    });

    // ハッシュタグインデックスを保存（最大25件ずつ）
    if (batchRequests.length > 1) {
      const hashtagIndexRequests = batchRequests.slice(1);
      const chunks: any[][] = [];

      for (let i = 0; i < hashtagIndexRequests.length; i += 25) {
        chunks.push(hashtagIndexRequests.slice(i, i + 25));
      }

      for (const chunk of chunks) {
        await batchWrite({
          RequestItems: {
            [TableNames.HASHTAG_INDEX]: chunk,
          },
        });
      }
    }

    // ハッシュタグカウント更新（非同期、エラーは無視）
    if (hashtagSet && hashtagSet.size > 0) {
      const countPromises = Array.from(hashtagSet).map((hashtag) =>
        incrementCounter(
          TableNames.HASHTAG_COUNT,
          { hashtag, period: 'all_time' },
          'count',
          1
        ).catch((err) => {
          console.warn(`Failed to increment hashtag count for ${hashtag}:`, err);
        })
      );

      Promise.all(countPromises).catch(() => {
        // カウント更新失敗は致命的ではない
      });
    }

    // アカウントの投稿数をインクリメント（非同期）
    incrementCounter(
      TableNames.ACCOUNT,
      {
        PK: `ACCOUNT#${accountId}`,
        SK: 'PROFILE',
      },
      'post_count',
      1
    ).catch((err) => {
      console.warn('Failed to increment post_count:', err);
    });

    // レスポンス
    const response: CreatePostResponse = {
      post_id: postId,
      created_at: now,
    };

    return successResponse(response, 201);
  } catch (error: any) {
    logError(error as Error, { handler: 'createPost' });

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
    return internalErrorResponse('投稿作成中にエラーが発生しました');
  }
};
