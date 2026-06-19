import { setWorldConstructor } from '@cucumber/cucumber';
import { EvaluateNotificationUseCase } from '../../src/application/use-cases/evaluate-notification.use-case';
import {
  EffectivePreferencesView,
  GetEffectivePreferencesUseCase,
} from '../../src/application/use-cases/get-effective-preferences.use-case';
import { UpdatePreferencesUseCase } from '../../src/application/use-cases/update-preferences.use-case';
import { EvaluationResult } from '../../src/domain/evaluate';
import {
  DEFAULT_PREFERENCES_FIXTURE,
  NOTIFICATION_CATALOG_FIXTURE,
} from '../../test/support/catalog-fixture';
import {
  InMemoryDefaultPreferenceRepository,
  InMemoryNotificationCatalog,
  InMemoryPolicyRepository,
  InMemoryPreferenceRepository,
} from '../../test/support/in-memory-repositories';
import { noopEventLogger, noopMetrics } from '../../test/support/noop-observability';

export class PreferencesWorld {
  readonly catalog = new InMemoryNotificationCatalog(NOTIFICATION_CATALOG_FIXTURE);
  readonly defaults = new InMemoryDefaultPreferenceRepository(DEFAULT_PREFERENCES_FIXTURE);
  readonly preferences = new InMemoryPreferenceRepository();
  readonly policies = new InMemoryPolicyRepository();

  readonly getPreferences = new GetEffectivePreferencesUseCase(
    this.defaults,
    this.preferences,
    this.catalog,
  );
  readonly updatePreferences = new UpdatePreferencesUseCase(
    this.preferences,
    noopEventLogger,
    noopMetrics,
  );
  readonly evaluateNotification = new EvaluateNotificationUseCase(
    this.catalog,
    this.defaults,
    this.preferences,
    this.policies,
    noopEventLogger,
    noopMetrics,
  );

  view?: EffectivePreferencesView;
  decision?: EvaluationResult;
}

setWorldConstructor(PreferencesWorld);
