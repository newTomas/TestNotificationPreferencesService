import { Channel, NotificationType } from './types';

export interface Preference {
  readonly notificationType: NotificationType;
  readonly channel: Channel;
  readonly enabled: boolean;
}

export type PreferenceSource = 'user' | 'default';

export interface EffectivePreference extends Preference {
  readonly source: PreferenceSource;
}

const key = (notificationType: NotificationType, channel: Channel) => `${notificationType}:${channel}`;

// Эффективные настройки = объединение дефолтов и оверрайдов; оверрайд пользователя перекрывает дефолт.
export function mergePreferences(
  defaults: readonly Preference[],
  overrides: readonly Preference[],
): EffectivePreference[] {
  const byKey = new Map<string, EffectivePreference>();
  for (const preference of defaults) {
    byKey.set(key(preference.notificationType, preference.channel), { ...preference, source: 'default' });
  }
  for (const override of overrides) {
    byKey.set(key(override.notificationType, override.channel), { ...override, source: 'user' });
  }
  return [...byKey.values()];
}
