import type { TDynamoTableSchema } from '@/common/types/dynamodb.type';
import { getEnv } from '@/common/utils/env.util';

const DEFAULT_DYNAMODB_BATCH_WRITE_ITEM_SIZE = 25;
const dynamodbBatchWriteItemSizeEnvValue = Number(process.env.DYNAMODB_BATCH_WRITE_ITEM_SIZE);
const DEFAULT_DYNAMODB_BATCH_DELETE_MAX_RETRIES = 5;
const dynamodbBatchDeleteMaxRetriesEnvValue = Number(process.env.DYNAMODB_BATCH_DELETE_MAX_RETRIES);
const DEFAULT_DYNAMODB_BATCH_DELETE_RETRY_DELAY_MS = 100;
const dynamodbBatchDeleteRetryDelayMsEnvValue = Number(
  process.env.DYNAMODB_BATCH_DELETE_RETRY_DELAY_MS,
);

export const DYNAMODB_BATCH_WRITE_ITEM_SIZE =
  Number.isInteger(dynamodbBatchWriteItemSizeEnvValue) && dynamodbBatchWriteItemSizeEnvValue > 0
    ? Math.min(dynamodbBatchWriteItemSizeEnvValue, DEFAULT_DYNAMODB_BATCH_WRITE_ITEM_SIZE)
    : DEFAULT_DYNAMODB_BATCH_WRITE_ITEM_SIZE;

export const DYNAMODB_BATCH_DELETE_MAX_RETRIES =
  Number.isInteger(dynamodbBatchDeleteMaxRetriesEnvValue) &&
  dynamodbBatchDeleteMaxRetriesEnvValue >= 0
    ? dynamodbBatchDeleteMaxRetriesEnvValue
    : DEFAULT_DYNAMODB_BATCH_DELETE_MAX_RETRIES;

export const DYNAMODB_BATCH_DELETE_RETRY_DELAY_MS =
  Number.isInteger(dynamodbBatchDeleteRetryDelayMsEnvValue) &&
  dynamodbBatchDeleteRetryDelayMsEnvValue >= 0
    ? dynamodbBatchDeleteRetryDelayMsEnvValue
    : DEFAULT_DYNAMODB_BATCH_DELETE_RETRY_DELAY_MS;

export const USER_NOTIFICATION_DYNAMO_TABLE: TDynamoTableSchema = {
  name: getEnv('DYNAMODB_USER_NOTIFICATION_TABLE')!,
  primaryKey: {
    partitionKey: 'gigyaUuid',
    sortKey: 'notificationSortKey',
  },
  globalIndexes: {
    notificationTableLSI1: {
      name: getEnv('DYNAMODB_USER_NOTIFICATION_TABLE_LSI1'),
      partitionKey: 'gigyaUuid',
      sortKey: 'deliveryStartDatetime',
    },
    notificationTableLSI2: {
      name: getEnv('DYNAMODB_USER_NOTIFICATION_TABLE_LSI2'),
      partitionKey: 'gigyaUuid',
      sortKey: 'deliveryEndDatetime',
    },
  },
};
