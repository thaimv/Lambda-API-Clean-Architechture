import type { DynamoDbDocumentClient } from '@/common/types/datasources/dynamodb.type';

/**
 * Interface for a provider that returns a DynamoDB Document Client instance.
 * Uses the high-level DocumentClient which handles marshalling/unmarshalling automatically.
 */
export interface IDynamoDBClientDatasource {
  getClient(): DynamoDbDocumentClient;
}

/** @deprecated Use IDynamoDBClientDatasource */
export interface IDynamoDBClient<T = DynamoDbDocumentClient> {
  getClient(): T;
}
