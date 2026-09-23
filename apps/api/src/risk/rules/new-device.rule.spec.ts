import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';
import { defaultRiskConfig } from '../risk.config';
import { buildContext } from '../testing/fixtures';
import { InMemoryDeviceRepository } from '../testing/in-memory-device.repository';
import { NewDeviceRule } from './new-device.rule';

describe('NewDeviceRule', () => {
  const redis = new RedisMock() as unknown as Redis;
  let devices: InMemoryDeviceRepository;
  let rule: NewDeviceRule;

  beforeEach(async () => {
    await redis.flushall();
    devices = new InMemoryDeviceRepository();
    rule = new NewDeviceRule(redis, devices, defaultRiskConfig);
  });

  it('does not trigger on the very first login of a user', async () => {
    const result = await rule.evaluate(buildContext());

    expect(result.triggered).toBe(false);
    expect(result.details).toEqual({ firstLogin: true });
  });

  it('trusts a device after a successful login (served from cache)', async () => {
    await rule.record(buildContext({ deviceId: 'laptop' }));

    const result = await rule.evaluate(buildContext({ deviceId: 'laptop' }));

    expect(result.triggered).toBe(false);
    expect(result.details).toEqual({ source: 'cache' });
  });

  it('falls back to the database and warms the cache', async () => {
    await devices.upsert('user-1', 'laptop');

    const first = await rule.evaluate(buildContext({ deviceId: 'laptop' }));
    const second = await rule.evaluate(buildContext({ deviceId: 'laptop' }));

    expect(first.details).toEqual({ source: 'database' });
    expect(second.details).toEqual({ source: 'cache' });
  });

  it('triggers for an unseen device when the user has history', async () => {
    await rule.record(buildContext({ deviceId: 'laptop' }));

    const result = await rule.evaluate(buildContext({ deviceId: 'unknown-phone' }));

    expect(result).toMatchObject({ triggered: true, score: 30, reason: 'NEW_DEVICE' });
  });

  it('does not trust a device after a failed login', async () => {
    await rule.record(buildContext({ deviceId: 'laptop' }));
    await rule.record(buildContext({ deviceId: 'attacker', success: false }));

    const result = await rule.evaluate(buildContext({ deviceId: 'attacker' }));

    expect(result.triggered).toBe(true);
  });
});
