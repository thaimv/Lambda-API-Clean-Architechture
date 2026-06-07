import { GlideClient } from '@valkey/valkey-glide';

import { DI } from '@/common/constants/di.const';
import type { AppConfig } from '@/config/app.config';
import { getInstance as getAppConfigInstance } from '@/config/di/di.config';

export class ValkeyClient {
  private static instance: GlideClient | undefined;

  private constructor() {}

  public static async getInstance(): Promise<GlideClient> {
    if (!this.instance) {
      const appConfig = getAppConfigInstance<AppConfig>(DI.APP_CONFIG);

      if (!appConfig.elastiCacheConfig.host || !appConfig.elastiCacheConfig.port) {
        throw new Error('ElastiCache HOST or PORT is not set');
      }

      this.instance = await GlideClient.createClient({
        addresses: [
          {
            host: appConfig.elastiCacheConfig.host,
            port: appConfig.elastiCacheConfig.port,
          },
        ],
        useTLS: true,
      });
    }
    return this.instance;
  }
}
