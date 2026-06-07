import type {
  AttributeValue,
  DynamoDbDeleteItemOutput,
  DynamoDbQueryInput,
  DynamoDbQueryOutput,
  DynamoDbScanInput,
  DynamoDbScanOutput,
} from '@/common/types/datasources/dynamodb.type';

/**
 * Interface for low-level DynamoDB datasource operations.
 * Uses explicit AttributeValue marshalling.
 * For operations that need automatic marshalling, use IDynamoDBServiceDatasource instead.
 */
export interface IDynamoDBDatasource {
  deleteItem(
    tableName: string,
    key: Record<string, AttributeValue>,
  ): Promise<DynamoDbDeleteItemOutput>;

  batchDeleteItems(tableName: string, keys: Record<string, AttributeValue>[]): Promise<void>;

  query(input: DynamoDbQueryInput): Promise<DynamoDbQueryOutput>;

  scan(input: DynamoDbScanInput): Promise<DynamoDbScanOutput>;
}
