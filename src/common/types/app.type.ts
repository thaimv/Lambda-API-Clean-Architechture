// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TNewable<T> = new (...args: any[]) => T;

export type TLogLevel = 'info' | 'query' | 'warn' | 'error';

export type TLogDefinition = { level: TLogLevel; emit: 'stdout' | 'event' };

/**
 * Use this type to define a class that can be instantiated
 */
export type TProviderMetadata =
  | {
      provide: string | symbol;
      useClass?: TNewable<unknown>;
      useValue?: unknown;
      useFactory?: (...args: unknown[]) => unknown;
    }
  | TNewable<unknown>;

/**
 * @description Authenticated user's payload. It's from Lambda event's identity field.
 * It's passed through controller, use case, and repo layers.
 */
export type TAuthUser = {
  cognitoAuthenticationProvider?: string; // this is cognitoAuthenticationProvider
  cognitoIdentityId?: string; // this is cognitoIdentityId
  userId: string; // Cognito User Pool sub
  username: string;
};

export type TDatabaseConfig = {
  dbUrl: string;
  dbUrlReplica: string;
  proxyEndpoint: string;
  proxyEndpointReplica: string;
  maxRetries: number;
  backOffMs: number;
  connectionLimit: number;
};

export type TDatabaseSecretsConfig = {
  dbClusterIdentifier: string;
  password: string;
  dbname: string;
  engine: string;
  port: string;
  host: string;
  replicaHost?: string;
  username: string;
  schema?: string;
};

export type TPaginator = {
  page: number;
  pageSize: number;
};

export type TPaginationResponse<T> = {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  items: T[];
};

export type TCursorPaginator = {
  orderField?: string;
  orderDirection?: 'asc' | 'desc';
  nextCursor?: string | null;
  prevCursor?: string | null;
  pageSize?: number;
};

export type TCursorPaginationResponse<T> = {
  items: T[];
  orderField?: string;
  orderDirection?: 'asc' | 'desc';
  nextCursor?: string | null;
  prevCursor?: string | null;
  pageSize: number;
};
