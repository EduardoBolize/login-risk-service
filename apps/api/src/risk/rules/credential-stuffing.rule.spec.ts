import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';
import { defaultRiskConfig } from '../risk.config';
import { buildContext } from '../testing/fixtures';
import { CredentialStuffingRule } from './credential-stuffing.rule';

describe('CredentialStuffingRule', () => {
  const redis = new RedisMock() as unknown as Redis;
  const rule = new CredentialStuffingRule(redis, defaultRiskConfig);
  const ip = '45.10.20.30';

  beforeEach(() => redis.flushall());

  async function attemptsFrom(userCount: number) {
    for (let i = 0; i < userCount; i++) {
      await rule.record(buildContext({ ip, userId: `victim-${i}`, success: false }));
    }
  }

  it('does not trigger for a handful of accounts behind one IP', async () => {
    await attemptsFrom(4);

    const result = await rule.evaluate(buildContext({ ip, userId: 'victim-new' }));

    expect(result.triggered).toBe(false);
    expect(result.details).toEqual({ distinctUsers: 5 });
  });

  it('triggers when the IP exceeds the distinct-account limit', async () => {
    await attemptsFrom(5);

    const result = await rule.evaluate(buildContext({ ip, userId: 'victim-new' }));

    expect(result).toMatchObject({ triggered: true, score: 50, reason: 'CREDENTIAL_STUFFING' });
    expect(result.details).toEqual({ distinctUsers: 6 });
  });

  it('does not double count a user already seen from the IP', async () => {
    await attemptsFrom(5);

    const result = await rule.evaluate(buildContext({ ip, userId: 'victim-0' }));

    expect(result.triggered).toBe(false);
  });
});
