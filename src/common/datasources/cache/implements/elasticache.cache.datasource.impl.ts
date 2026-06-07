import { TimeUnit } from '@valkey/valkey-glide';
import { inject, injectable } from 'inversify';

import { DI } from '@/common/constants/di.const';
import type { ICacheService } from '@/common/datasources/cache/cache.datasource';
import { ValkeyClient } from '@/common/datasources/cache/implements/valkey-client';
import type { AppConfig } from '@/config/app.config';

export const minifyJSON = (json: string) => {
  return json.replace(/\s+/g, '');
};

/**
 * In-memory implementation of the CacheService interface.
 * This implementation stores cache entries in a Map and supports TTL (time-to-live).
 */
@injectable()
export class ElastiCacheCacheService implements ICacheService {
  constructor(
    @inject(DI.APP_CONFIG)
    private readonly appConfig: AppConfig,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const client = await ValkeyClient.getInstance();
    const { slidingExpiration, ttl } = this.appConfig.elastiCacheConfig;

    const result =
      slidingExpiration === true
        ? await client.getex(key, {
            expiry: { type: TimeUnit.Seconds, duration: ttl },
          })
        : await client.get(key);

    if (!result) {
      return null;
    }

    return JSON.parse(result?.toString()) as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const client = await ValkeyClient.getInstance();
    const count = ttl !== undefined ? ttl : this.appConfig.elastiCacheConfig.ttl;
    await client.set(key, minifyJSON(JSON.stringify(value)), {
      expiry: { type: TimeUnit.Seconds, count },
    });
  }

  async delete(key: string): Promise<void> {
    const client = await ValkeyClient.getInstance();
    await client.del([key]);
  }

  async clear(): Promise<void> {
    const client = await ValkeyClient.getInstance();
    await client.flushall();
  }
}
