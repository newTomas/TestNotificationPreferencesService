import { Preference } from '../../domain/preferences';
import { QuietHours } from '../../domain/quiet-hours';

export interface PreferenceRepository {
  getOverrides(userId: string): Promise<Preference[]>;
  getQuietHours(userId: string): Promise<QuietHours | null>;
  upsertOverride(userId: string, preference: Preference): Promise<void>;
  setQuietHours(userId: string, quietHours: QuietHours | null): Promise<void>;
}

export const PREFERENCE_REPOSITORY = Symbol('PreferenceRepository');
