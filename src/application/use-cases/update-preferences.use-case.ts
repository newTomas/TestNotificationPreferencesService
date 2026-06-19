import { Inject, Injectable } from '@nestjs/common';
import { UnknownNotificationTypeError } from '../../domain/errors';
import { Preference } from '../../domain/preferences';
import { QuietHours } from '../../domain/quiet-hours';
import { EVENT_LOGGER, type EventLogger } from '../ports/event-logger';
import { METRICS, type Metrics } from '../ports/metrics';
import { NOTIFICATION_CATALOG, type NotificationCatalog } from '../ports/notification-catalog';
import { PREFERENCE_REPOSITORY, type PreferenceRepository } from '../ports/preference.repository';

export interface UpdatePreferencesCommand {
  readonly toggles?: readonly Preference[];
  readonly quietHours?: QuietHours | null;
}

@Injectable()
export class UpdatePreferencesUseCase {
  constructor(
    @Inject(NOTIFICATION_CATALOG) private readonly catalog: NotificationCatalog,
    @Inject(PREFERENCE_REPOSITORY) private readonly preferences: PreferenceRepository,
    @Inject(EVENT_LOGGER) private readonly logger: EventLogger,
    @Inject(METRICS) private readonly metrics: Metrics,
  ) {}

  async execute(userId: string, command: UpdatePreferencesCommand) {
    const toggles = command.toggles ?? [];
    await this.assertKnownTypes(toggles);

    await this.preferences.applyUpdate(userId, {
      toggles,
      ...(command.quietHours !== undefined ? { quietHours: command.quietHours } : {}),
    });

    this.logger.event('preference_changed', {
      userId,
      toggles: toggles.length,
      quietHoursChanged: command.quietHours !== undefined,
    });
    this.metrics.recordPreferenceChange();
  }

  private async assertKnownTypes(toggles: readonly Preference[]) {
    if (toggles.length === 0) return;
    const known = new Set((await this.catalog.list()).map((definition) => definition.type));
    for (const toggle of toggles) {
      if (!known.has(toggle.notificationType)) {
        throw new UnknownNotificationTypeError(toggle.notificationType);
      }
    }
  }
}
