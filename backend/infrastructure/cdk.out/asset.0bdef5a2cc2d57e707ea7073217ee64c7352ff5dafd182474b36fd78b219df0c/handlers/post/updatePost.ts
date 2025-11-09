/**
 * 投稿更新ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { PostItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
} from '../../lib/utils/response';
import {
  validatePostContent,
  validatePostVisibility,
  validateHashtags,
  validateMediaUrls,
} from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { TableNames, getItem, updateItem, batchWrite } from '../../lib/dynamodb';

interface UpdatePostRequest {
  content?: string;
  media_urls?: string[];
  media_type?: 'image' | 'video' | 'mixed';
  hashtags?: string[];
  visibility?: 'public' | 'followers' | 'room' | 'private';
  allow_repost?: boolean;
  allow_wave_duet?: boolean;
}

interface UpdatePostResponse {
  post_id: string;
  updated_at: number;
  is_edited: boolean;
  edit_count: number;
}

/**
 * 投稿更新Lambda関数
 *
 * 既存の投稿の内容を更新
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

    // パスパラメータから投稿IDを取得
    const postId = event.pathParameters?.post_id;

    if (!postId) {
      return notFoundResponse('投稿ID');
    }

    // リクエストボディをパース
    const request = parseRequestBody<UpdatePostRequest>(event.body);

    // 少なくとも1つの更新フィールドが必要
    if (
      !request.content &&
      !request.media_urls &&
      !request.hashtags &&
      !request.visibility &&
      request.allow_repost === undefined &&
      request.allow_wave_duet === undefined
    ) {
      return validationErrorResponse('更新する項目を指定してください');
    }

    // バリデーション
    if (request.content !== undefined) {
      validatePostContent(request.content);
    }

    if (request.visibility !== undefined) {
      validatePostVisibility(request.visibility);
    }

    if (request.hashtags !== undefined && request.hashtags.length > 0) {
      validateHashtags(request.hashtags);
    }

    if (request.media_urls !== undefined && request.media_urls.length > 0) {
      validateMediaUrls(request.media_urls);
    }

    // 投稿が存在するか確認し、所有者を検証
    const existingPost = await getItem<PostItem>({
      TableName: TableNames.POST,
      Key: {
        postId: postId,
      },
    });

    if (!existingPost) {
      return notFoundResponse('投稿');
    }

    if (existingPost.accountId !== accountId) {
      return unauthorizedResponse('この投稿を編集する権限がありません');
    }

    if (existingPost.isDeleted) {
      return validationErrorResponse('削除された投稿は編集できません');
    }

    // 更新用の属性を準備
    const now = getCurrentTimestamp();
    const updateExpressionParts: string[] = ['updatedAt = :updatedAt', 'isEdited = :isEdited', 'editCount = editCount + :one'];
    const expressionAttributeValues: any = {
      ':updatedAt': now,
      ':isEdited': true,
      ':one': 1,
    };

    if (request.content !== undefined) {
      updateExpressionParts.push('content = :content');
      expressionAttributeValues[':content'] = request.content;
    }

    if (request.media_urls !== undefined) {
      updateExpressionParts.push('mediaUrls = :mediaUrls');
      expressionAttributeValues[':mediaUrls'] = request.media_urls;
    }

    if (request.media_type !== undefined) {
      updateExpressionParts.push('mediaType = :mediaType');
      expressionAttributeValues[':mediaType'] = request.media_type;
    }

    if (request.visibility !== undefined) {
      updateExpressionParts.push('visibility = :visibility');
      expressionAttributeValues[':visibility'] = request.visibility;
    }

    if (request.allow_repost !== undefined) {
      updateExpressionParts.push('allow_repost = :allowRepost');
      expressionAttributeValues[':allowRepost'] = request.allow_repost;
    }

    if (request.allow_wave_duet !== undefined) {
      updateExpressionParts.push('allow_wave_duet = :allowWaveDuet');
      expressionAttributeValues[':allowWaveDuet'] = request.allow_wave_duet;
    }

    // ハッシュタグの更新処理
    if (request.hashtags !== undefined) {
      const newHashtagSet = new Set(request.hashtags.map((tag) => tag.startsWith('#') ? tag.slice(1) : tag));
      updateExpressionParts.push('hashtags = :hashtags');
      expressionAttributeValues[':hashtags'] = newHashtagSet;

      // 古いハッシュタグインデックスを削除
      if (existingPost.hashtags && existingPost.hashtags.size > 0) {
        const oldHashtags = Array.from(existingPost.hashtags);
        const deleteRequests = oldHashtags.map((hashtag) => ({
          DeleteRequest: {
            Key: {
              hashtag,
              postId,
            },
          },
        }));

        // 最大25件ずつ削除
        const deleteChunks: any[][] = [];
        for (let i = 0; i < deleteRequests.length; i += 25) {
          deleteChunks.push(deleteRequests.slice(i, i + 25));
        }

        for (const chunk of deleteChunks) {
          await batchWrite({
            RequestItems: {
              [TableNames.HASHTAG_INDEX]: chunk,
            },
          });
        }
      }

      // 新しいハッシュタグインデックスを追加
      if (newHashtagSet.size > 0) {
        const putRequests = Array.from(newHashtagSet).map((hashtag) => ({
          PutRequest: {
            Item: {
              hashtag,
              postId,
              accountId,
              createdAt: existingPost.createdAt, // 投稿の作成時刻を維持
              visibility: request.visibility || existingPost.visibility,
            },
          },
        }));

        // 最大25件ずつ追加
        const putChunks: any[][] = [];
        for (let i = 0; i < putRequests.length; i += 25) {
          putChunks.push(putRequests.slice(i, i + 25));
        }

        for (const chunk of putChunks) {
          await batchWrite({
            RequestItems: {
              [TableNames.HASHTAG_INDEX]: chunk,
            },
          });
        }
      }
    }

    // 投稿を更新
    const result = await updateItem({
      TableName: TableNames.POST,
      Key: {
        postId: postId,
      },
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    // レスポンス
    const response: UpdatePostResponse = {
      post_id: postId,
      updated_at: now,
      is_edited: true,
      edit_count: result.Attributes?.editCount || 1,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'updatePost' });

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
    return internalErrorResponse('投稿更新中にエラーが発生しました');
  }
};
