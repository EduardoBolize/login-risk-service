import { Body, Controller, Get, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { EvaluateLoginDto, EvaluateLoginResponseDto } from './dto/evaluate-login.dto';
import { ListAssessmentsQuery } from './dto/list-assessments.query';
import { RiskService } from './risk.service';

@ApiTags('risk')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('v1/risk')
export class RiskController {
  constructor(private readonly risk: RiskService) {}

  @Post('evaluate')
  @HttpCode(200)
  @ApiOkResponse({ type: EvaluateLoginResponseDto })
  evaluate(@Body() dto: EvaluateLoginDto): Promise<EvaluateLoginResponseDto> {
    return this.risk.evaluate(dto);
  }
}

@ApiTags('assessments')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('v1/assessments')
export class AssessmentsController {
  constructor(private readonly risk: RiskService) {}

  @Get()
  list(@Query() query: ListAssessmentsQuery) {
    return this.risk.list(query);
  }

  @Get('summary')
  summary() {
    return this.risk.summary();
  }
}
