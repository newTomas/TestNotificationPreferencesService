import { NotificationCategory, NotificationType } from './types';

export interface NotificationDefinition {
  readonly type: NotificationType;
  readonly category: NotificationCategory;
  readonly suppressibleInQuietHours: boolean;
}
