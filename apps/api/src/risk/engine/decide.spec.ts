import { defaultRiskConfig } from '../risk.config';
import { decide } from './decide';

describe('decide', () => {
  const { thresholds } = defaultRiskConfig;

  it.each([
    [0, 'ALLOW'],
    [29, 'ALLOW'],
    [30, 'CHALLENGE'],
    [70, 'CHALLENGE'],
    [71, 'DENY'],
    [100, 'DENY'],
  ])('score %i → %s', (score, expected) => {
    expect(decide(score, thresholds)).toBe(expected);
  });
});
