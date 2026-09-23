import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GeoIpProvider } from '../geo/geo-ip.provider';
import { PrismaService } from '../prisma/prisma.service';
import { Decision, LoginContext } from './domain/types';
import { EvaluateLoginDto, EvaluateLoginResponseDto } from './dto/evaluate-login.dto';
import { ListAssessmentsQuery } from './dto/list-assessments.query';
import { RiskEngine } from './engine/risk-engine';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class RiskService {
  constructor(
    private readonly engine: RiskEngine,
    private readonly geo: GeoIpProvider,
    private readonly prisma: PrismaService,
  ) {}

  async evaluate(dto: EvaluateLoginDto): Promise<EvaluateLoginResponseDto> {
    const ctx: LoginContext = {
      userId: dto.userId,
      ip: dto.ip,
      deviceId: dto.deviceId,
      userAgent: dto.userAgent,
      success: dto.success,
      timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
      geo: this.geo.lookup(dto.ip),
    };

    // Evaluate against past state first, then fold this login into it.
    const evaluation = await this.engine.evaluate(ctx);
    await this.engine.record(ctx);

    const assessment = await this.prisma.riskAssessment.create({
      data: {
        userId: ctx.userId,
        ip: ctx.ip,
        deviceId: ctx.deviceId,
        userAgent: ctx.userAgent,
        country: ctx.geo?.country,
        loginSuccess: ctx.success,
        score: evaluation.score,
        decision: evaluation.decision,
        reasons: evaluation.reasons,
        ruleResults: evaluation.results as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      assessmentId: assessment.id,
      score: evaluation.score,
      decision: evaluation.decision,
      reasons: evaluation.reasons,
      degraded: evaluation.failedRules.length > 0,
      evaluatedAt: assessment.createdAt,
    };
  }

  list(query: ListAssessmentsQuery) {
    return this.prisma.riskAssessment.findMany({
      where: { decision: query.decision, userId: query.userId },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
    });
  }

  async summary() {
    const since = new Date(Date.now() - DAY_MS);
    const groups = await this.prisma.riskAssessment.groupBy({
      by: ['decision'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    });

    const counts: Record<Decision, number> = { ALLOW: 0, CHALLENGE: 0, DENY: 0 };
    for (const group of groups) {
      counts[group.decision] = group._count._all;
    }
    const total = counts.ALLOW + counts.CHALLENGE + counts.DENY;
    return { since, total, ...counts };
  }
}
