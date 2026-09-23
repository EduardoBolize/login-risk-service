import { DeviceRepository } from '../devices/device.repository';

export class InMemoryDeviceRepository extends DeviceRepository {
  readonly devices = new Map<string, Set<string>>();

  async isKnown(userId: string, deviceId: string): Promise<boolean> {
    return this.devices.get(userId)?.has(deviceId) ?? false;
  }

  async countForUser(userId: string): Promise<number> {
    return this.devices.get(userId)?.size ?? 0;
  }

  async upsert(userId: string, deviceId: string): Promise<void> {
    const set = this.devices.get(userId) ?? new Set<string>();
    set.add(deviceId);
    this.devices.set(userId, set);
  }
}
