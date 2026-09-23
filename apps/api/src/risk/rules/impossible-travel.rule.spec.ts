import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';
import { defaultRiskConfig } from '../risk.config';
import { CAMPINAS, LISBON, SAO_PAULO, buildContext, minutesLater } from '../testing/fixtures';
import { ImpossibleTravelRule } from './impossible-travel.rule';

describe('ImpossibleTravelRule', () => {
  const redis = new RedisMock() as unknown as Redis;
  const rule = new ImpossibleTravelRule(redis, defaultRiskConfig);
  const start = new Date('2026-01-01T12:00:00Z');

  beforeEach(async () => {
    await redis.flushall();
    await rule.record(buildContext({ geo: SAO_PAULO, timestamp: start }));
  });

  it('triggers for São Paulo → Lisbon within one hour', async () => {
    const result = await rule.evaluate(
      buildContext({ geo: LISBON, timestamp: minutesLater(start, 60) }),
    );

    expect(result).toMatchObject({ triggered: true, score: 50, reason: 'IMPOSSIBLE_TRAVEL' });
    expect(result.details).toMatchObject({ from: 'BR', to: 'PT' });
  });

  it('does not trigger when there was enough time to fly', async () => {
    const result = await rule.evaluate(
      buildContext({ geo: LISBON, timestamp: minutesLater(start, 12 * 60) }),
    );

    expect(result.triggered).toBe(false);
  });

  it('ignores short distances regardless of time', async () => {
    const result = await rule.evaluate(
      buildContext({ geo: CAMPINAS, timestamp: minutesLater(start, 1) }),
    );

    expect(result.triggered).toBe(false);
  });

  it('skips when the IP could not be geolocated', async () => {
    const result = await rule.evaluate(buildContext({ geo: null }));

    expect(result).toMatchObject({ triggered: false, details: { geo: 'unavailable' } });
  });

  it('skips when there is no previous location', async () => {
    const result = await rule.evaluate(buildContext({ userId: 'fresh-user', geo: LISBON }));

    expect(result).toMatchObject({ triggered: false, details: { geo: 'no_history' } });
  });

  it('does not move the anchor location on failed logins', async () => {
    await rule.record(buildContext({ geo: LISBON, success: false, timestamp: minutesLater(start, 5) }));

    const result = await rule.evaluate(
      buildContext({ geo: SAO_PAULO, timestamp: minutesLater(start, 10) }),
    );

    expect(result.triggered).toBe(false);
  });
});
