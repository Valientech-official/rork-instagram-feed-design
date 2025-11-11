/**
 * メディアアップロード用のPresigned URL生成ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  successResponse,
  parseRequestBody,
  unauthorizedResponse,
  internalErrorResponse,
  badRequestResponse,
} from '../../lib/utils/response';
import { validateRequired } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { generateULID } from '../../lib/utils/ulid';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-northeast-1' });
const MEDIA_BUCKET_NAME = process.env.MEDIA_BUCKET_NAME || '';
const PRESIGNED_URL_EXPIRATION = 300; // 5分

interface GetUploadUrlRequest {
  file_type: string; // image/jpeg, image/png, video/mp4など
  file_extension: string; // jpg, png, mp4など
}

interface GetUploadUrlResponse {
  upload_url: string;
  file_key: string;
  file_url: string;
}

/**
 * アップロード用Presigned URL生成Lambda関数
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Cognito Authorizerから account_id (sub) を取得
    const accountId = event.requestContext.authorizer?.claims?.sub;

    if (!accountId) {
      console.error('[getUploadUrl] No account_id found in authorizer claims');
      return unauthorizedResponse('アカウントIDが取得できません');
    }

    // リクエストボディをパース
    const request = parseRequestBody<GetUploadUrlRequest>(event.body);

    // バリデーション
    validateRequired(request.file_type, 'ファイルタイプ');
    validateRequired(request.file_extension, 'ファイル拡張子');

    // サポートされているファイルタイプをチェック
    const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const supportedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-m4v'];
    const allSupportedTypes = [...supportedImageTypes, ...supportedVideoTypes];

    if (!allSupportedTypes.includes(request.file_type.toLowerCase())) {
      return badRequestResponse(`サポートされていないファイルタイプです: ${request.file_type}`);
    }

    // ファイルキーを生成（accountId/ulid.extension）
    const fileId = generateULID();
    const fileKey = `media/${accountId}/${fileId}.${request.file_extension}`;

    // Presigned URL生成
    const command = new PutObjectCommand({
      Bucket: MEDIA_BUCKET_NAME,
      Key: fileKey,
      ContentType: request.file_type,
      // メタデータ
      Metadata: {
        accountId: accountId,
        uploadedAt: new Date().toISOString(),
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRATION,
    });

    // アップロード後にアクセスできるURL
    const fileUrl = `https://${MEDIA_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-northeast-1'}.amazonaws.com/${fileKey}`;

    const response: GetUploadUrlResponse = {
      upload_url: uploadUrl,
      file_key: fileKey,
      file_url: fileUrl,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'getUploadUrl' });

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
    return internalErrorResponse('アップロードURL生成中にエラーが発生しました');
  }
};
