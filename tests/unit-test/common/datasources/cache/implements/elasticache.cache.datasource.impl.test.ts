/* eslint-disable max-lines-per-function */
import 'reflect-metadata';

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';

import type { ElastiCacheCacheDatasource } from '@/common/datasources/cache/implements/elasticache.cache.datasource.impl';
import type * as ElastiCacheCacheDatasourceModule from '@/common/datasources/cache/implements/elasticache.cache.datasource.impl';
import type { AppConfig } from '@/config/app.config';

vi.mock('@valkey/valkey-glide', () => ({
  GlideClient: {
    createClient: vi.fn(),
  },
  GlideClusterClient: {
    createClient: vi.fn(),
  },
  TimeUnit: {
    Seconds: 'EX',
  },
}));

vi.mock('@/common/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockClient = {
  get: vi.fn(),
  getex: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  flushall: vi.fn(),
};

describe('ElastiCacheCacheDatasource', () => {
  let cacheService: ElastiCacheCacheDatasource;
  let minifyJSON: typeof ElastiCacheCacheDatasourceModule.minifyJSON;
  let appConfigMock: AppConfig;
  let mockCreateGlideClient: Mock;
  let mockCreateClusterClient: Mock;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const valkeyModule = await import('@valkey/valkey-glide');
    mockCreateGlideClient = vi.mocked(valkeyModule.GlideClient.createClient);
    mockCreateClusterClient = vi.mocked(valkeyModule.GlideClusterClient.createClient);
    mockCreateGlideClient.mockResolvedValue(mockClient);
    mockCreateClusterClient.mockResolvedValue(mockClient);

    const cacheModule =
      await import('@/common/datasources/cache/implements/elasticache.cache.datasource.impl');
    minifyJSON = cacheModule.minifyJSON;

    appConfigMock = {
      elastiCacheConfig: {
        host: 'localhost',
        port: 6379,
        slidingExpiration: true,
        ttl: 3600,
        useTLS: true,
        clusterMode: false,
        requestTimeoutMs: 15000,
        connectionTimeoutMs: 15000,
      },
    } as AppConfig;

    cacheService = new cacheModule.ElastiCacheCacheDatasource(appConfigMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getClient', () => {
    it('should create a GlideClient with ElastiCache config', async () => {
      mockClient.getex.mockResolvedValue(null);

      await cacheService.get('missing-key');

      expect(mockCreateGlideClient).toHaveBeenCalledWith({
        addresses: [{ host: 'localhost', port: 6379 }],
        useTLS: true,
        requestTimeout: 15000,
        advancedConfiguration: {
          connectionTimeout: 15000,
        },
      });
      expect(mockCreateClusterClient).not.toHaveBeenCalled();
    });

    it('should create a GlideClusterClient when cluster mode is enabled', async () => {
      const cacheModule =
        await import('@/common/datasources/cache/implements/elasticache.cache.datasource.impl');
      appConfigMock = {
        elastiCacheConfig: {
          host: 'localhost',
          port: 6379,
          slidingExpiration: true,
          ttl: 3600,
          useTLS: true,
          clusterMode: true,
          requestTimeoutMs: 15000,
          connectionTimeoutMs: 15000,
        },
      } as AppConfig;
      cacheService = new cacheModule.ElastiCacheCacheDatasource(appConfigMock);
      mockClient.getex.mockResolvedValue(null);

      await cacheService.get('missing-key');

      expect(mockCreateClusterClient).toHaveBeenCalledWith({
        addresses: [{ host: 'localhost', port: 6379 }],
        useTLS: true,
        readFrom: 'preferReplica',
        requestTimeout: 15000,
        advancedConfiguration: {
          connectionTimeout: 15000,
        },
      });
      expect(mockCreateGlideClient).not.toHaveBeenCalled();
    });

    it('should use custom timeout values from config', async () => {
      const cacheModule =
        await import('@/common/datasources/cache/implements/elasticache.cache.datasource.impl');
      appConfigMock = {
        elastiCacheConfig: {
          host: 'localhost',
          port: 6379,
          slidingExpiration: true,
          ttl: 3600,
          useTLS: true,
          clusterMode: false,
          requestTimeoutMs: 30000,
          connectionTimeoutMs: 20000,
        },
      } as AppConfig;
      cacheService = new cacheModule.ElastiCacheCacheDatasource(appConfigMock);
      mockClient.getex.mockResolvedValue(null);

      await cacheService.get('missing-key');

      expect(mockCreateGlideClient).toHaveBeenCalledWith({
        addresses: [{ host: 'localhost', port: 6379 }],
        useTLS: true,
        requestTimeout: 30000,
        advancedConfiguration: {
          connectionTimeout: 20000,
        },
      });
    });

    it('should reuse the same Valkey client on subsequent calls', async () => {
      mockClient.getex.mockResolvedValue(null);

      await cacheService.get('key-1');
      await cacheService.get('key-2');

      expect(mockCreateGlideClient).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if ElastiCache HOST or PORT is not set', async () => {
      const cacheModule =
        await import('@/common/datasources/cache/implements/elasticache.cache.datasource.impl');
      const invalidConfig = {
        elastiCacheConfig: {
          host: undefined,
          port: undefined,
          slidingExpiration: true,
          ttl: 3600,
          useTLS: true,
          clusterMode: false,
          requestTimeoutMs: 15000,
          connectionTimeoutMs: 15000,
        },
      } as AppConfig;
      const invalidCacheService = new cacheModule.ElastiCacheCacheDatasource(invalidConfig);

      await expect(invalidCacheService.get('key')).rejects.toThrow(
        'ElastiCache HOST or PORT is not set',
      );
    });
  });

  describe('minifyJSON', () => {
    it('should remove whitespace from JSON string', () => {
      const json = '{ "key": "value" }';
      expect(minifyJSON(json)).toBe('{"key":"value"}');
    });
  });

  describe('get', () => {
    it('should return null when key does not exist', async () => {
      mockClient.getex.mockResolvedValue(null);
      const result = await cacheService.get('missing-key');
      expect(result).toBeNull();
    });

    it('should return parsed value when key exists', async () => {
      mockClient.getex.mockResolvedValue('{"foo":"bar"}');
      const result = await cacheService.get<{ foo: string }>('existing-key');
      expect(result).toEqual({ foo: 'bar' });
    });

    it('should use client.get when sliding expiration is disabled', async () => {
      const cacheModule =
        await import('@/common/datasources/cache/implements/elasticache.cache.datasource.impl');
      appConfigMock = {
        elastiCacheConfig: {
          host: 'localhost',
          port: 6379,
          slidingExpiration: false,
          ttl: 3600,
          useTLS: true,
          clusterMode: false,
          requestTimeoutMs: 15000,
          connectionTimeoutMs: 15000,
        },
      } as AppConfig;
      cacheService = new cacheModule.ElastiCacheCacheDatasource(appConfigMock);
      mockClient.get.mockResolvedValue('{"foo":"bar"}');

      const result = await cacheService.get<{ foo: string }>('existing-key');

      expect(mockClient.get).toHaveBeenCalledWith('existing-key');
      expect(mockClient.getex).not.toHaveBeenCalled();
      expect(result).toEqual({ foo: 'bar' });
    });
  });

  describe('set', () => {
    it('should set value with default ttl', async () => {
      await cacheService.set('key', { foo: 'bar' });
      expect(mockClient.set).toHaveBeenCalledWith('key', '{"foo":"bar"}', {
        expiry: { type: 'EX', count: 3600 },
      });
    });

    it('should set value with custom ttl', async () => {
      await cacheService.set('key', { foo: 'bar' }, 120);
      expect(mockClient.set).toHaveBeenCalledWith('key', '{"foo":"bar"}', {
        expiry: { type: 'EX', count: 120 },
      });
    });
  });

  describe('delete', () => {
    it('should delete key', async () => {
      await cacheService.delete('key');
      expect(mockClient.del).toHaveBeenCalledWith(['key']);
    });
  });

  describe('clear', () => {
    it('should flush all keys', async () => {
      await cacheService.clear();
      expect(mockClient.flushall).toHaveBeenCalled();
    });
  });
});
