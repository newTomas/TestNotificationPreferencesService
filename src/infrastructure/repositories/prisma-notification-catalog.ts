import { Injectable } from '@nestjs/common';
import type { NotificationCatalog } from '../../application/ports/notification-catalog';
import { NotificationType } from '../../domain/types';
import { PrismaService } from '../prisma/prisma.service';
import { toNotificationDefinition } from './mappers';

@Injectable()
export class PrismaNotificationCatalog implements NotificationCatalog {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const rows = await this.prisma.notificationType.findMany();
    return rows.map(toNotificationDefinition);
  }

  async getDefinition(type: NotificationType) {
    const row = await this.prisma.notificationType.findUnique({ where: { type } });
    return row ? toNotificationDefinition(row) : null;
  }
}
