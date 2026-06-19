import { describe, expect, it } from 'vitest';
import { Preference, mergePreferences } from '../../src/domain/preferences';
import { notificationType } from '../../src/domain/types';

const txEmail = notificationType('transactional_email');
const mktEmail = notificationType('marketing_email');

const defaults: Preference[] = [
  { notificationType: txEmail, channel: 'email', enabled: true },
  { notificationType: mktEmail, channel: 'email', enabled: false },
];

describe('mergePreferences', () => {
  it('без оверрайдов возвращает дефолты с source=default', () => {
    expect(mergePreferences(defaults, [])).toEqual([
      { notificationType: txEmail, channel: 'email', enabled: true, source: 'default' },
      { notificationType: mktEmail, channel: 'email', enabled: false, source: 'default' },
    ]);
  });

  it('оверрайд пользователя перекрывает дефолт и помечается source=user', () => {
    const merged = mergePreferences(defaults, [
      { notificationType: mktEmail, channel: 'email', enabled: true },
    ]);

    expect(merged).toContainEqual({
      notificationType: mktEmail,
      channel: 'email',
      enabled: true,
      source: 'user',
    });
    expect(merged).toContainEqual({
      notificationType: txEmail,
      channel: 'email',
      enabled: true,
      source: 'default',
    });
  });

  it('оверрайд может выключить включённый по умолчанию канал', () => {
    const merged = mergePreferences(defaults, [
      { notificationType: txEmail, channel: 'email', enabled: false },
    ]);

    expect(merged).toContainEqual({
      notificationType: txEmail,
      channel: 'email',
      enabled: false,
      source: 'user',
    });
  });
});
