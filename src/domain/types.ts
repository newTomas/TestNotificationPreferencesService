export type Brand<T, B> = T & { readonly __brand: B };

export const CHANNELS = ['email', 'sms', 'push', 'messenger'] as const;
export type Channel = (typeof CHANNELS)[number];

export const REGIONS = ['EU', 'US', 'UK', 'APAC', 'OTHER'] as const;
export type Region = (typeof REGIONS)[number];

export const NOTIFICATION_CATEGORIES = ['transactional', 'marketing'] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export type NotificationType = Brand<string, 'NotificationType'>;

export type Decision = 'allow' | 'deny';

export const notificationType = (value: string) => value as NotificationType;

export const isChannel = (value: string): value is Channel =>
  (CHANNELS as readonly string[]).includes(value);

export const isRegion = (value: string): value is Region =>
  (REGIONS as readonly string[]).includes(value);
