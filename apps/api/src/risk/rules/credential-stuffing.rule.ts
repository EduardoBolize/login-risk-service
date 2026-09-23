import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS } from '../../redis/redis.constants';
import { LoginContext, RiskReason, RiskRule, RuleResult, notTriggered, triggered } from '../domain/types';
import { RISK_CONFIG, RiskConfig } from '../risk.config';

/**
 * A single IP trying many distinct accounts — the signature of credential stuffing.
 * Distinct users per IP are kept in a set that expires after a period of inactivity.
 */
@Injectable()
export class CredentialStuffingRule implements RiskRule {
  readonly name = 'credential_stuffing';

  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    @Inject(RISK_CONFIG) private readonly config: RiskConfig,
  ) {}

  private key(ip: string) {
    return `risk:cs:${ip}`;
  }

  async evaluate(ctx: LoginContext): Promise<RuleResult> {
    const { maxDistinctUsers, score } = this.config.credentialStuffing;
    const key = this.key(ctx.ip);

    const [seen, isKnownUser] = await Promise.all([
      this.redis.scard(key),
      this.redis.sismember(key, ctx.userId),
    ]);
    const distinctUsers = seen + (isKnownUser ? 0 : 1);

    if (distinctUsers <= maxDistinctUsers) {
      return notTriggered(this.name, { distinctUsers });
    }
    return triggered(this.name, score, RiskReason.CREDENTIAL_STUFFING, { distinctUsers });
  }

  async record(ctx: LoginContext): Promise<void> {
    const key = this.key(ctx.ip);
    await this.redis
      .multi()
      .sadd(key, ctx.userId)
      .expire(key, this.config.credentialStuffing.windowSeconds)
      .exec();
  }
}
