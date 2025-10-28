/**
 * DynamoDB基本操作ヘルパー関数
 */

import {
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
  UpdateCommand,
  UpdateCommandInput,
  DeleteCommand,
  DeleteCommandInput,
  QueryCommand,
  QueryCommandInput,
  BatchWriteCommand,
  BatchWriteCommandInput,
} from '@aws-sdk/lib-dynamodb';

import { docClient } from './client';
import { NotFoundError } from '../utils/error';
import { getTTLTimestamp } from '../utils/response';

/**
 * アイテム取得
 */
export async function getItem<T>(params: GetCommandInput): Promise<T | null> {
  const command = new GetCommand(params);
  const result = await docClient.send(command);
  return (result.Item as T) || null;
}

/**
 * アイテム取得（必須）- 見つからない場合はエラー
 */
export async function getItemRequired<T>(
  params: GetCommandInput,
  resourceName: string = 'リソース'
): Promise<T> {
  const item = await getItem<T>(params);
  if (!item) {
    throw new NotFoundError(resourceName);
  }
  return item;
}

/**
 * アイテム作成
 */
export async function putItem(params: PutCommandInput): Promise<void> {
  const command = new PutCommand(params);
  await docClient.send(command);
}

/**
 * アイテム更新
 */
export async function updateItem(params: UpdateCommandInput): Promise<any> {
  const command = new UpdateCommand(params);
  const result = await docClient.send(command);
  return result.Attributes;
}

/**
 * アイテム削除（物理削除）
 */
export async function deleteItem(params: DeleteCommandInput): Promise<void> {
  const command = new DeleteCommand(params);
  await docClient.send(command);
}

/**
 * ソフト削除（TTL設定による論理削除）
 */
export async function softDelete(
  tableName: string,
  key: Record<string, any>,
  ttlDays: number
): Promise<void> {
  const ttl = getTTLTimestamp(ttlDays);

  await updateItem({
    TableName: tableName,
    Key: key,
    UpdateExpression: 'SET #ttl = :ttl, #deletedAt = :deletedAt',
    ExpressionAttributeNames: {
      '#ttl': 'ttl',
      '#deletedAt': 'deleted_at',
    },
    ExpressionAttributeValues: {
      ':ttl': ttl,
      ':deletedAt': Date.now(),
    },
  });
}

/**
 * クエリ実行
 */
export async function query<T>(params: QueryCommandInput): Promise<{
  items: T[];
  lastEvaluatedKey?: Record<string, any>;
}> {
  const command = new QueryCommand(params);
  const result = await docClient.send(command);

  return {
    items: (result.Items as T[]) || [],
    lastEvaluatedKey: result.LastEvaluatedKey,
  };
}

/**
 * クエリ実行（全件取得）
 */
export async function queryAll<T>(params: QueryCommandInput): Promise<T[]> {
  const allItems: T[] = [];
  let lastEvaluatedKey: Record<string, any> | undefined;

  do {
    const command = new QueryCommand({
      ...params,
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const result = await docClient.send(command);
    if (result.Items) {
      allItems.push(...(result.Items as T[]));
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return allItems;
}

/**
 * バッチ書き込み（最大25件）
 */
export async function batchWrite(params: BatchWriteCommandInput): Promise<void> {
  const command = new BatchWriteCommand(params);
  const result = await docClient.send(command);

  // 未処理のアイテムがある場合は再試行
  if (result.UnprocessedItems && Object.keys(result.UnprocessedItems).length > 0) {
    await batchWrite({ RequestItems: result.UnprocessedItems });
  }
}

/**
 * カウンターをインクリメント
 */
export async function incrementCounter(
  tableName: string,
  key: Record<string, any>,
  counterField: string,
  incrementBy: number = 1
): Promise<number> {
  const result = await updateItem({
    TableName: tableName,
    Key: key,
    UpdateExpression: `ADD #counter :increment`,
    ExpressionAttributeNames: {
      '#counter': counterField,
    },
    ExpressionAttributeValues: {
      ':increment': incrementBy,
    },
    ReturnValues: 'UPDATED_NEW',
  });

  return result[counterField] as number;
}

/**
 * カウンターをデクリメント
 */
export async function decrementCounter(
  tableName: string,
  key: Record<string, any>,
  counterField: string,
  decrementBy: number = 1
): Promise<number> {
  return incrementCounter(tableName, key, counterField, -decrementBy);
}

/**
 * 条件付きPUT（既存アイテムがない場合のみ作成）
 */
export async function putItemIfNotExists(
  tableName: string,
  item: Record<string, any>,
  keyField: string
): Promise<boolean> {
  try {
    await putItem({
      TableName: tableName,
      Item: item,
      ConditionExpression: `attribute_not_exists(${keyField})`,
    });
    return true;
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      return false;
    }
    throw error;
  }
}

/**
 * アイテムの存在チェック
 */
export async function itemExists(
  tableName: string,
  key: Record<string, any>
): Promise<boolean> {
  const item = await getItem({ TableName: tableName, Key: key });
  return item !== null;
}

/**
 * 複数フィールドを一度に更新
 */
export async function updateFields(
  tableName: string,
  key: Record<string, any>,
  updates: Record<string, any>
): Promise<any> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  Object.entries(updates).forEach(([field, value], index) => {
    const nameKey = `#field${index}`;
    const valueKey = `:value${index}`;

    updateExpressions.push(`${nameKey} = ${valueKey}`);
    expressionAttributeNames[nameKey] = field;
    expressionAttributeValues[valueKey] = value;
  });

  return updateItem({
    TableName: tableName,
    Key: key,
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  });
}
