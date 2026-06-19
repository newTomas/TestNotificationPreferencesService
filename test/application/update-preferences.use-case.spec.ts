import { describe, expect, it } from 'vitest';
import { UpdatePreferencesUseCase } from '../../src/application/use-cases/update-preferences.use-case';
import { UnknownNotificationTypeError } from '../../src/domain/errors';
import { notificationType } from '../../src/domain/types';
import { NOTIFICATION_CATALOG_FIXTURE } from '../support/catalog-fixture';
import {
  InMemoryNotificationCatalog,
  InMemoryPreferenceRepository,
} from '../support/in-memory-repositories';
import { noopEventLogger, noopMetrics } from '../support/noop-observability';

const makeUseCase = () => {
  const preferences = new InMemoryPreferenceRepository();
  const catalog = new InMemoryNotificationCatalog(NOTIFICATION_CATALOG_FIXTURE);
  const useCase = new UpdatePreferencesUseCase(catalog, preferences, noopEventLogger, noopMetrics);
  return { useCase, preferences };
};

describe('UpdatePreferencesUseCase', () => {
  it('отклоняет неизвестный тип уведомления и ничего не записывает', async () => {
    const { useCase, preferences } = makeUseCase();
    const command = {
      toggles: [{ notificationType: notificationType('does_not_exist'), channel: 'email' as const, enabled: false }],
    };

    await expect(useCase.execute('user-1', command)).rejects.toBeInstanceOf(UnknownNotificationTypeError);
    expect(await preferences.getOverrides('user-1')).toHaveLength(0);
  });

  it('применяет оверрайд для известного типа', async () => {
    const { useCase, preferences } = makeUseCase();
    await useCase.execute('user-1', {
      toggles: [{ notificationType: notificationType('marketing_email'), channel: 'email', enabled: false }],
    });

    expect(await preferences.getOverrides('user-1')).toHaveLength(1);
  });
});
