import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { makeQuietHours } from '../../src/domain/quiet-hours';
import { Channel, Region, notificationType } from '../../src/domain/types';
import { PreferencesWorld } from './world';

Given('новый пользователь {string}', function (_userId: string) {
  // Пользователь создаётся лениво при первом изменении настроек.
});

Given(
  'пользователь {string} задаёт тихие часы с {string} до {string} в таймзоне {string}',
  async function (this: PreferencesWorld, userId: string, start: string, end: string, timezone: string) {
    await this.updatePreferences.execute(userId, {
      quietHours: makeQuietHours(start, end, timezone),
    });
  },
);

Given(
  'действует политика запрета {string} по каналу {string} в регионе {string}',
  function (this: PreferencesWorld, type: string, channel: string, region: string) {
    this.policies.add({
      id: `deny-${type}-${channel}-${region}`,
      effect: 'deny',
      notificationType: notificationType(type),
      channel: channel as Channel,
      region: region as Region,
      priority: 0,
    });
  },
);

When(
  'пользователь {string} отключает {string} по каналу {string}',
  async function (this: PreferencesWorld, userId: string, type: string, channel: string) {
    await this.updatePreferences.execute(userId, {
      toggles: [{ notificationType: notificationType(type), channel: channel as Channel, enabled: false }],
    });
  },
);

When(
  'мы запрашиваем предпочтения пользователя {string}',
  async function (this: PreferencesWorld, userId: string) {
    this.view = await this.getPreferences.execute(userId);
  },
);

When(
  'мы проверяем отправку {string} по каналу {string} в регионе {string} в момент {string}',
  async function (this: PreferencesWorld, type: string, channel: string, region: string, datetime: string) {
    this.decision = await this.evaluateNotification.execute({
      userId: 'user-1',
      notificationType: notificationType(type),
      channel: channel as Channel,
      region: region as Region,
      datetime,
    });
  },
);

Then(
  'канал {string} типа {string} включён',
  function (this: PreferencesWorld, channel: string, type: string) {
    const preference = this.view?.preferences.find(
      (p) => p.notificationType === notificationType(type) && p.channel === channel,
    );
    assert.equal(preference?.enabled, true);
  },
);

Then(
  'канал {string} типа {string} выключен',
  function (this: PreferencesWorld, channel: string, type: string) {
    const preference = this.view?.preferences.find(
      (p) => p.notificationType === notificationType(type) && p.channel === channel,
    );
    assert.equal(preference?.enabled, false);
  },
);

Then(
  'решение {string} с причиной {string}',
  function (this: PreferencesWorld, decision: string, reason: string) {
    assert.equal(this.decision?.decision, decision);
    assert.equal(this.decision?.reason, reason);
  },
);

Then('решение {string}', function (this: PreferencesWorld, decision: string) {
  assert.equal(this.decision?.decision, decision);
});

Then(
  'ровно один оверрайд сохранён для пользователя {string}',
  async function (this: PreferencesWorld, userId: string) {
    const overrides = await this.preferences.getOverrides(userId);
    assert.equal(overrides.length, 1);
  },
);
