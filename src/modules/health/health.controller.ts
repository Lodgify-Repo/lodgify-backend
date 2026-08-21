import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '@/infra/database/prisma.service';
import { CacheService } from '@/infra/cache/cache.service';
import Logger from '@/infra/logger/logger.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = Logger.getInstance('server');

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Application health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'One or more dependencies are unhealthy' })
  async check() {
    const startTime = Date.now();
    const checks: Record<string, { status: string; responseTime?: number; error?: string }> = {};

    // ── Database Health ──────────────────────────────────────
    try {
      const dbStart = Date.now();
      await this.prisma.$queryRawUnsafe('SELECT 1');
      checks.database = { status: 'up', responseTime: Date.now() - dbStart };
    } catch (error) {
      checks.database = { status: 'down', error: error instanceof Error ? error.message : 'Unknown error' };
      this.logger.error('[Health] Database check failed:', error);
    }

    // ── Redis Health ─────────────────────────────────────────
    try {
      const redisStart = Date.now();
      await this.cache.set('health:ping', 'pong', 10);
      const pong = await this.cache.get<string>('health:ping');
      checks.redis = {
        status: pong === 'pong' ? 'up' : 'degraded',
        responseTime: Date.now() - redisStart,
      };
    } catch (error) {
      checks.redis = { status: 'down', error: error instanceof Error ? error.message : 'Unknown error' };
      this.logger.error('[Health] Redis check failed:', error);
    }

    const overallStatus = Object.values(checks).every((c) => c.status === 'up') ? 'healthy' : 'degraded';

    return {
      status: overallStatus,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      checks,
    };
  }
}
