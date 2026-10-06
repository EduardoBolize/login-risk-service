import { Injectable } from '@nestjs/common';
import geoip from 'geoip-lite';

export interface GeoLocation {
  country: string;
  city?: string;
  lat: number;
  lon: number;
}

@Injectable()
export class GeoIpProvider {
  lookup(ip: string): GeoLocation | null {
    const result = geoip.lookup(ip);
    if (!result?.ll) {
      return null;
    }
    const [lat, lon] = result.ll;
    return { country: result.country, city: result.city || undefined, lat, lon };
  }
}
