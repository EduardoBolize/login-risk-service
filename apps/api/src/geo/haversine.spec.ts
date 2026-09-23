import { haversineKm } from './haversine';

describe('haversineKm', () => {
  it('returns 0 for the same point', () => {
    expect(haversineKm({ lat: -23.55, lon: -46.63 }, { lat: -23.55, lon: -46.63 })).toBe(0);
  });

  it('computes São Paulo → Rio de Janeiro (~360 km)', () => {
    const distance = haversineKm({ lat: -23.5505, lon: -46.6333 }, { lat: -22.9068, lon: -43.1729 });
    expect(distance).toBeGreaterThan(350);
    expect(distance).toBeLessThan(370);
  });
});
