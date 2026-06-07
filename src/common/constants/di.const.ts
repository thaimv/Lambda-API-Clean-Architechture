export const DI = {
  // Common Providers
  APP_CONFIG: Symbol.for('AppConfig'),

  // Common Datasources
  ATHENA_DATASOURCE: Symbol.for('AthenaDatasource'),
  CLOUDWATCH_METRICS_DATASOURCE: Symbol.for('CloudWatchMetricsDatasource'),
  MESSAGE_QUEUE_DATASOURCE: Symbol.for('MessageQueueDatasource'),
  PARQUET_FILE_DATASOURCE: Symbol.for('ParquetFileDatasource'),
  EMAIL_DATASOURCE: Symbol.for('EmailDatasource'),
  TRANSLATE_DATASOURCE: Symbol.for('TranslateDatasource'),
  COGNITO_IDENTITY_DATASOURCE: Symbol.for('CognitoIdentityDatasource'),
  STEP_FUNCTION_DATASOURCE: Symbol.for('StepFunctionDatasource'),
  GRAPHQL_DATASOURCE: Symbol.for('GraphQLDatasource'),
  SECRETS_MANAGER_DATASOURCE: Symbol.for('SecretsManagerDatasource'),
  OBJECT_STORAGE_DATASOURCE: Symbol.for('ObjectStorageDatasource'),
  OBJECT_STORAGE_CONNECTOR_DATASOURCE: Symbol.for('ObjectStorageConnectorDatasource'),
  OBJECT_STORAGE_UPLOAD_DATASOURCE: Symbol.for('ObjectStorageUploadDatasource'),
  LAMBDA_DATASOURCE: Symbol.for('LambdaDatasource'),
  DB_CLIENT_DATASOURCE: Symbol.for('IDBClientDatasource'),
  TRANSACTION_RUNNER_DATASOURCE: Symbol.for('ITransactionRunnerDatasource'),
  DYNAMODB_CLIENT_DATASOURCE: Symbol.for('DynamoDBClientDatasource'),
  DYNAMODB_RAW_CLIENT_DATASOURCE: Symbol.for('DynamoDBRawClientDatasource'),
  DYNAMODB_DATASOURCE: Symbol.for('DynamoDBDatasource'),
  DYNAMODB_SERVICE_DATASOURCE: Symbol.for('DynamoDBServiceDatasource'),
  CACHE_DATASOURCE: Symbol.for('CacheDatasource'),
  API_GATEWAY_DATASOURCE: Symbol.for('ApiGatewayDatasource'),
  PUSH_NOTIFICATION_DATASOURCE: Symbol.for('PushNotificationDatasource'),

  // Common Repositories
  COMMON_USER_REPO: Symbol.for('CommonUserRepo'),
};
