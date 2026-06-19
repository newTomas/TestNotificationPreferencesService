import { Injectable } from '@nestjs/common';
import type { DefaultPreferenceRepository } from '../../application/ports/default-preference.repository';
import { PrismaService } from '../prisma/prisma.service';
import { toPreference } from './mappers';

@Injectable()
export class PrismaDefaultPreferenceRepository implements DefaultPreferenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const rows = await this.prisma.defaultPreference.findMany();
    return rows.map(toPreference);
  }
}
