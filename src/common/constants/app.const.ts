import { getEnv } from '@/common/utils/env.util';

export const APP_CONST = {
  NODE_ENV: getEnv('NODE_ENV', 'local'),
  LOGGER: {
    LOG_LEVEL: getEnv('LOG_LEVEL', 'INFO'),
    LOG_LEVEL_PRIMARY: 'TRACE',
  },

  SERVICE_NAME: 'LambdaAPI',

  COOKIE: {
    ACCESS_TOKEN_NAME: 'project_access_token',
  },

  ENVIRONMENTS: {
    LOCAL: 'local',
    DEV: 'dev',
    STAGING: 'stg',
    PROD: 'prd',
    TEST: 'test',
  },

  PAGE_SIZE: 20,
};

export const DATE_FORMAT = {
  YYYYMMDDHHmmssSSS: 'YYYYMMDDHHmmssSSS',
  YYYY_MM_DDTHH_mmssZ: 'YYYY-MM-DDTHH:mm:ss[Z]',
  YYYY_MM_DD: 'YYYY-MM-DD',
  YYYYMMDD: 'YYYYMMDD',
  YYYY_MM_DD_SLASH: 'YYYY/MM/DD',
  YYYYMM: 'YYYYMM',
  YYYY: 'YYYY',
  MM: 'MM',
  DD: 'DD',
  HH: 'HH',
};

export const MINE_TYPES = {
  IMAGE_WEBP: 'image/webp',
  APPLICATION_ZIP: 'application/zip',
};

// base64 truncation
export const BASE64_TRUNCATION_LENGTH = 50;

// Regex patterns
export const REGEX_AWS_DATE = /^\d{4}-\d{2}-\d{2}$/;
export const REGEX_HTTPS = /^https:\/\/.+/i;

export const REGEX = {
  TIMEZONE_OFFSET: /^[+-](0[0-9]|1[0-4]):[0-5][0-9]$/,
  ISO8601_TIMEZONE: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
  S3_URI: /^s3:\/\/([^/]+)\/(.+)$/,
};

// Timezone regex patterns
export const TIMEZONE_REGEX = {
  // Matches timezone offset like +09:00, -05:00 or Z at the end of timestamp
  TIMEZONE_OFFSET: /([+-]\d{2}:\d{2})|Z$/,
  // Matches timezone offset components (sign, hours, minutes)
  OFFSET_COMPONENTS: /([+-])(\d{2}):(\d{2})/,
} as const;

// Prisma transaction timeout configuration
export const PRISMA_TRANSACTION_CONFIG = {
  MAX_WAIT: parseInt(process.env.TRANSACTION_MAX_WAIT || '10000'), // Default: 10s
  TIMEOUT: parseInt(process.env.TRANSACTION_TIMEOUT || '30000'), // Default: 30s
};

/**
 * Sensitive data field names to be masked or hashed in logs
 */
export const SENSITIVE_FIELDS: { hash: string[]; mask: string[] } = {
  /** Fields that should be hashed using SHA-256 */
  hash: [
    // User identifiers
    'cognito_sub',
    'create_author',
    'update_author',
  ],
  /** Fields that should be fully masked */
  mask: [],
};

export const CONTAINING_SENSITIVE_FIELDS: string[] = [
  'file_path',
  'cognito_identity_auth_provider',
  'source_key',
  'dest_key',
  'api_name',
  'proxy',
  'url',
  'response',
  'message',
  'error',
];
