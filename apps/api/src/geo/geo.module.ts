import { Module } from '@nestjs/common';
import { GeoIpLiteProvider, GeoIpProvider } from './geo-ip.provider';

@Module({
  providers: [{ provide: GeoIpProvider, useClass: GeoIpLiteProvider }],
  exports: [GeoIpProvider],
})
export class GeoModule {}
