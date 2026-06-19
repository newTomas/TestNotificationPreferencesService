import { NotificationDefinition } from '../../src/domain/notification-definition';
import { Preference } from '../../src/domain/preferences';
import { notificationType } from '../../src/domain/types';

export const NOTIFICATION_CATALOG_FIXTURE: NotificationDefinition[] = [
  { type: notificationType('transactional_email'), category: 'transactional', suppressibleInQuietHours: false },
  { type: notificationType('marketing_email'), category: 'marketing', suppressibleInQuietHours: true },
  { type: notificationType('marketing_sms'), category: 'marketing', suppressibleInQuietHours: true },
  { type: notificationType('marketing_push'), category: 'marketing', suppressibleInQuietHours: true },
];

export const DEFAULT_PREFERENCES_FIXTURE: Preference[] = [
  { notificationType: notificationType('transactional_email'), channel: 'email', enabled: true },
  { notificationType: notificationType('marketing_email'), channel: 'email', enabled: false },
  { notificationType: notificationType('marketing_sms'), channel: 'sms', enabled: true },
  { notificationType: notificationType('marketing_push'), channel: 'push', enabled: true },
];
