import { Injectable } from '@nestjs/common';
import type { PreferenceRepository } from '../../application/ports/preference.repository';
import { Preference } from '../../domain/preferences';
import { QuietHours } from '../../domain/quiet-hours';
import { PrismaService } from '../prisma/prisma.service';
import { toPreference } from './mappers';

@Injectable()
export class PrismaPreferenceRepository implements PreferenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getOverrides(userId: string) {
    const rows = await this.prisma.userPreferenceOverride.findMany({ where: { userId } });
    return rows.map(toPreference);
  }

  async getQuietHours(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.quietStart || !user.quietEnd || !user.quietTimezone) return null;
    return { start: user.quietStart, end: user.quietEnd, timezone: user.quietTimezone };
  }

  async upsertOverride(userId: string, preference: Preference) {
    await this.ensureUser(userId);
    await this.prisma.userPreferenceOverride.upsert({
      where: {
        userId_notificationType_channel: {
          userId,
          notificationType: preference.notificationType,
          channel: preference.channel,
        },
      },
      create: {
        userId,
        notificationType: preference.notificationType,
        channel: preference.channel,
        enabled: preference.enabled,
      },
      update: { enabled: preference.enabled },
    });
  }

  async setQuietHours(userId: string, quietHours: QuietHours | null) {
    const data = {
      quietStart: quietHours?.start ?? null,
      quietEnd: quietHours?.end ?? null,
      quietTimezone: quietHours?.timezone ?? null,
    };
    await this.prisma.user.upsert({ where: { id: userId }, create: { id: userId, ...data }, update: data });
  }

  private async ensureUser(userId: string) {
    await this.prisma.user.upsert({ where: { id: userId }, create: { id: userId }, update: {} });
  }
}
