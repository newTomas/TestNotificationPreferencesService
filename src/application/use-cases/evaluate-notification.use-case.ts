import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { EvaluationResult, evaluate } from '../../domain/evaluate';
import { UnknownNotificationTypeError } from '../../domain/errors';
import { resolvePolicy } from '../../domain/policy';
import { Preference } from '../../domain/preferences';
import { Channel, NotificationType, Region } from '../../domain/types';
import {
  DEFAULT_PREFERENCE_REPOSITORY,
  type DefaultPreferenceRepository,
} from '../ports/default-preference.repository';
import { EVENT_LOGGER, type EventLogger } from '../ports/event-logger';
import { METRICS, type Metrics } from '../ports/metrics';
import { NOTIFICATION_CATALOG, type NotificationCatalog } from '../ports/notification-catalog';
import { POLICY_REPOSITORY, type PolicyRepository } from '../ports/policy.repository';
import { PREFERENCE_REPOSITORY, type PreferenceRepository } from '../ports/preference.repository';

export interface EvaluateInput {
  readonly userId: string;
  readonly notificationType: NotificationType;
  readonly channel: Channel;
  readonly region: Region;
  readonly datetime: string;
}

@Injectable()
export class EvaluateNotificationUseCase {
  constructor(
    @Inject(NOTIFICATION_CATALOG) private readonly catalog: NotificationCatalog,
    @Inject(DEFAULT_PREFERENCE_REPOSITORY) private readonly defaults: DefaultPreferenceRepository,
    @Inject(PREFERENCE_REPOSITORY) private readonly preferences: PreferenceRepository,
    @Inject(POLICY_REPOSITORY) private readonly policies: PolicyRepository,
    @Inject(EVENT_LOGGER) private readonly logger: EventLogger,
    @Inject(METRICS) private readonly metrics: Metrics,
  ) {}

  async execute(input: EvaluateInput): Promise<EvaluationResult> {
    const definition = await this.catalog.getDefinition(input.notificationType);
    if (!definition) {
      throw new UnknownNotificationTypeError(input.notificationType);
    }

    const [defaults, overrides, quietHours, activePolicies] = await Promise.all([
      this.defaults.getAll(),
      this.preferences.getOverrides(input.userId),
      this.preferences.getQuietHours(input.userId),
      this.policies.findActive(),
    ]);

    const matches = (preference: Preference) =>
      preference.notificationType === input.notificationType && preference.channel === input.channel;
    const override = overrides.find(matches) ?? null;
    const defaultPreference = defaults.find(matches);

    const matchingPolicy = resolvePolicy(activePolicies, {
      notificationType: input.notificationType,
      channel: input.channel,
      region: input.region,
    });

    const result = evaluate({
      defaultEnabled: defaultPreference?.enabled ?? false,
      userEnabled: override ? override.enabled : null,
      suppressibleInQuietHours: definition.suppressibleInQuietHours,
      quietHours,
      matchingPolicy,
      now: DateTime.fromISO(input.datetime, { zone: 'utc' }),
    });

    this.logger.event('notification_decision', {
      userId: input.userId,
      notificationType: input.notificationType,
      channel: input.channel,
      region: input.region,
      decision: result.decision,
      reason: result.reason,
    });
    this.metrics.recordDecision(result.decision, result.reason);

    return result;
  }
}
