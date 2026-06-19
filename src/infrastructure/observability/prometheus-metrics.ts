import { Injectable } from '@nestjs/common';
import { Counter, Registry } from 'prom-client';
import type { Metrics } from '../../application/ports/metrics';

@Injectable()
export class PrometheusMetrics implements Metrics {
  readonly registry = new Registry();

  private readonly decisions = new Counter({
    name: 'notification_decisions_total',
    help: 'Решения evaluate по decision и reason',
    labelNames: ['decision', 'reason'],
    registers: [this.registry],
  });

  private readonly changes = new Counter({
    name: 'preference_changes_total',
    help: 'Количество изменений предпочтений',
    registers: [this.registry],
  });

  recordDecision(decision: string, reason: string) {
    this.decisions.inc({ decision, reason });
  }

  recordPreferenceChange() {
    this.changes.inc();
  }

  render() {
    return this.registry.metrics();
  }

  get contentType() {
    return this.registry.contentType;
  }
}
