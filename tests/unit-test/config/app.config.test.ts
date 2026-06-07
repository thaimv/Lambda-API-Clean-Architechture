import 'reflect-metadata';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { AppConfig } from '@/config/app.config';

describe('AppConfig', () => {
  let config: AppConfig;

  beforeEach(() => {
    config = new AppConfig();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('nodeEnv', () => {
    test('should return test', () => {
      vi.stubEnv('NODE_ENV', 'test');
      expect(config.nodeEnv).toBe('test');
    });

    test('should return default if NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      expect(config.nodeEnv).toBe('local');
    });
  });

  describe('isProduction', () => {
    test('should return true if NODE_ENV is production', () => {
      vi.stubEnv('NODE_ENV', 'prd');
      expect(config.isProduction).toBe(true);
    });
  });

  describe('isDevelopment', () => {
    test('should return true if NODE_ENV is development', () => {
      vi.stubEnv('NODE_ENV', 'dev');
      expect(config.isDevelopment).toBe(true);
    });
  });

  describe('isTest', () => {
    test('should return true if NODE_ENV is test', () => {
      vi.stubEnv('NODE_ENV', 'test');
      expect(config.isTest).toBe(true);
    });
  });

  describe('isLocal', () => {
    test('should return true if NODE_ENV is local', () => {
      vi.stubEnv('NODE_ENV', 'local');
      expect(config.isLocal).toBe(true);
    });
  });

  describe('dbConfig', () => {
    test('should return dbConfig', () => {
      vi.stubEnv('DATABASE_URL', 'db_url');
      vi.stubEnv('DATABASE_URL_REPLICA', 'db_url_replica');
      vi.stubEnv('RDS_PROXY_ENDPOINT', 'proxy_endpoint');
      vi.stubEnv('RDS_PROXY_ENDPOINT_REPLICA', 'proxy_endpoint_replica');
      vi.stubEnv('DATABASE_MAX_RETRIES', '1');
      vi.stubEnv('RETRY_PRISMA_CLIENT_TIMEOUT_MS', '1000');

      expect(config.dbConfig).toEqual({
        dbUrl: 'db_url',
        dbUrlReplica: 'db_url_replica',
        proxyEndpoint: 'proxy_endpoint',
        proxyEndpointReplica: 'proxy_endpoint_replica',
        maxRetries: 1,
        connectionLimit: 3,
        backOffMs: 1000,
      });
    });
  });

  describe('awsConfig', () => {
    test('should return awsConfig', () => {
      vi.stubEnv('AWS_REGION', 'aws_region');
      expect(config.awsConfig).toEqual({
        region: 'aws_region',
      });
    });
  });

  describe('secretManagerKeys', () => {
    test('should return secretManagerKeys', () => {
      vi.stubEnv('RDS_SECRET_ARN', 'rds_secret_arn');
      vi.stubEnv('GCS_SECRET_NAME', 'gcs_secret_name');
      expect(config.secretManagerKeys).toEqual({
        RDS_SECRET_ARN: 'rds_secret_arn',
        GCS_SECRET_NAME: 'gcs_secret_name',
      });
    });
  });

  describe('elastiCacheConfig', () => {
    beforeEach(() => {
      vi.unstubAllEnvs();
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    test('should return elastiCacheConfig', () => {
      vi.stubEnv('ELASTICACHE_HOST', 'elasticache_host');
      vi.stubEnv('ELASTICACHE_PORT', '6379');
      vi.stubEnv('ELASTICACHE_SLIDING_EXPIRATION', 'true');
      vi.stubEnv('ELASTICACHE_TTL', '120');

      expect(config.elastiCacheConfig).toEqual({
        host: 'elasticache_host',
        port: 6379,
        slidingExpiration: true,
        ttl: 120,
      });
    });

    test('should return default elastiCacheConfig if env vars are not set', () => {
      vi.stubEnv('ELASTICACHE_HOST', 'elasticache_host');
      vi.stubEnv('ELASTICACHE_PORT', '6379');

      expect(config.elastiCacheConfig).toEqual({
        host: 'elasticache_host',
        port: 6379,
        slidingExpiration: true,
        ttl: 86400,
      });
    });

    test('should throw error if ELASTICACHE_PORT is not a number', () => {
      vi.stubEnv('ELASTICACHE_HOST', 'elasticache_host');
      vi.stubEnv('ELASTICACHE_PORT', 'invalid_port');

      expect(() => config.elastiCacheConfig).toThrow(
        'ELASTICACHE_PORT environment variable is invalid',
      );
    });

    test('should throw error if ELASTICACHE_PORT is out of range', () => {
      vi.stubEnv('ELASTICACHE_HOST', 'elasticache_host');
      vi.stubEnv('ELASTICACHE_PORT', '70000');

      expect(() => config.elastiCacheConfig).toThrow(
        'ELASTICACHE_PORT environment variable is invalid',
      );
    });

    test('should set slidingExpiration to false if ELASTICACHE_SLIDING_EXPIRATION is false', () => {
      vi.stubEnv('ELASTICACHE_HOST', 'elasticache_host');
      vi.stubEnv('ELASTICACHE_PORT', '6379');
      vi.stubEnv('ELASTICACHE_SLIDING_EXPIRATION', 'false');

      expect(config.elastiCacheConfig.slidingExpiration).toBe(false);
    });

    test('should throw error if ELASTICACHE_TTL is not a number', () => {
      vi.stubEnv('ELASTICACHE_HOST', 'elasticache_host');
      vi.stubEnv('ELASTICACHE_PORT', '6379');
      vi.stubEnv('ELASTICACHE_TTL', 'invalid_ttl');

      expect(() => config.elastiCacheConfig).toThrow(
        'ELASTICACHE_TTL environment variable is invalid',
      );
    });

    test('should throw error if ELASTICACHE_TTL is less than or equal to 0', () => {
      vi.stubEnv('ELASTICACHE_HOST', 'elasticache_host');
      vi.stubEnv('ELASTICACHE_PORT', '6379');
      vi.stubEnv('ELASTICACHE_TTL', '0');

      expect(() => config.elastiCacheConfig).toThrow(
        'ELASTICACHE_TTL environment variable is invalid',
      );
    });
  });
});
