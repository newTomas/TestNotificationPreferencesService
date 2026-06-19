import { Preference } from '../../domain/preferences';
import { QuietHours } from '../../domain/quiet-hours';

export interface PreferenceUpdate {
  readonly toggles: readonly Preference[];
  readonly quietHours?: QuietHours | null;
}

export interface PreferenceRepository {
  getOverrides(userId: string): Promise<Preference[]>;
  getQuietHours(userId: string): Promise<QuietHours | null>;
  applyUpdate(userId: string, update: PreferenceUpdate): Promise<void>;
}

export const PREFERENCE_REPOSITORY = Symbol('PreferenceRepository');
