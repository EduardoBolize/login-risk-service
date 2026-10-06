import { GeoLocation } from '../../geo/geo-ip.provider';

export const Decision = {
  ALLOW: 'ALLOW',
  CHALLENGE: 'CHALLENGE',
  DENY: 'DENY',
} as const;
export type Decision = (typeof Decision)[keyof typeof Decision];

export const RiskReason = {
  BRUTE_FORCE: 'BRUTE_FORCE',
  CREDENTIAL_STUFFING: 'CREDENTIAL_STUFFING',
  NEW_DEVICE: 'NEW_DEVICE',
  IMPOSSIBLE_TRAVEL: 'IMPOSSIBLE_TRAVEL',
} as const;
export type RiskReason = (typeof RiskReason)[keyof typeof RiskReason];

export interface LoginContext {
  userId: string;
  ip: string;
  deviceId: string;
  userAgent?: string;
  // Outcome of the caller's credential check, not of this risk evaluation.
  success: boolean;
  timestamp: Date;
  geo: GeoLocation | null;
}

export type RuleDetails = Record<string, string | number | boolean | null>;

export interface RuleResult {
  rule: string;
  triggered: boolean;
  score: number;
  reason?: RiskReason;
  details?: RuleDetails;
}

// Two phases so every rule judges the login against prior state only:
// all rules evaluate first, then each one records the current login.
export interface RiskRule {
  readonly name: string;
  evaluate(ctx: LoginContext): Promise<RuleResult>;
  record(ctx: LoginContext): Promise<void>;
}

export const RISK_RULES = Symbol('RISK_RULES');

export const notTriggered = (rule: string, details?: RuleDetails): RuleResult => ({
  rule,
  triggered: false,
  score: 0,
  details,
});

export const triggered = (
  rule: string,
  score: number,
  reason: RiskReason,
  details?: RuleDetails,
): RuleResult => ({ rule, triggered: true, score, reason, details });
