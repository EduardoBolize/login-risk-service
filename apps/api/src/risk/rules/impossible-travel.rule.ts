import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { haversineKm } from '../../geo/haversine';
import { REDIS } from '../../redis/redis.constants';
import { LoginContext, RiskReason, RiskRule, RuleResult, notTriggered, triggered } from '../domain/types';
import { RISK_CONFIG, RiskConfig } from '../risk.config';

const MS_PER_HOUR = 3_600_000;

/**
 * The user would have to travel faster than a plane between the last successful
 * login and this one. The last known location is kept in a Redis hash per user.
 */
@Injectable()
export class ImpossibleTravelRule implements RiskRule {
  readonly name = 'impossible_travel';

  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    @Inject(RISK_CONFIG) private readonly config: RiskConfig,
  ) {}

  private key(userId: string) {
    return `risk:geo:last:${userId}`;
  }

  async evaluate(ctx: LoginContext): Promise<RuleResult> {
    if (!ctx.geo) {
      return notTriggered(this.name, { geo: 'unavailable' });
    }

    const last = await this.redis.hgetall(this.key(ctx.userId));
    if (!last.ts) {
      return notTriggered(this.name, { geo: 'no_history' });
    }

    const { maxSpeedKmh, minDistanceKm, score } = this.config.impossibleTravel;
    const distanceKm = haversineKm({ lat: Number(last.lat), lon: Number(last.lon) }, ctx.geo);
    if (distanceKm < minDistanceKm) {
      return notTriggered(this.name, { distanceKm: Math.round(distanceKm) });
    }

    const hours = (ctx.timestamp.getTime() - Number(last.ts)) / MS_PER_HOUR;
    const speedKmh = hours > 0 ? distanceKm / hours : Infinity;
    if (speedKmh <= maxSpeedKmh) {
      return notTriggered(this.name, { distanceKm: Math.round(distanceKm) });
    }

    return triggered(this.name, score, RiskReason.IMPOSSIBLE_TRAVEL, {
      from: last.country,
      to: ctx.geo.country,
      distanceKm: Math.round(distanceKm),
      speedKmh: Number.isFinite(speedKmh) ? Math.round(speedKmh) : null,
    });
  }

  async record(ctx: LoginContext): Promise<void> {
    if (!ctx.success || !ctx.geo) return;

    const key = this.key(ctx.userId);
    await this.redis
      .multi()
      .hset(
        key,
        'lat',
        String(ctx.geo.lat),
        'lon',
        String(ctx.geo.lon),
        'country',
        ctx.geo.country,
        'ts',
        String(ctx.timestamp.getTime()),
      )
      .expire(key, this.config.impossibleTravel.stateTtlSeconds)
      .exec();
  }
}
