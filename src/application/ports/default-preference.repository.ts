import { Preference } from '../../domain/preferences';

export interface DefaultPreferenceRepository {
  getAll(): Promise<Preference[]>;
}

export const DEFAULT_PREFERENCE_REPOSITORY = Symbol('DefaultPreferenceRepository');
