import { DI } from '@/common/constants/di.const';
import { ElastiCacheCacheService } from '@/common/datasources/cache/implements/elasticache.cache.datasource.impl';
import { Module } from '@/common/decorators/module.decorator';

@Module({
  providers: [
    {
      provide: DI.CACHE_DATASOURCE,
      useClass: ElastiCacheCacheService,
    },
  ],
})
export class CacheDatasourceModule {}
