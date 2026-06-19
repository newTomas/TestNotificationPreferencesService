import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const types = [
  { type: 'transactional_email', category: 'transactional', suppressibleInQuietHours: false },
  { type: 'marketing_email', category: 'marketing', suppressibleInQuietHours: true },
  { type: 'marketing_sms', category: 'marketing', suppressibleInQuietHours: true },
  { type: 'marketing_push', category: 'marketing', suppressibleInQuietHours: true },
] as const;

const defaults = [
  { notificationType: 'transactional_email', channel: 'email', enabled: true },
  { notificationType: 'marketing_email', channel: 'email', enabled: false },
  { notificationType: 'marketing_sms', channel: 'sms', enabled: true },
  { notificationType: 'marketing_push', channel: 'push', enabled: true },
] as const;

async function main() {
  for (const type of types) {
    await prisma.notificationType.upsert({ where: { type: type.type }, create: type, update: type });
  }

  for (const preference of defaults) {
    await prisma.defaultPreference.upsert({
      where: {
        notificationType_channel: {
          notificationType: preference.notificationType,
          channel: preference.channel,
        },
      },
      create: preference,
      update: { enabled: preference.enabled },
    });
  }

  await prisma.globalPolicy.upsert({
    where: { id: '11111111-1111-4111-8111-111111111111' },
    create: {
      id: '11111111-1111-4111-8111-111111111111',
      effect: 'deny',
      notificationType: 'marketing_sms',
      channel: 'sms',
      region: 'EU',
    },
    update: {},
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
