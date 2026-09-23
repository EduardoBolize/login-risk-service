import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIP,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Decision, RiskReason } from '../domain/types';

export class EvaluateLoginDto {
  @ApiProperty({ example: 'user-123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  userId!: string;

  @ApiProperty({ example: '177.71.0.10' })
  @IsIP()
  ip!: string;

  @ApiProperty({ example: 'device-fingerprint-abc', description: 'Stable device fingerprint' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  deviceId!: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  userAgent?: string;

  @ApiProperty({ description: 'Whether the credentials were valid' })
  @IsBoolean()
  success!: boolean;

  @ApiPropertyOptional({
    example: '2026-01-01T12:00:00Z',
    description: 'When the login happened (ISO-8601). Defaults to now.',
  })
  @IsOptional()
  @IsISO8601()
  timestamp?: string;
}

export class EvaluateLoginResponseDto {
  @ApiProperty({ format: 'uuid' })
  assessmentId!: string;

  @ApiProperty({ minimum: 0, maximum: 100, example: 75 })
  score!: number;

  @ApiProperty({ enum: Object.values(Decision), example: Decision.DENY })
  decision!: Decision;

  @ApiProperty({ enum: Object.values(RiskReason), isArray: true, example: ['NEW_DEVICE'] })
  reasons!: RiskReason[];

  @ApiProperty({ description: 'True when some rules could not run and were skipped (fail-open)' })
  degraded!: boolean;

  @ApiProperty()
  evaluatedAt!: Date;
}
