import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IdempotencyStore } from '../../application/ports/idempotency-store';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaIdempotencyStore implements IdempotencyStore {
  private readonly ttlHours: number;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.ttlHours = config.getOrThrow<number>('IDEMPOTENCY_TTL_HOURS');
  }

  async find(key: string) {
    const row = await this.prisma.idempotencyKey.findUnique({ where: { key } });
    if (!row) return null;
    if (row.expiresAt <= new Date()) {
      await this.prisma.idempotencyKey.deleteMany({ where: { key } });
      return null;
    }
    return { requestHash: row.requestHash, body: row.response };
  }

  async save(key: string, requestHash: string, body: unknown) {
    const expiresAt = new Date(Date.now() + this.ttlHours * 60 * 60 * 1000);
    await this.prisma.idempotencyKey.create({
      data: { key, requestHash, response: body ?? {}, expiresAt },
    });
  }
}
