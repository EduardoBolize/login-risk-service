import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Abstract class doubles as the DI token so rules stay testable without a database. */
export abstract class DeviceRepository {
  abstract isKnown(userId: string, deviceId: string): Promise<boolean>;
  abstract countForUser(userId: string): Promise<number>;
  abstract upsert(userId: string, deviceId: string, seenAt: Date): Promise<void>;
}

@Injectable()
export class PrismaDeviceRepository extends DeviceRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isKnown(userId: string, deviceId: string): Promise<boolean> {
    const device = await this.prisma.userDevice.findUnique({
      where: { userId_deviceId: { userId, deviceId } },
      select: { id: true },
    });
    return device !== null;
  }

  countForUser(userId: string): Promise<number> {
    return this.prisma.userDevice.count({ where: { userId } });
  }

  async upsert(userId: string, deviceId: string, seenAt: Date): Promise<void> {
    await this.prisma.userDevice.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      create: { userId, deviceId, firstSeenAt: seenAt, lastSeenAt: seenAt },
      update: { lastSeenAt: seenAt },
    });
  }
}
