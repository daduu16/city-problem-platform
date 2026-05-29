import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { UserAccessScope } from './access-scope.types';

const SCOPE_PREFIX = 'access:scope:';
const DEFAULT_TTL_SECONDS = 600;

@Injectable()
export class ScopeCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(ScopeCacheService.name);
  private readonly redis: Redis | null;
  private readonly ttl: number;

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL');
    this.ttl = Number(this.config.get('REDIS_SCOPE_TTL_SECONDS') ?? DEFAULT_TTL_SECONDS);

    if (url) {
      this.redis = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
      this.redis.connect().catch((err) => {
        this.logger.warn(`Redis unavailable, scope cache disabled: ${err.message}`);
      });
    } else {
      this.redis = null;
    }
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }

  private cacheKey(userId: string) {
    return `${SCOPE_PREFIX}${userId}`;
  }

  async get(userId: string): Promise<UserAccessScope | null> {
    if (!this.redis || this.redis.status !== 'ready') return null;
    try {
      const raw = await this.redis.get(this.cacheKey(userId));
      return raw ? (JSON.parse(raw) as UserAccessScope) : null;
    } catch (err) {
      this.logger.warn(`Redis get failed: ${(err as Error).message}`);
      return null;
    }
  }

  async set(userId: string, scope: UserAccessScope): Promise<void> {
    if (!this.redis || this.redis.status !== 'ready') return;
    try {
      await this.redis.set(this.cacheKey(userId), JSON.stringify(scope), 'EX', this.ttl);
    } catch (err) {
      this.logger.warn(`Redis set failed: ${(err as Error).message}`);
    }
  }

  async invalidate(userId: string): Promise<void> {
    if (!this.redis || this.redis.status !== 'ready') return;
    try {
      await this.redis.del(this.cacheKey(userId));
    } catch (err) {
      this.logger.warn(`Redis del failed: ${(err as Error).message}`);
    }
  }
}
