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
  const policy = ctx.matchingPolicy;
  if (policy?.effect === 'deny') {
    return deny(ReasonCode.BLOCKED_BY_GLOBAL_POLICY);
  }

  const fromUser = ctx.userEnabled !== null;

  // Явный опт-аут пользователя сильнее разрешающей политики; запрет (комплаенс) выше любого согласия.
  if (fromUser && !ctx.userEnabled) {
    return deny(ReasonCode.DISABLED_BY_USER);
  }

  if (policy?.effect === 'allow') {
    return allow(ReasonCode.ALLOWED_BY_GLOBAL_POLICY);
  }

  if (!(ctx.userEnabled ?? ctx.defaultEnabled)) {
    return deny(ReasonCode.DISABLED_BY_DEFAULT);
  }

  if (ctx.suppressibleInQuietHours && ctx.quietHours && isWithinQuietHours(ctx.now, ctx.quietHours)) {
    return deny(ReasonCode.BLOCKED_BY_QUIET_HOURS);
  }

  return allow(fromUser ? ReasonCode.ALLOWED_BY_USER : ReasonCode.ALLOWED_BY_DEFAULT);
}
