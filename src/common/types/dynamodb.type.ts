/**
 * Type definition for a DynamoDB table schema.
 */
export type TDynamoTableSchema = {
  name: string;
  primaryKey: {
    partitionKey: string;
    sortKey?: string;
  };
  globalIndexes?: {
    [key: string]: {
      name: string;
      partitionKey: string;
      sortKey?: string;
    };
  };
};
