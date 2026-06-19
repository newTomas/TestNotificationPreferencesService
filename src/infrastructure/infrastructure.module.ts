import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_PREFERENCE_REPOSITORY } from '../application/ports/default-preference.repository';
import { IDEMPOTENCY_STORE } from '../application/ports/idempotency-store';
import { NOTIFICATION_CATALOG } from '../application/ports/notification-catalog';
import { POLICY_REPOSITORY } from '../application/ports/policy.repository';
import { PREFERENCE_REPOSITORY } from '../application/ports/preference.repository';
import { PrismaService } from './prisma/prisma.service';
import { PrismaDefaultPreferenceRepository } from './repositories/prisma-default-preference.repository';
import { PrismaIdempotencyStore } from './repositories/prisma-idempotency.store';
import { PrismaNotificationCatalog } from './repositories/prisma-notification-catalog';
import { PrismaPolicyRepository } from './repositories/prisma-policy.repository';
import { PrismaPreferenceRepository } from './repositories/prisma-preference.repository';

@Module({
  providers: [
    {
      provide: PrismaService,
      useFactory: (config: ConfigService) => new PrismaService(config.getOrThrow<string>('DATABASE_URL')),
      inject: [ConfigService],
    },
    { provide: PREFERENCE_REPOSITORY, useClass: PrismaPreferenceRepository },
    { provide: DEFAULT_PREFERENCE_REPOSITORY, useClass: PrismaDefaultPreferenceRepository },
    { provide: POLICY_REPOSITORY, useClass: PrismaPolicyRepository },
    { provide: NOTIFICATION_CATALOG, useClass: PrismaNotificationCatalog },
    { provide: IDEMPOTENCY_STORE, useClass: PrismaIdempotencyStore },
  ],
  exports: [
    PrismaService,
    PREFERENCE_REPOSITORY,
    DEFAULT_PREFERENCE_REPOSITORY,
    POLICY_REPOSITORY,
    NOTIFICATION_CATALOG,
    IDEMPOTENCY_STORE,
  ],
})
export class InfrastructureModule {}
