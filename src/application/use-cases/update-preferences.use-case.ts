import { Inject, Injectable } from '@nestjs/common';
import { Preference } from '../../domain/preferences';
import { QuietHours } from '../../domain/quiet-hours';
import { PREFERENCE_REPOSITORY, type PreferenceRepository } from '../ports/preference.repository';

export interface UpdatePreferencesCommand {
  readonly toggles?: readonly Preference[];
  readonly quietHours?: QuietHours | null;
}

@Injectable()
export class UpdatePreferencesUseCase {
  constructor(
    @Inject(PREFERENCE_REPOSITORY) private readonly preferences: PreferenceRepository,
  ) {}

  async execute(userId: string, command: UpdatePreferencesCommand): Promise<void> {
    for (const toggle of command.toggles ?? []) {
      await this.preferences.upsertOverride(userId, toggle);
    }
    if (command.quietHours !== undefined) {
      await this.preferences.setQuietHours(userId, command.quietHours);
    }
  }
}
