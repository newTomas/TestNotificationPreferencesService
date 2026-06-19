export interface Metrics {
  recordDecision(decision: string, reason: string): void;
  recordPreferenceChange(): void;
}

export const METRICS = Symbol('Metrics');
