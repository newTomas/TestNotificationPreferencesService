import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import { InvalidQuietHoursError } from '../../src/domain/errors';
import { isWithinQuietHours, makeQuietHours } from '../../src/domain/quiet-hours';

const at = (iso: string) => DateTime.fromISO(iso, { zone: 'utc' });

describe('makeQuietHours', () => {
  it('создаёт валидное окно', () => {
    expect(makeQuietHours('22:00', '08:00', 'Europe/Berlin')).toEqual({
      start: '22:00',
      end: '08:00',
      timezone: 'Europe/Berlin',
    });
  });

  it('отвергает неверный формат времени', () => {
    expect(() => makeQuietHours('24:00', '08:00', 'UTC')).toThrow(InvalidQuietHoursError);
    expect(() => makeQuietHours('22:60', '08:00', 'UTC')).toThrow(InvalidQuietHoursError);
  });

  it('отвергает неизвестную таймзону', () => {
    expect(() => makeQuietHours('22:00', '08:00', 'Mars/Phobos')).toThrow(InvalidQuietHoursError);
  });
});

describe('isWithinQuietHours', () => {
  const overnight = makeQuietHours('22:00', '08:00', 'UTC');
  const daytime = makeQuietHours('09:00', '17:00', 'UTC');

  it('окно с переходом через полночь', () => {
    expect(isWithinQuietHours(at('2026-05-21T23:30:00Z'), overnight)).toBe(true);
    expect(isWithinQuietHours(at('2026-05-21T03:00:00Z'), overnight)).toBe(true);
    expect(isWithinQuietHours(at('2026-05-21T12:00:00Z'), overnight)).toBe(false);
  });

  it('границы окна полуоткрыты: start включён, end исключён', () => {
    expect(isWithinQuietHours(at('2026-05-21T22:00:00Z'), overnight)).toBe(true);
    expect(isWithinQuietHours(at('2026-05-21T07:59:00Z'), overnight)).toBe(true);
    expect(isWithinQuietHours(at('2026-05-21T08:00:00Z'), overnight)).toBe(false);
  });

  it('обычное дневное окно', () => {
    expect(isWithinQuietHours(at('2026-05-21T09:00:00Z'), daytime)).toBe(true);
    expect(isWithinQuietHours(at('2026-05-21T16:59:00Z'), daytime)).toBe(true);
    expect(isWithinQuietHours(at('2026-05-21T17:00:00Z'), daytime)).toBe(false);
    expect(isWithinQuietHours(at('2026-05-21T08:59:00Z'), daytime)).toBe(false);
  });

  it('пустое окно (start === end) никогда не активно', () => {
    const empty = makeQuietHours('22:00', '22:00', 'UTC');
    expect(isWithinQuietHours(at('2026-05-21T22:00:00Z'), empty)).toBe(false);
  });

  it('учитывает таймзону пользователя и переход через дату', () => {
    const tokyo = makeQuietHours('22:00', '08:00', 'Asia/Tokyo');
    expect(isWithinQuietHours(at('2026-05-21T15:00:00Z'), tokyo)).toBe(true); // 00:00 в Токио
    expect(isWithinQuietHours(at('2026-05-21T14:00:00Z'), tokyo)).toBe(true); // 23:00 в Токио
    expect(isWithinQuietHours(at('2026-05-21T05:00:00Z'), tokyo)).toBe(false); // 14:00 в Токио
  });

  it('корректен при весеннем переходе DST (Europe/Berlin)', () => {
    const berlin = makeQuietHours('22:00', '08:00', 'Europe/Berlin');
    // 2025-03-30 02:00 -> 03:00; момент 01:30Z попадает на 03:30 CEST — внутри окна.
    expect(isWithinQuietHours(at('2025-03-30T01:30:00Z'), berlin)).toBe(true);
  });

  it('корректен при осеннем переходе DST (двойные 02:30)', () => {
    const berlin = makeQuietHours('22:00', '08:00', 'Europe/Berlin');
    // 2025-10-26: 02:30 случается дважды (CEST=00:30Z и CET=01:30Z) — оба внутри окна.
    expect(isWithinQuietHours(at('2025-10-26T00:30:00Z'), berlin)).toBe(true);
    expect(isWithinQuietHours(at('2025-10-26T01:30:00Z'), berlin)).toBe(true);
  });
});
