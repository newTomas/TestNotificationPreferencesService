import { execSync } from 'node:child_process';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { EvaluateNotificationUseCase } from '../../src/application/use-cases/evaluate-notification.use-case';
import { GetEffectivePreferencesUseCase } from '../../src/application/use-cases/get-effective-preferences.use-case';
import { UpdatePreferencesUseCase } from '../../src/application/use-cases/update-preferences.use-case';
import { makeQuietHours } from '../../src/domain/quiet-hours';
import { notificationType } from '../../src/domain/types';
import { noopEventLogger, noopMetrics } from '../support/noop-observability';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { PrismaDefaultPreferenceRepository } from '../../src/infrastructure/repositories/prisma-default-preference.repository';
import { PrismaNotificationCatalog } from '../../src/infrastructure/repositories/prisma-notification-catalog';
import { PrismaPolicyRepository } from '../../src/infrastructure/repositories/prisma-policy.repository';
import { PrismaPreferenceRepository } from '../../src/infrastructure/repositories/prisma-preference.repository';

let container: StartedPostgreSqlContainer;
let prisma: PrismaService;
let evaluateNotification: EvaluateNotificationUseCase;
let getPreferences: GetEffectivePreferencesUseCase;
let updatePreferences: UpdatePreferencesUseCase;

const marketingEmail = notificationType('marketing_email');
const transactionalEmail = notificationType('transactional_email');

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:18').start();
  const databaseUrl = container.getConnectionUri();
  const env = { ...process.env, DATABASE_URL: databaseUrl };
  execSync('npx prisma migrate deploy', { env, stdio: 'inherit' });
  execSync('npx prisma db seed', { env, stdio: 'inherit' });

  prisma = new PrismaService(databaseUrl);
  const preferenceRepository = new PrismaPreferenceRepository(prisma);
  const defaultRepository = new PrismaDefaultPreferenceRepository(prisma);
  const policyRepository = new PrismaPolicyRepository(prisma);
  const catalog = new PrismaNotificationCatalog(prisma);

  evaluateNotification = new EvaluateNotificationUseCase(
    catalog,
    defaultRepository,
    preferenceRepository,
    policyRepository,
    noopEventLogger,
    noopMetrics,
  );
  getPreferences = new GetEffectivePreferencesUseCase(defaultRepository, preferenceRepository, catalog);
  updatePreferences = new UpdatePreferencesUseCase(catalog, preferenceRepository, noopEventLogger, noopMetrics);
});

afterAll(async () => {
  await prisma?.$disconnect();
  await container?.stop();
});

const find = (view: { preferences: { notificationType: string; channel: string; enabled: boolean }[] }, type: string) =>
  view.preferences.find((p) => p.notificationType === type && p.channel === 'email');

describe('persistence e2e', () => {
  it('новый пользователь получает дефолты', async () => {
    const view = await getPreferences.execute('e2e-defaults');
    expect(find(view, transactionalEmail)?.enabled).toBe(true);
    expect(find(view, marketingEmail)?.enabled).toBe(false);
  });

  it('отключение маркетинга идемпотентно и отражается в предпочтениях', async () => {
    const command = { toggles: [{ notificationType: marketingEmail, channel: 'email' as const, enabled: false }] };
    await updatePreferences.execute('e2e-user', command);
    await updatePreferences.execute('e2e-user', command);

    const overrides = await prisma.userPreferenceOverride.findMany({ where: { userId: 'e2e-user' } });
    expect(overrides).toHaveLength(1);

    const view = await getPreferences.execute('e2e-user');
    expect(find(view, marketingEmail)?.enabled).toBe(false);
    expect(find(view, transactionalEmail)?.enabled).toBe(true);
  });

  it('quiet hours блокируют marketing_push, транзакционные проходят', async () => {
    await updatePreferences.execute('e2e-quiet', {
      quietHours: makeQuietHours('22:00', '08:00', 'Europe/Berlin'),
    });

    const blocked = await evaluateNotification.execute({
      userId: 'e2e-quiet',
      notificationType: notificationType('marketing_push'),
      channel: 'push',
      region: 'US',
      datetime: '2026-05-21T21:30:00Z',
    });
    expect(blocked).toEqual({ decision: 'deny', reason: 'blocked_by_quiet_hours' });

    const allowed = await evaluateNotification.execute({
      userId: 'e2e-quiet',
      notificationType: transactionalEmail,
      channel: 'email',
      region: 'US',
      datetime: '2026-05-21T21:30:00Z',
    });
    expect(allowed.decision).toBe('allow');
  });

  it('seed-политика запрещает marketing_sms в EU', async () => {
    const decision = await evaluateNotification.execute({
      userId: 'e2e-policy',
      notificationType: notificationType('marketing_sms'),
      channel: 'sms',
      region: 'EU',
      datetime: '2026-05-21T12:00:00Z',
    });
    expect(decision).toEqual({ decision: 'deny', reason: 'blocked_by_global_policy' });
  });
});
