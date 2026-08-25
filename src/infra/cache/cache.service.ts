import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { REDIS_DB, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from '@/common/constants';
import Redis from 'ioredis';
import Logger from '@/infra/logger/logger.service';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = Logger.getInstance('server');

  onModuleInit() {
    this.client = new Redis({
      host: REDIS_HOST ?? 'localhost',
      port: REDIS_PORT ? Number(REDIS_PORT) : 6379,
      password: REDIS_PASSWORD,
      db: REDIS_DB ? Number(REDIS_DB) : 0,
      lazyConnect: true, // Don't fail immediately if Redis is down
      retryStrategy: (times) => {
        // Stop retrying after 3 attempts to prevent log spam when Redis is missing locally
        if (times > 3) {
          return null;
        }
        return Math.min(times * 500, 2000);
      }
    });

    this.client.on('error', (err) => {
      this.logger.error(`[Cache] redis client error:`, err);
    });

    this.client.on('connect', () => {
      this.logger.info(`[Cache] connected to redis`);
    });
    
    // Connect explicitly, but catch errors to allow graceful degradation
    this.client.connect().catch((err) => {
      this.logger.warn(`[Cache] failed to connect at startup (features may degrade): ${err.message}`);
    });
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const cached = await this.client.get(key);
    if (!cached) return null;
    try {
      return JSON.parse(cached) as T;
    } catch (error) {
      this.logger.error('[Cache] get failed:', error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  async getOrSet<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await fn();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }
}
