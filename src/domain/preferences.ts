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

// Эффективные настройки = дефолты, перекрытые индивидуальными настройками пользователя.
export function mergePreferences(
  defaults: readonly Preference[],
  overrides: readonly Preference[],
): EffectivePreference[] {
  const overrideByKey = new Map(overrides.map((o) => [key(o.notificationType, o.channel), o]));

  return defaults.map((preference) => {
    const override = overrideByKey.get(key(preference.notificationType, preference.channel));
    return {
      notificationType: preference.notificationType,
      channel: preference.channel,
      enabled: override ? override.enabled : preference.enabled,
      source: override ? 'user' : 'default',
    };
  });
}
