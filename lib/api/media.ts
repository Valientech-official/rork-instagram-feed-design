/**
 * Media API クライアント
 * 画像/動画のアップロード処理
 */

import apiClient from './client';
import { ApiResponse } from '@/types/api';

interface GetUploadUrlRequest {
  file_type: string; // 'image/jpeg', 'image/png', 'video/mp4'など
  file_extension: string; // 'jpg', 'png', 'mp4'など
}

interface GetUploadUrlResponse {
  upload_url: string; // Presigned URL
  file_key: string; // S3のファイルキー
  file_url: string; // アップロード後のHTTPS URL
}

/**
 * S3へのアップロード用のPresigned URLを取得
 */
export const getUploadUrl = async (
  request: GetUploadUrlRequest
): Promise<ApiResponse<GetUploadUrlResponse>> => {
  return apiClient.post<GetUploadUrlResponse>('/media/upload-url', request);
};

/**
 * ファイルをS3にアップロード
 * @param uri - ローカルファイルのURI
 * @param fileType - MIMEタイプ
 * @returns アップロード後のHTTPS URL
 */
export const uploadFile = async (
  uri: string,
  fileType: string
): Promise<string> => {
  try {
    // ファイル拡張子を取得
    const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';

    // Presigned URLを取得
    const uploadUrlResponse = await getUploadUrl({
      file_type: fileType,
      file_extension: extension,
    });

    if (!uploadUrlResponse.success || !uploadUrlResponse.data) {
      throw new Error(uploadUrlResponse.error?.message || 'アップロードURL取得に失敗しました');
    }

    const { upload_url, file_url } = uploadUrlResponse.data;

    // ローカルファイルを読み込み
    const response = await fetch(uri);
    const blob = await response.blob();

    // S3にアップロード
    const uploadResponse = await fetch(upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': fileType,
      },
      body: blob,
    });

    if (!uploadResponse.ok) {
      throw new Error(`S3アップロードに失敗しました: ${uploadResponse.statusText}`);
    }

    return file_url;
  } catch (error) {
    console.error('[uploadFile] Error:', error);
    throw error;
  }
};

/**
 * 複数ファイルをS3にアップロード
 * @param files - ファイル情報の配列 [{uri, fileType}]
 * @returns アップロード後のHTTPS URLの配列
 */
export const uploadFiles = async (
  files: Array<{ uri: string; fileType: string }>
): Promise<string[]> => {
  const uploadPromises = files.map((file) => uploadFile(file.uri, file.fileType));
  return Promise.all(uploadPromises);
};

export const mediaApi = {
  getUploadUrl,
  uploadFile,
  uploadFiles,
};

export default mediaApi;
