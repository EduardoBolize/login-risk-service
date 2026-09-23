import { describe, expect, it } from 'vitest';
import { countryFlag, percent, timeAgo } from './format';

describe('format', () => {
  it('turns ISO country codes into flags', () => {
    expect(countryFlag('BR')).toBe('🇧🇷');
    expect(countryFlag('pt')).toBe('🇵🇹');
    expect(countryFlag(null)).toBe('🌐');
  });

  it('formats percentages safely', () => {
    expect(percent(1, 4)).toBe('25%');
    expect(percent(0, 0)).toBe('0%');
  });

  it('formats relative time in Portuguese', () => {
    const now = Date.parse('2026-09-23T12:00:00Z');
    expect(timeAgo('2026-09-23T11:55:00Z', now)).toBe('há 5 minutos');
    expect(timeAgo('2026-09-23T09:00:00Z', now)).toBe('há 3 horas');
  });
});
