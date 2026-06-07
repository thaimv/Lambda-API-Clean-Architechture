import 'reflect-metadata';

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

import {
  ElastiCacheCacheService,
  minifyJSON,
} from '@/common/datasources/cache/implements/elasticache.cache.datasource.impl';
import { ValkeyClient } from '@/common/datasources/cache/implements/valkey-client';
import type { AppConfig } from '@/config/app.config';

vi.mock('@valkey/valkey-glide', () => ({
  TimeUnit: {
    Seconds: 'EX',
  },
}));

vi.mock('@/common/datasources/cache/implements/valkey-client', () => {
  return {
    ValkeyClient: {
      getInstance: vi.fn(),
    },
  };
});

const mockClient = {
  get: vi.fn(),
  getex: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  flushall: vi.fn(),
};

describe('ElastiCacheCacheService', () => {
  let cacheService: ElastiCacheCacheService;
  let appConfigMock: AppConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    (ValkeyClient.getInstance as Mock).mockResolvedValue(mockClient);

    appConfigMock = {
      elastiCacheConfig: {
        host: 'localhost',
        port: 6379,
        slidingExpiration: true,
        ttl: 3600,
      },
    } as AppConfig;

    cacheService = new ElastiCacheCacheService(appConfigMock);
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
      appConfigMock = {
        elastiCacheConfig: {
          host: 'localhost',
          port: 6379,
          slidingExpiration: false,
          ttl: 3600,
        },
      } as AppConfig;
      cacheService = new ElastiCacheCacheService(appConfigMock);
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
