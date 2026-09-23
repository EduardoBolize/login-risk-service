import { Inject, Injectable, Logger } from '@nestjs/common';
import { Decision, LoginContext, RISK_RULES, RiskReason, RiskRule, RuleResult } from '../domain/types';
import { RISK_CONFIG, RiskConfig } from '../risk.config';
import { decide } from './decide';

export interface RiskEvaluation {
  score: number;
  decision: Decision;
  reasons: RiskReason[];
  results: RuleResult[];
  /** Rules that errored (e.g. Redis timeout) and were skipped — the engine fails open. */
  failedRules: string[];
}

const MAX_SCORE = 100;

@Injectable()
export class RiskEngine {
  private readonly logger = new Logger(RiskEngine.name);

  constructor(
    @Inject(RISK_RULES) private readonly rules: RiskRule[],
    @Inject(RISK_CONFIG) private readonly config: RiskConfig,
  ) {}

  async evaluate(ctx: LoginContext): Promise<RiskEvaluation> {
    const settled = await Promise.allSettled(this.rules.map((rule) => rule.evaluate(ctx)));

    const results: RuleResult[] = [];
    const failedRules: string[] = [];
    settled.forEach((outcome, index) => {
      const rule = this.rules[index];
      if (outcome.status === 'fulfilled') {
        results.push(outcome.value);
      } else {
        failedRules.push(rule.name);
        this.logger.warn(`Rule "${rule.name}" failed to evaluate: ${String(outcome.reason)}`);
      }
    });

    const hits = results.filter((result) => result.triggered);
    const score = Math.min(
      MAX_SCORE,
      hits.reduce((sum, result) => sum + result.score, 0),
    );

    return {
      score,
      decision: decide(score, this.config.thresholds),
      reasons: hits.map((result) => result.reason).filter((r): r is RiskReason => !!r),
      results,
      failedRules,
    };
  }

  async record(ctx: LoginContext): Promise<void> {
    const settled = await Promise.allSettled(this.rules.map((rule) => rule.record(ctx)));
    settled.forEach((outcome, index) => {
      if (outcome.status === 'rejected') {
        this.logger.warn(
          `Rule "${this.rules[index].name}" failed to record: ${String(outcome.reason)}`,
        );
      }
    });
  }
}
