export const ReasonCode = {
  ALLOWED_BY_USER: 'allowed_by_user',
  ALLOWED_BY_DEFAULT: 'allowed_by_default',
  ALLOWED_BY_GLOBAL_POLICY: 'allowed_by_global_policy',
  BLOCKED_BY_GLOBAL_POLICY: 'blocked_by_global_policy',
  DISABLED_BY_USER: 'disabled_by_user',
  DISABLED_BY_DEFAULT: 'disabled_by_default',
  BLOCKED_BY_QUIET_HOURS: 'blocked_by_quiet_hours',
} as const;

export type ReasonCode = (typeof ReasonCode)[keyof typeof ReasonCode];
