import { describe, expect, it } from 'vitest';
import { GlobalPolicy, PolicyQuery, matchesPolicy, resolvePolicy } from '../../src/domain/policy';
import { notificationType } from '../../src/domain/types';

const mktSms = notificationType('marketing_sms');

const policy = (over: Partial<GlobalPolicy>): GlobalPolicy => ({
  id: 'p',
  effect: 'deny',
  notificationType: null,
  channel: null,
  region: null,
  priority: 0,
  ...over,
});

const query: PolicyQuery = { notificationType: mktSms, channel: 'sms', region: 'EU' };

describe('matchesPolicy', () => {
  it('null в измерении означает wildcard', () => {
    expect(matchesPolicy(policy({ region: 'EU' }), query)).toBe(true);
    expect(matchesPolicy(policy({}), query)).toBe(true);
  });

  it('конкретное несовпадающее измерение не матчится', () => {
    expect(matchesPolicy(policy({ region: 'US' }), query)).toBe(false);
    expect(matchesPolicy(policy({ channel: 'email' }), query)).toBe(false);
  });
});

describe('resolvePolicy', () => {
  it('без совпадений возвращает null', () => {
    expect(resolvePolicy([policy({ region: 'US' })], query)).toBeNull();
  });

  it('deny важнее allow при равных прочих', () => {
    const allow = policy({ id: 'a', effect: 'allow', region: 'EU' });
    const deny = policy({ id: 'd', effect: 'deny', region: 'EU' });
    expect(resolvePolicy([allow, deny], query)?.id).toBe('d');
  });

  it('при равном effect выигрывает больший priority', () => {
    const low = policy({ id: 'low', region: 'EU', priority: 1 });
    const high = policy({ id: 'high', region: 'EU', priority: 5 });
    expect(resolvePolicy([low, high], query)?.id).toBe('high');
  });

  it('при равном priority выигрывает более специфичная', () => {
    const broad = policy({ id: 'broad' });
    const specific = policy({ id: 'specific', notificationType: mktSms, channel: 'sms', region: 'EU' });
    expect(resolvePolicy([broad, specific], query)?.id).toBe('specific');
  });
});
