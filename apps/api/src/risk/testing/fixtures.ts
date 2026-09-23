import { LoginContext } from '../domain/types';

export const SAO_PAULO = { country: 'BR', city: 'São Paulo', lat: -23.5505, lon: -46.6333 };
export const CAMPINAS = { country: 'BR', city: 'Campinas', lat: -22.9056, lon: -47.0608 };
export const LISBON = { country: 'PT', city: 'Lisbon', lat: 38.7223, lon: -9.1393 };

export function buildContext(overrides: Partial<LoginContext> = {}): LoginContext {
  return {
    userId: 'user-1',
    ip: '177.71.0.10',
    deviceId: 'device-1',
    userAgent: 'jest',
    success: true,
    timestamp: new Date('2026-01-01T12:00:00Z'),
    geo: SAO_PAULO,
    ...overrides,
  };
}

export const minutesLater = (base: Date, minutes: number) =>
  new Date(base.getTime() + minutes * 60_000);
