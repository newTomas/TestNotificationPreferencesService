import { DateTime, IANAZone } from 'luxon';
import { InvalidQuietHoursError } from './errors';

export interface QuietHours {
  readonly start: string;
  readonly end: string;
  readonly timezone: string;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function makeQuietHours(start: string, end: string, timezone: string): QuietHours {
  if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(end)) {
    throw new InvalidQuietHoursError(`Invalid quiet hours time: ${start}-${end}`);
  }
  if (!IANAZone.isValidZone(timezone)) {
    throw new InvalidQuietHoursError(`Invalid timezone: ${timezone}`);
  }
  return { start, end, timezone };
}

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
};

// Сравниваем минуты дня в таймзоне пользователя: безопасно к DST и к переходу через полночь.
export function isWithinQuietHours(instant: DateTime, quietHours: QuietHours): boolean {
  const local = instant.setZone(quietHours.timezone);
  const now = local.hour * 60 + local.minute;
  const start = toMinutes(quietHours.start);
  const end = toMinutes(quietHours.end);

  if (start === end) return false;
  if (start < end) return now >= start && now < end;
  return now >= start || now < end;
}
