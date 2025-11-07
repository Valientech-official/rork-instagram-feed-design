/**
 * 商品作成ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { ProductItem, AccountItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '../../lib/utils/response';
import { validateRequired } from '../../lib/validators';
import { logError } from '../../lib/utils/error';
import { generateULID } from '../../lib/utils/ulid';
import { TableNames, putItem, getItem } from '../../lib/dynamodb';

interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  sale_price?: number;
  currency: string;
  image_urls: string[];
  primary_image_url: string;
  external_url: string;
  external_shop_name?: string;
  category: 'fashion' | 'beauty' | 'food' | 'other';
  tags?: string[];
}

interface CreateProductResponse {
  product_id: string;
  created_at: number;
}

/**
 * S3バケットURLのみ許可
 */
function validateImageUrl(url: string): boolean {
  const pattern = /^https:\/\/[\w-]+\.s3\.[\w-]+\.amazonaws\.com\/.+\.(jpg|jpeg|png|webp)$/i;
  return pattern.test(url);
}

/**
 * 商品作成Lambda関数
 *
 * ショップアカウントのみが商品を作成可能
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
    const request = parseRequestBody<CreateProductRequest>(event.body);

    // バリデーション
    validateRequired(request.name, '商品名');
    validateRequired(request.price, '価格');
    validateRequired(request.currency, '通貨');
    validateRequired(request.image_urls, '商品画像');
    validateRequired(request.primary_image_url, 'メイン画像');
    validateRequired(request.external_url, '外部リンク');
    validateRequired(request.category, 'カテゴリ');

    // 商品名の長さ
    if (request.name.length < 1 || request.name.length > 100) {
      return validationErrorResponse('商品名は1-100文字で入力してください');
    }

    // 説明文の長さ
    if (request.description && request.description.length > 500) {
      return validationErrorResponse('説明文は500文字以内で入力してください');
    }

    // 価格のバリデーション
    if (request.price <= 0) {
      return validationErrorResponse('価格は0より大きい値を入力してください');
    }

    // セール価格のバリデーション
    if (request.sale_price !== undefined) {
      if (request.sale_price <= 0) {
        return validationErrorResponse('セール価格は0より大きい値を入力してください');
      }
      if (request.sale_price >= request.price) {
        return validationErrorResponse('セール価格は通常価格より安く設定してください');
      }
    }

    // 通貨のバリデーション
    if (!['JPY', 'USD'].includes(request.currency)) {
      return validationErrorResponse('通貨はJPYまたはUSDを指定してください');
    }

    // 画像URLのバリデーション
    if (request.image_urls.length < 1 || request.image_urls.length > 10) {
      return validationErrorResponse('商品画像は1-10枚で指定してください');
    }

    for (const url of request.image_urls) {
      if (!validateImageUrl(url)) {
        return validationErrorResponse('商品画像はS3バケットのURLを指定してください');
      }
    }

    if (!validateImageUrl(request.primary_image_url)) {
      return validationErrorResponse('メイン画像はS3バケットのURLを指定してください');
    }

    if (!request.image_urls.includes(request.primary_image_url)) {
      return validationErrorResponse('メイン画像は商品画像に含まれている必要があります');
    }

    // 外部URLのバリデーション（"DM"または有効なURL）
    if (request.external_url !== 'DM') {
      try {
        new URL(request.external_url);
      } catch {
        return validationErrorResponse('外部リンクは有効なURLまたは"DM"を指定してください');
      }
    }

    // カテゴリのバリデーション
    const validCategories = ['fashion', 'beauty', 'food', 'other'];
    if (!validCategories.includes(request.category)) {
      return validationErrorResponse('カテゴリはfashion/beauty/food/otherのいずれかを指定してください');
    }

    // タグのバリデーション
    if (request.tags) {
      if (request.tags.length > 10) {
        return validationErrorResponse('タグは10個まで指定できます');
      }
      for (const tag of request.tags) {
        if (tag.length < 1 || tag.length > 30) {
          return validationErrorResponse('タグは1-30文字で入力してください');
        }
      }
    }

    // アカウントが存在し、shopタイプであることを確認
    const account = await getItem<AccountItem>({
      TableName: TableNames.ACCOUNT,
      Key: {
        PK: `ACCOUNT#${accountId}`,
        SK: 'PROFILE',
      },
    });

    if (!account) {
      return unauthorizedResponse('アカウントが見つかりません');
    }

    if (account.account_type !== 'shop') {
      return unauthorizedResponse('商品を作成できるのはショップアカウントのみです');
    }

    // 商品IDを生成
    const productId = generateULID();
    const now = getCurrentTimestamp();

    // 商品アイテムを作成
    const productItem: ProductItem = {
      product_id: productId,
      created_at: now,
      seller_account_id: accountId,
      name: request.name,
      description: request.description,
      price: request.price,
      sale_price: request.sale_price,
      currency: request.currency,
      image_urls: request.image_urls,
      primary_image_url: request.primary_image_url,
      external_url: request.external_url,
      external_shop_name: request.external_shop_name,
      category: request.category,
      tags: request.tags,
      status: 'active',
      view_count: 0,
      click_count: 0,
      tag_count: 0,
      updated_at: now,
      is_deleted: false,
    };

    // DynamoDBに保存
    await putItem({
      TableName: TableNames.PRODUCT,
      Item: productItem,
    });

    // レスポンス
    const response: CreateProductResponse = {
      product_id: productId,
      created_at: now,
    };

    return successResponse(response, 201);
  } catch (error: any) {
    logError(error as Error, { handler: 'createProduct' });

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
    return internalErrorResponse('商品作成中にエラーが発生しました');
  }
};
