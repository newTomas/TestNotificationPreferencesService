import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import { EvaluationContext, evaluate } from '../../src/domain/evaluate';
import { GlobalPolicy } from '../../src/domain/policy';
import { makeQuietHours } from '../../src/domain/quiet-hours';
import { ReasonCode } from '../../src/domain/reason-code';

const base: EvaluationContext = {
  defaultEnabled: true,
  userEnabled: null,
  suppressibleInQuietHours: false,
  quietHours: null,
  matchingPolicy: null,
  now: DateTime.fromISO('2026-05-21T12:00:00Z', { zone: 'utc' }),
};

const ctx = (over: Partial<EvaluationContext>): EvaluationContext => ({ ...base, ...over });

const denyPolicy: GlobalPolicy = {
  id: 'eu',
  effect: 'deny',
  notificationType: null,
  channel: null,
  region: 'EU',
  priority: 0,
};

const quietNight = makeQuietHours('22:00', '08:00', 'Europe/Berlin');
const insideQuiet = DateTime.fromISO('2026-05-21T21:30:00Z', { zone: 'utc' }); // 23:30 в Берлине

describe('evaluate', () => {
  it('новый пользователь: дефолт включён -> allow', () => {
    expect(evaluate(base)).toEqual({
      decision: 'allow',
      reason: ReasonCode.ALLOWED_BY_DEFAULT,
    });
  });

  it('новый пользователь: дефолт выключен -> deny', () => {
    expect(evaluate(ctx({ defaultEnabled: false }))).toEqual({
      decision: 'deny',
      reason: ReasonCode.DISABLED_BY_DEFAULT,
    });
  });

  it('пользователь отключил тип -> deny by user', () => {
    expect(evaluate(ctx({ userEnabled: false }))).toEqual({
      decision: 'deny',
      reason: ReasonCode.DISABLED_BY_USER,
    });
  });

  it('пользователь включил тип -> allow by user', () => {
    expect(evaluate(ctx({ defaultEnabled: false, userEnabled: true }))).toEqual({
      decision: 'allow',
      reason: ReasonCode.ALLOWED_BY_USER,
    });
  });

  it('quiet hours блокируют подавляемые уведомления', () => {
    expect(
      evaluate(ctx({ suppressibleInQuietHours: true, quietHours: quietNight, now: insideQuiet })),
    ).toEqual({ decision: 'deny', reason: ReasonCode.BLOCKED_BY_QUIET_HOURS });
  });

  it('quiet hours не блокируют неподавляемые (транзакционные)', () => {
    expect(
      evaluate(ctx({ suppressibleInQuietHours: false, quietHours: quietNight, now: insideQuiet })),
    ).toEqual({ decision: 'allow', reason: ReasonCode.ALLOWED_BY_DEFAULT });
  });

  it('глобальная deny-политика -> deny', () => {
    expect(evaluate(ctx({ matchingPolicy: denyPolicy }))).toEqual({
      decision: 'deny',
      reason: ReasonCode.BLOCKED_BY_GLOBAL_POLICY,
    });
  });

  it('глобальная deny-политика перекрывает явное согласие пользователя', () => {
    expect(evaluate(ctx({ userEnabled: true, matchingPolicy: denyPolicy }))).toEqual({
      decision: 'deny',
      reason: ReasonCode.BLOCKED_BY_GLOBAL_POLICY,
    });
  });

  it('глобальная allow-политика -> allow', () => {
    const allowPolicy: GlobalPolicy = { ...denyPolicy, id: 'exempt', effect: 'allow' };
    expect(evaluate(ctx({ userEnabled: false, matchingPolicy: allowPolicy }))).toEqual({
      decision: 'allow',
      reason: ReasonCode.ALLOWED_BY_GLOBAL_POLICY,
    });
  });

  it('выключенный по умолчанию маркетинг в quiet hours -> disabled_by_default (приоритет выше quiet)', () => {
    expect(
      evaluate(
        ctx({
          suppressibleInQuietHours: true,
          defaultEnabled: false,
          quietHours: quietNight,
          now: insideQuiet,
        }),
      ),
    ).toEqual({ decision: 'deny', reason: ReasonCode.DISABLED_BY_DEFAULT });
  });
});
