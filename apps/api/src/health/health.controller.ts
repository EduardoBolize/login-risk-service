import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS } from '../redis/redis.constants';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  @Get()
  async check() {
    const [database, redis] = await Promise.allSettled([
      this.prisma.$queryRaw`SELECT 1`,
      this.redis.ping(),
    ]);
    const components = {
      database: database.status === 'fulfilled' ? 'up' : 'down',
      redis: redis.status === 'fulfilled' ? 'up' : 'down',
    };

    if (Object.values(components).includes('down')) {
      throw new ServiceUnavailableException({ status: 'error', ...components });
    }
    return { status: 'ok', ...components };
  }
}
