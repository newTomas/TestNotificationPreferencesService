import { Inject, Injectable } from '@nestjs/common';
import { Preference } from '../../domain/preferences';
import { QuietHours } from '../../domain/quiet-hours';
import { EVENT_LOGGER, type EventLogger } from '../ports/event-logger';
import { METRICS, type Metrics } from '../ports/metrics';
import { PREFERENCE_REPOSITORY, type PreferenceRepository } from '../ports/preference.repository';

export interface UpdatePreferencesCommand {
  readonly toggles?: readonly Preference[];
  readonly quietHours?: QuietHours | null;
}

@Injectable()
export class UpdatePreferencesUseCase {
  constructor(
    @Inject(PREFERENCE_REPOSITORY) private readonly preferences: PreferenceRepository,
    @Inject(EVENT_LOGGER) private readonly logger: EventLogger,
    @Inject(METRICS) private readonly metrics: Metrics,
  ) {}

  async execute(userId: string, command: UpdatePreferencesCommand) {
    for (const toggle of command.toggles ?? []) {
      await this.preferences.upsertOverride(userId, toggle);
    }
    if (command.quietHours !== undefined) {
      await this.preferences.setQuietHours(userId, command.quietHours);
    }

    this.logger.event('preference_changed', {
      userId,
      toggles: command.toggles?.length ?? 0,
      quietHoursChanged: command.quietHours !== undefined,
    });
    this.metrics.recordPreferenceChange();
  }
}
