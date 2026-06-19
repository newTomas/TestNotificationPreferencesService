import { Injectable } from '@nestjs/common';
import type { PreferenceRepository, PreferenceUpdate } from '../../application/ports/preference.repository';
import { QuietHours } from '../../domain/quiet-hours';
import { PrismaService } from '../prisma/prisma.service';
import { toPreference } from './mappers';

const quietColumns = (quietHours: QuietHours | null) => ({
  quietStart: quietHours?.start ?? null,
  quietEnd: quietHours?.end ?? null,
  quietTimezone: quietHours?.timezone ?? null,
});

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

  async applyUpdate(userId: string, update: PreferenceUpdate) {
    const changesQuietHours = 'quietHours' in update;
    if (update.toggles.length === 0 && !changesQuietHours) return;

    const userData = changesQuietHours ? quietColumns(update.quietHours ?? null) : {};
    await this.prisma.$transaction(async (tx) => {
      await tx.user.upsert({ where: { id: userId }, create: { id: userId, ...userData }, update: userData });
      for (const toggle of update.toggles) {
        await tx.userPreferenceOverride.upsert({
          where: {
            userId_notificationType_channel: {
              userId,
              notificationType: toggle.notificationType,
              channel: toggle.channel,
            },
          },
          create: {
            userId,
            notificationType: toggle.notificationType,
            channel: toggle.channel,
            enabled: toggle.enabled,
          },
          update: { enabled: toggle.enabled },
        });
      }
    });
  }
}
