import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { REDIS } from '../../redis/redis.constants';
import { LoginContext, RiskReason, RiskRule, RuleResult, notTriggered, triggered } from '../domain/types';
import { RISK_CONFIG, RiskConfig } from '../risk.config';

/**
 * Too many failed attempts against the same account within a sliding window.
 * Failures live in a sorted set scored by timestamp, so the window slides precisely
 * instead of resetting at fixed boundaries like a plain INCR counter would.
 */
@Injectable()
export class BruteForceRule implements RiskRule {
  readonly name = 'brute_force';

  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    @Inject(RISK_CONFIG) private readonly config: RiskConfig,
  ) {}

  private key(userId: string) {
    return `risk:bf:${userId}`;
  }

  async evaluate(ctx: LoginContext): Promise<RuleResult> {
    const { windowSeconds, maxFailures, score } = this.config.bruteForce;
    const windowStart = ctx.timestamp.getTime() - windowSeconds * 1000;

    const failures = await this.redis.zcount(this.key(ctx.userId), windowStart, '+inf');
    if (failures < maxFailures) {
      return notTriggered(this.name, { failures });
    }
    return triggered(this.name, score, RiskReason.BRUTE_FORCE, { failures, windowSeconds });
  }

  async record(ctx: LoginContext): Promise<void> {
    if (ctx.success) return;

    const { windowSeconds } = this.config.bruteForce;
    const now = ctx.timestamp.getTime();
    const key = this.key(ctx.userId);
    await this.redis
      .multi()
      .zadd(key, now, `${now}:${randomUUID()}`)
      .zremrangebyscore(key, 0, now - windowSeconds * 1000)
      .expire(key, windowSeconds)
      .exec();
  }
}
