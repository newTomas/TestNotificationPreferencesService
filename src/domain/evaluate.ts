import { DateTime } from 'luxon';
import { GlobalPolicy } from './policy';
import { QuietHours, isWithinQuietHours } from './quiet-hours';
import { ReasonCode } from './reason-code';
import { Decision } from './types';

export interface EvaluationContext {
  readonly defaultEnabled: boolean;
  readonly userEnabled: boolean | null;
  readonly suppressibleInQuietHours: boolean;
  readonly quietHours: QuietHours | null;
  readonly matchingPolicy: GlobalPolicy | null;
  readonly now: DateTime;
}

export interface EvaluationResult {
  readonly decision: Decision;
  readonly reason: ReasonCode;
}

const allow = (reason: ReasonCode): EvaluationResult => ({ decision: 'allow', reason });
const deny = (reason: ReasonCode): EvaluationResult => ({ decision: 'deny', reason });

export function evaluate(ctx: EvaluationContext): EvaluationResult {
  if (ctx.matchingPolicy) {
    return ctx.matchingPolicy.effect === 'deny'
      ? deny(ReasonCode.BLOCKED_BY_GLOBAL_POLICY)
      : allow(ReasonCode.ALLOWED_BY_GLOBAL_POLICY);
  }

  const fromUser = ctx.userEnabled !== null;
  const enabled = ctx.userEnabled ?? ctx.defaultEnabled;

  if (!enabled) {
    return deny(fromUser ? ReasonCode.DISABLED_BY_USER : ReasonCode.DISABLED_BY_DEFAULT);
  }

  if (ctx.suppressibleInQuietHours && ctx.quietHours && isWithinQuietHours(ctx.now, ctx.quietHours)) {
    return deny(ReasonCode.BLOCKED_BY_QUIET_HOURS);
  }

  return allow(fromUser ? ReasonCode.ALLOWED_BY_USER : ReasonCode.ALLOWED_BY_DEFAULT);
}
