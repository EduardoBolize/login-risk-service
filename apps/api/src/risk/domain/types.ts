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

/** Everything a rule needs to know about a single login attempt. */
export interface LoginContext {
  userId: string;
  ip: string;
  deviceId: string;
  userAgent?: string;
  /** Whether the caller's credential check passed. */
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

export interface RiskRule {
  readonly name: string;
  /** Read-only check against state accumulated from previous logins. */
  evaluate(ctx: LoginContext): Promise<RuleResult>;
  /** Folds the current login into the rule's state, after every rule has evaluated. */
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
