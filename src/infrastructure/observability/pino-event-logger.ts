import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { EventLogger } from '../../application/ports/event-logger';

@Injectable()
export class PinoEventLogger implements EventLogger {
  constructor(private readonly logger: PinoLogger) {}

  event(name: string, data: Record<string, unknown>) {
    this.logger.info({ event: name, ...data }, name);
  }
}
