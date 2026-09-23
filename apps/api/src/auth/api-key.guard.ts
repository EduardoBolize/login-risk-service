import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';
import { Env } from '../config/env';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly keys: Buffer[];

  constructor(config: ConfigService<Env, true>) {
    this.keys = config.get('API_KEYS', { infer: true }).map((key) => Buffer.from(key));
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.header('x-api-key');
    if (!provided) {
      throw new UnauthorizedException('Missing API key');
    }

    const candidate = Buffer.from(provided);
    const valid = this.keys.some(
      (key) => key.length === candidate.length && timingSafeEqual(key, candidate),
    );
    if (!valid) {
      throw new UnauthorizedException('Invalid API key');
    }
    return true;
  }
}
