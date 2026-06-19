import { NotificationDefinition } from '../../domain/notification-definition';
import { GlobalPolicy, PolicyEffect } from '../../domain/policy';
import { Preference } from '../../domain/preferences';
import { Channel, NotificationCategory, Region, notificationType } from '../../domain/types';

export const toPreference = (row: {
  notificationType: string;
  channel: Channel;
  enabled: boolean;
}): Preference => ({
  notificationType: notificationType(row.notificationType),
  channel: row.channel,
  enabled: row.enabled,
});

export const toNotificationDefinition = (row: {
  type: string;
  category: NotificationCategory;
  suppressibleInQuietHours: boolean;
}): NotificationDefinition => ({
  type: notificationType(row.type),
  category: row.category,
  suppressibleInQuietHours: row.suppressibleInQuietHours,
});

export const toGlobalPolicy = (row: {
  id: string;
  effect: PolicyEffect;
  notificationType: string | null;
  channel: Channel | null;
  region: Region | null;
  priority: number;
}): GlobalPolicy => ({
  id: row.id,
  effect: row.effect,
  notificationType: row.notificationType ? notificationType(row.notificationType) : null,
  channel: row.channel,
  region: row.region,
  priority: row.priority,
});
