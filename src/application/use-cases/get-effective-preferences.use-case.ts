import { Inject, Injectable } from '@nestjs/common';
import { EffectivePreference, mergePreferences } from '../../domain/preferences';
import { QuietHours } from '../../domain/quiet-hours';
import { NotificationCategory } from '../../domain/types';
import {
  DEFAULT_PREFERENCE_REPOSITORY,
  type DefaultPreferenceRepository,
} from '../ports/default-preference.repository';
import { NOTIFICATION_CATALOG, type NotificationCatalog } from '../ports/notification-catalog';
import { PREFERENCE_REPOSITORY, type PreferenceRepository } from '../ports/preference.repository';

export interface EffectivePreferenceView extends EffectivePreference {
  readonly category: NotificationCategory;
}

export interface EffectivePreferencesView {
  readonly userId: string;
  readonly preferences: EffectivePreferenceView[];
  readonly quietHours: QuietHours | null;
}

@Injectable()
export class GetEffectivePreferencesUseCase {
  constructor(
    @Inject(DEFAULT_PREFERENCE_REPOSITORY) private readonly defaults: DefaultPreferenceRepository,
    @Inject(PREFERENCE_REPOSITORY) private readonly preferences: PreferenceRepository,
    @Inject(NOTIFICATION_CATALOG) private readonly catalog: NotificationCatalog,
  ) {}

  async execute(userId: string): Promise<EffectivePreferencesView> {
    const [defaults, overrides, quietHours, definitions] = await Promise.all([
      this.defaults.getAll(),
      this.preferences.getOverrides(userId),
      this.preferences.getQuietHours(userId),
      this.catalog.list(),
    ]);

    const categoryByType = new Map(definitions.map((definition) => [definition.type, definition.category]));
    const preferences = mergePreferences(defaults, overrides).flatMap((preference) => {
      const category = categoryByType.get(preference.notificationType);
      return category ? [{ ...preference, category }] : [];
    });

    return { userId, preferences, quietHours };
  }
}
