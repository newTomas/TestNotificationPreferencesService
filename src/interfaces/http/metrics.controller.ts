import { Controller, Get, Header } from '@nestjs/common';
import { PrometheusMetrics } from '../../infrastructure/observability/prometheus-metrics';

@Controller()
export class MetricsController {
  constructor(private readonly metrics: PrometheusMetrics) {}

  @Get('metrics')
  @Header('content-type', 'text/plain; version=0.0.4; charset=utf-8')
  render() {
    return this.metrics.render();
  }
}
