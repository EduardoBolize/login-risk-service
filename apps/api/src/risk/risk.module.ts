import { Module } from '@nestjs/common';
import { GeoModule } from '../geo/geo.module';
import { DeviceRepository, PrismaDeviceRepository } from './devices/device.repository';
import { RISK_RULES, RiskRule } from './domain/types';
import { RiskEngine } from './engine/risk-engine';
import { RISK_CONFIG, defaultRiskConfig } from './risk.config';
import { AssessmentsController, RiskController } from './risk.controller';
import { RiskService } from './risk.service';
import { BruteForceRule } from './rules/brute-force.rule';
import { CredentialStuffingRule } from './rules/credential-stuffing.rule';
import { ImpossibleTravelRule } from './rules/impossible-travel.rule';
import { NewDeviceRule } from './rules/new-device.rule';

const RULES = [BruteForceRule, CredentialStuffingRule, NewDeviceRule, ImpossibleTravelRule];

@Module({
  imports: [GeoModule],
  controllers: [RiskController, AssessmentsController],
  providers: [
    { provide: RISK_CONFIG, useValue: defaultRiskConfig },
    { provide: DeviceRepository, useClass: PrismaDeviceRepository },
    ...RULES,
    { provide: RISK_RULES, inject: RULES, useFactory: (...rules: RiskRule[]) => rules },
    RiskEngine,
    RiskService,
  ],
})
export class RiskModule {}
