import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';
import { defaultRiskConfig } from '../risk.config';
import { buildContext, minutesLater } from '../testing/fixtures';
import { BruteForceRule } from './brute-force.rule';

describe('BruteForceRule', () => {
  const redis = new RedisMock() as unknown as Redis;
  const rule = new BruteForceRule(redis, defaultRiskConfig);
  const start = new Date('2026-01-01T12:00:00Z');

  beforeEach(() => redis.flushall());

  async function failTimes(times: number, from = start) {
    for (let i = 0; i < times; i++) {
      await rule.record(buildContext({ success: false, timestamp: minutesLater(from, i) }));
    }
  }

  it('does not trigger below the failure threshold', async () => {
    await failTimes(4);

    const result = await rule.evaluate(buildContext({ timestamp: minutesLater(start, 5) }));

    expect(result.triggered).toBe(false);
    expect(result.details).toEqual({ failures: 4 });
  });

  it('triggers once the threshold is reached', async () => {
    await failTimes(5);

    const result = await rule.evaluate(buildContext({ timestamp: minutesLater(start, 5) }));

    expect(result).toMatchObject({ triggered: true, score: 45, reason: 'BRUTE_FORCE' });
  });

  it('ignores failures that slid out of the window', async () => {
    await failTimes(5);

    const result = await rule.evaluate(buildContext({ timestamp: minutesLater(start, 30) }));

    expect(result.triggered).toBe(false);
  });

  it('does not count successful logins as failures', async () => {
    for (let i = 0; i < 10; i++) {
      await rule.record(buildContext({ success: true, timestamp: minutesLater(start, i) }));
    }

    const result = await rule.evaluate(buildContext({ timestamp: minutesLater(start, 10) }));

    expect(result.triggered).toBe(false);
  });

  it('tracks each account independently', async () => {
    await failTimes(5);

    const result = await rule.evaluate(
      buildContext({ userId: 'someone-else', timestamp: minutesLater(start, 5) }),
    );

    expect(result.triggered).toBe(false);
  });
});
