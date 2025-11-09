/**
 * 商品更新ハンドラー
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { ProductItem } from '../../types/dynamodb';
import {
  successResponse,
  parseRequestBody,
  getCurrentTimestamp,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
} from '../../lib/utils/response';
import { logError } from '../../lib/utils/error';
import { TableNames, getItem, updateItem } from '../../lib/dynamodb';

interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  sale_price?: number;
  currency?: string;
  image_urls?: string[];
  primary_image_url?: string;
  external_url?: string;
  external_shop_name?: string;
  category?: 'fashion' | 'beauty' | 'food' | 'other';
  tags?: string[];
  status?: 'active' | 'inactive';
}

interface UpdateProductResponse {
  product_id: string;
  updated_at: number;
}

/**
 * S3バケットURLのみ許可
 */
function validateImageUrl(url: string): boolean {
  const pattern = /^https:\/\/[\w-]+\.s3\.[\w-]+\.amazonaws\.com\/.+\.(jpg|jpeg|png|webp)$/i;
  return pattern.test(url);
}

/**
 * 商品更新Lambda関数
 *
 * 商品所有者のみが商品情報を更新可能
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

    // パスパラメータから商品IDを取得
    const productId = event.pathParameters?.product_id;

    if (!productId) {
      return notFoundResponse('商品ID');
    }

    // リクエストボディをパース
    const request = parseRequestBody<UpdateProductRequest>(event.body);

    // 少なくとも1つの更新フィールドが必要
    if (
      !request.name &&
      !request.description &&
      request.price === undefined &&
      request.sale_price === undefined &&
      !request.currency &&
      !request.image_urls &&
      !request.primary_image_url &&
      !request.external_url &&
      !request.external_shop_name &&
      !request.category &&
      !request.tags &&
      !request.status
    ) {
      return validationErrorResponse('更新する項目を指定してください');
    }

    // 商品が存在するか確認
    const existingProduct = await getItem<ProductItem>({
      TableName: TableNames.PRODUCT,
      Key: {
        product_id: productId,
      },
    });

    if (!existingProduct) {
      return notFoundResponse('商品');
    }

    // 削除された商品は更新できない
    if (existingProduct.is_deleted) {
      return validationErrorResponse('削除された商品は更新できません');
    }

    // 商品の所有者のみ更新可能
    if (existingProduct.seller_account_id !== accountId) {
      return unauthorizedResponse('この商品を更新する権限がありません');
    }

    // バリデーション
    if (request.name !== undefined) {
      if (request.name.length < 1 || request.name.length > 100) {
        return validationErrorResponse('商品名は1-100文字で入力してください');
      }
    }

    if (request.description !== undefined && request.description.length > 500) {
      return validationErrorResponse('説明文は500文字以内で入力してください');
    }

    if (request.price !== undefined && request.price <= 0) {
      return validationErrorResponse('価格は0より大きい値を入力してください');
    }

    if (request.sale_price !== undefined) {
      if (request.sale_price <= 0) {
        return validationErrorResponse('セール価格は0より大きい値を入力してください');
      }
      const finalPrice = request.price || existingProduct.price;
      if (request.sale_price >= finalPrice) {
        return validationErrorResponse('セール価格は通常価格より安く設定してください');
      }
    }

    if (request.currency !== undefined && !['JPY', 'USD'].includes(request.currency)) {
      return validationErrorResponse('通貨はJPYまたはUSDを指定してください');
    }

    if (request.image_urls !== undefined) {
      if (request.image_urls.length < 1 || request.image_urls.length > 10) {
        return validationErrorResponse('商品画像は1-10枚で指定してください');
      }
      for (const url of request.image_urls) {
        if (!validateImageUrl(url)) {
          return validationErrorResponse('商品画像はS3バケットのURLを指定してください');
        }
      }
    }

    if (request.primary_image_url !== undefined) {
      if (!validateImageUrl(request.primary_image_url)) {
        return validationErrorResponse('メイン画像はS3バケットのURLを指定してください');
      }
      const finalImageUrls = request.image_urls || existingProduct.image_urls;
      if (!finalImageUrls.includes(request.primary_image_url)) {
        return validationErrorResponse('メイン画像は商品画像に含まれている必要があります');
      }
    }

    if (request.external_url !== undefined && request.external_url !== 'DM') {
      try {
        new URL(request.external_url);
      } catch {
        return validationErrorResponse('外部リンクは有効なURLまたは"DM"を指定してください');
      }
    }

    if (request.category !== undefined) {
      const validCategories = ['fashion', 'beauty', 'food', 'other'];
      if (!validCategories.includes(request.category)) {
        return validationErrorResponse('カテゴリはfashion/beauty/food/otherのいずれかを指定してください');
      }
    }

    if (request.tags !== undefined) {
      if (request.tags.length > 10) {
        return validationErrorResponse('タグは10個まで指定できます');
      }
      for (const tag of request.tags) {
        if (tag.length < 1 || tag.length > 30) {
          return validationErrorResponse('タグは1-30文字で入力してください');
        }
      }
    }

    if (request.status !== undefined) {
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(request.status)) {
        return validationErrorResponse('ステータスはactiveまたはinactiveを指定してください');
      }
    }

    // 更新用の属性を準備
    const now = getCurrentTimestamp();
    const updateExpressionParts: string[] = ['updated_at = :updatedAt'];
    const expressionAttributeValues: any = {
      ':updatedAt': now,
    };

    if (request.name !== undefined) {
      updateExpressionParts.push('#name = :name');
      expressionAttributeValues[':name'] = request.name;
    }

    if (request.description !== undefined) {
      updateExpressionParts.push('description = :description');
      expressionAttributeValues[':description'] = request.description;
    }

    if (request.price !== undefined) {
      updateExpressionParts.push('price = :price');
      expressionAttributeValues[':price'] = request.price;
    }

    if (request.sale_price !== undefined) {
      updateExpressionParts.push('sale_price = :salePrice');
      expressionAttributeValues[':salePrice'] = request.sale_price;
    }

    if (request.currency !== undefined) {
      updateExpressionParts.push('currency = :currency');
      expressionAttributeValues[':currency'] = request.currency;
    }

    if (request.image_urls !== undefined) {
      updateExpressionParts.push('image_urls = :imageUrls');
      expressionAttributeValues[':imageUrls'] = request.image_urls;
    }

    if (request.primary_image_url !== undefined) {
      updateExpressionParts.push('primary_image_url = :primaryImageUrl');
      expressionAttributeValues[':primaryImageUrl'] = request.primary_image_url;
    }

    if (request.external_url !== undefined) {
      updateExpressionParts.push('external_url = :externalUrl');
      expressionAttributeValues[':externalUrl'] = request.external_url;
    }

    if (request.external_shop_name !== undefined) {
      updateExpressionParts.push('external_shop_name = :externalShopName');
      expressionAttributeValues[':externalShopName'] = request.external_shop_name;
    }

    if (request.category !== undefined) {
      updateExpressionParts.push('category = :category');
      expressionAttributeValues[':category'] = request.category;
    }

    if (request.tags !== undefined) {
      updateExpressionParts.push('tags = :tags');
      expressionAttributeValues[':tags'] = request.tags;
    }

    if (request.status !== undefined) {
      updateExpressionParts.push('#status = :status');
      expressionAttributeValues[':status'] = request.status;
    }

    // 商品を更新
    await updateItem({
      TableName: TableNames.PRODUCT,
      Key: {
        product_id: productId,
      },
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeNames: {
        '#name': 'name',
        '#status': 'status',
      },
      ExpressionAttributeValues: expressionAttributeValues,
    });

    // レスポンス
    const response: UpdateProductResponse = {
      product_id: productId,
      updated_at: now,
    };

    return successResponse(response);
  } catch (error: any) {
    logError(error as Error, { handler: 'updateProduct' });

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
    return internalErrorResponse('商品更新中にエラーが発生しました');
  }
};
