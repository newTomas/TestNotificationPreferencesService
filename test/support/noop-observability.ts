import { EventLogger } from '../../src/application/ports/event-logger';
import { Metrics } from '../../src/application/ports/metrics';

export const noopEventLogger: EventLogger = { event: () => undefined };

export const noopMetrics: Metrics = {
  recordDecision: () => undefined,
  recordPreferenceChange: () => undefined,
};
