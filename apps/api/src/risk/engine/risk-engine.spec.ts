import { Logger } from '@nestjs/common';
import { RiskReason, RiskRule, RuleResult, notTriggered, triggered } from '../domain/types';
import { defaultRiskConfig } from '../risk.config';
import { buildContext } from '../testing/fixtures';
import { RiskEngine } from './risk-engine';

function fakeRule(name: string, result: RuleResult | Error): RiskRule {
  return {
    name,
    evaluate: jest.fn(async () => {
      if (result instanceof Error) throw result;
      return result;
    }),
    record: jest.fn(async () => undefined),
  };
}

describe('RiskEngine', () => {
  beforeAll(() => jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined));

  it('allows a login when no rule triggers', async () => {
    const engine = new RiskEngine([fakeRule('a', notTriggered('a'))], defaultRiskConfig);

    const evaluation = await engine.evaluate(buildContext());

    expect(evaluation).toMatchObject({ score: 0, decision: 'ALLOW', reasons: [], failedRules: [] });
  });

  it('sums triggered scores and collects reasons', async () => {
    const engine = new RiskEngine(
      [
        fakeRule('device', triggered('device', 30, RiskReason.NEW_DEVICE)),
        fakeRule('bf', triggered('bf', 45, RiskReason.BRUTE_FORCE)),
        fakeRule('noop', notTriggered('noop')),
      ],
      defaultRiskConfig,
    );

    const evaluation = await engine.evaluate(buildContext());

    expect(evaluation.score).toBe(75);
    expect(evaluation.decision).toBe('DENY');
    expect(evaluation.reasons).toEqual(['NEW_DEVICE', 'BRUTE_FORCE']);
  });

  it('caps the score at 100', async () => {
    const engine = new RiskEngine(
      [
        fakeRule('a', triggered('a', 60, RiskReason.IMPOSSIBLE_TRAVEL)),
        fakeRule('b', triggered('b', 60, RiskReason.CREDENTIAL_STUFFING)),
      ],
      defaultRiskConfig,
    );

    expect((await engine.evaluate(buildContext())).score).toBe(100);
  });

  it('fails open when a rule throws, reporting it as failed', async () => {
    const engine = new RiskEngine(
      [
        fakeRule('broken', new Error('redis timeout')),
        fakeRule('device', triggered('device', 30, RiskReason.NEW_DEVICE)),
      ],
      defaultRiskConfig,
    );

    const evaluation = await engine.evaluate(buildContext());

    expect(evaluation.failedRules).toEqual(['broken']);
    expect(evaluation.score).toBe(30);
    expect(evaluation.decision).toBe('CHALLENGE');
  });

  it('records the login on every rule even if one fails', async () => {
    const failing = fakeRule('a', notTriggered('a'));
    (failing.record as jest.Mock).mockRejectedValue(new Error('boom'));
    const healthy = fakeRule('b', notTriggered('b'));
    const engine = new RiskEngine([failing, healthy], defaultRiskConfig);

    await expect(engine.record(buildContext())).resolves.toBeUndefined();
    expect(healthy.record).toHaveBeenCalled();
  });
});
