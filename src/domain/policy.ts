import { Channel, NotificationType, Region } from './types';

export type PolicyEffect = 'allow' | 'deny';

export interface GlobalPolicy {
  readonly id: string;
  readonly effect: PolicyEffect;
  readonly notificationType: NotificationType | null;
  readonly channel: Channel | null;
  readonly region: Region | null;
  readonly priority: number;
}

export interface PolicyQuery {
  readonly notificationType: NotificationType;
  readonly channel: Channel;
  readonly region: Region;
}

export function matchesPolicy(policy: GlobalPolicy, query: PolicyQuery): boolean {
  return (
    (policy.notificationType === null || policy.notificationType === query.notificationType) &&
    (policy.channel === null || policy.channel === query.channel) &&
    (policy.region === null || policy.region === query.region)
  );
}

const specificity = (policy: GlobalPolicy) =>
  Number(policy.notificationType !== null) +
  Number(policy.channel !== null) +
  Number(policy.region !== null);

// Детерминированный выбор: deny важнее allow, затем priority, затем специфичность, затем id.
const outranks = (a: GlobalPolicy, b: GlobalPolicy) => {
  if (a.effect !== b.effect) return a.effect === 'deny';
  if (a.priority !== b.priority) return a.priority > b.priority;
  if (specificity(a) !== specificity(b)) return specificity(a) > specificity(b);
  return a.id < b.id;
};

export function resolvePolicy(
  policies: readonly GlobalPolicy[],
  query: PolicyQuery,
): GlobalPolicy | null {
  const matching = policies.filter((policy) => matchesPolicy(policy, query));
  if (matching.length === 0) return null;
  return matching.reduce((best, policy) => (outranks(policy, best) ? policy : best));
}
