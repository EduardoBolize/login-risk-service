export interface RiskConfig {
  thresholds: {
    /** score >= challengeFrom → CHALLENGE */
    challengeFrom: number;
    /** score > denyAbove → DENY */
    denyAbove: number;
  };
  bruteForce: { windowSeconds: number; maxFailures: number; score: number };
  credentialStuffing: { windowSeconds: number; maxDistinctUsers: number; score: number };
  newDevice: { cacheTtlSeconds: number; score: number };
  impossibleTravel: {
    maxSpeedKmh: number;
    minDistanceKm: number;
    stateTtlSeconds: number;
    score: number;
  };
}

export const RISK_CONFIG = Symbol('RISK_CONFIG');

const THIRTY_DAYS = 30 * 24 * 60 * 60;

export const defaultRiskConfig: RiskConfig = {
  thresholds: { challengeFrom: 30, denyAbove: 70 },
  bruteForce: { windowSeconds: 15 * 60, maxFailures: 5, score: 45 },
  credentialStuffing: { windowSeconds: 10 * 60, maxDistinctUsers: 5, score: 50 },
  newDevice: { cacheTtlSeconds: THIRTY_DAYS, score: 30 },
  // ~900 km/h is roughly commercial flight speed.
  impossibleTravel: { maxSpeedKmh: 900, minDistanceKm: 500, stateTtlSeconds: THIRTY_DAYS, score: 50 },
};
