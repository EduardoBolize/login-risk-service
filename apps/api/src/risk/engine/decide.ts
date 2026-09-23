import { Decision } from '../domain/types';
import { RiskConfig } from '../risk.config';

export function decide(score: number, thresholds: RiskConfig['thresholds']): Decision {
  if (score > thresholds.denyAbove) return Decision.DENY;
  if (score >= thresholds.challengeFrom) return Decision.CHALLENGE;
  return Decision.ALLOW;
}
