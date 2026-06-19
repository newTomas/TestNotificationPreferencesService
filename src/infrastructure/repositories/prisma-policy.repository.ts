import { Injectable } from '@nestjs/common';
import type { PolicyRepository } from '../../application/ports/policy.repository';
import { PrismaService } from '../prisma/prisma.service';
import { toGlobalPolicy } from './mappers';

@Injectable()
export class PrismaPolicyRepository implements PolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActive() {
    const rows = await this.prisma.globalPolicy.findMany({ where: { active: true } });
    return rows.map(toGlobalPolicy);
  }
}
