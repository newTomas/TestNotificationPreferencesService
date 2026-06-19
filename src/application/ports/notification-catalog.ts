import { NotificationDefinition } from '../../domain/notification-definition';
import { NotificationType } from '../../domain/types';

export interface NotificationCatalog {
  list(): Promise<NotificationDefinition[]>;
  getDefinition(type: NotificationType): Promise<NotificationDefinition | null>;
}

export const NOTIFICATION_CATALOG = Symbol('NotificationCatalog');
