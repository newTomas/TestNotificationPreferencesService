import { DefaultPreferenceRepository } from '../../src/application/ports/default-preference.repository';
import { NotificationCatalog } from '../../src/application/ports/notification-catalog';
import { PolicyRepository } from '../../src/application/ports/policy.repository';
import { PreferenceRepository, PreferenceUpdate } from '../../src/application/ports/preference.repository';
import { NotificationDefinition } from '../../src/domain/notification-definition';
import { GlobalPolicy } from '../../src/domain/policy';
import { Preference } from '../../src/domain/preferences';
import { QuietHours } from '../../src/domain/quiet-hours';
import { Channel, NotificationType } from '../../src/domain/types';

const overrideKey = (type: NotificationType, channel: Channel) => `${type}:${channel}`;

export class InMemoryDefaultPreferenceRepository implements DefaultPreferenceRepository {
  constructor(private readonly defaults: readonly Preference[] = []) {}

  async getAll() {
    return [...this.defaults];
  }
}

export class InMemoryNotificationCatalog implements NotificationCatalog {
  constructor(private readonly definitions: readonly NotificationDefinition[] = []) {}

  async list() {
    return [...this.definitions];
  }

  async getDefinition(type: NotificationType) {
    return this.definitions.find((definition) => definition.type === type) ?? null;
  }
}

export class InMemoryPolicyRepository implements PolicyRepository {
  private readonly policies: GlobalPolicy[] = [];

  async findActive() {
    return [...this.policies];
  }

  add(policy: GlobalPolicy) {
    this.policies.push(policy);
  }
}

export class InMemoryPreferenceRepository implements PreferenceRepository {
  private readonly overrides = new Map<string, Map<string, Preference>>();
  private readonly quietHours = new Map<string, QuietHours>();

  async getOverrides(userId: string) {
    return [...(this.overrides.get(userId)?.values() ?? [])];
  }

  async getQuietHours(userId: string) {
    return this.quietHours.get(userId) ?? null;
  }

  async applyUpdate(userId: string, update: PreferenceUpdate) {
    if (update.toggles.length > 0) {
      const byKey = this.overrides.get(userId) ?? new Map<string, Preference>();
      for (const toggle of update.toggles) {
        byKey.set(overrideKey(toggle.notificationType, toggle.channel), toggle);
      }
      this.overrides.set(userId, byKey);
    }
    if ('quietHours' in update) {
      const quietHours = update.quietHours ?? null;
      if (quietHours === null) {
        this.quietHours.delete(userId);
      } else {
        this.quietHours.set(userId, quietHours);
      }
    }
  }
}
