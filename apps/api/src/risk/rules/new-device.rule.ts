import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS } from '../../redis/redis.constants';
import { DeviceRepository } from '../devices/device.repository';
import { LoginContext, RiskReason, RiskRule, RuleResult, notTriggered, triggered } from '../domain/types';
import { RISK_CONFIG, RiskConfig } from '../risk.config';

/**
 * Login from a device the user never successfully logged in with.
 * Postgres is the source of truth; Redis is a read-through cache of known devices.
 * A device only becomes trusted after a *successful* login.
 */
@Injectable()
export class NewDeviceRule implements RiskRule {
  readonly name = 'new_device';

  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    private readonly devices: DeviceRepository,
    @Inject(RISK_CONFIG) private readonly config: RiskConfig,
  ) {}

  private key(userId: string) {
    return `risk:devices:${userId}`;
  }

  async evaluate(ctx: LoginContext): Promise<RuleResult> {
    if (await this.redis.sismember(this.key(ctx.userId), ctx.deviceId)) {
      return notTriggered(this.name, { source: 'cache' });
    }

    if (await this.devices.isKnown(ctx.userId, ctx.deviceId)) {
      await this.cache(ctx);
      return notTriggered(this.name, { source: 'database' });
    }

    const knownDevices = await this.devices.countForUser(ctx.userId);
    if (knownDevices === 0) {
      // No history yet: the first device can't be "new" relative to anything.
      return notTriggered(this.name, { firstLogin: true });
    }
    return triggered(this.name, this.config.newDevice.score, RiskReason.NEW_DEVICE, {
      knownDevices,
    });
  }

  async record(ctx: LoginContext): Promise<void> {
    if (!ctx.success) return;
    await this.devices.upsert(ctx.userId, ctx.deviceId, ctx.timestamp);
    await this.cache(ctx);
  }

  private async cache(ctx: LoginContext): Promise<void> {
    const key = this.key(ctx.userId);
    await this.redis
      .multi()
      .sadd(key, ctx.deviceId)
      .expire(key, this.config.newDevice.cacheTtlSeconds)
      .exec();
  }
}
