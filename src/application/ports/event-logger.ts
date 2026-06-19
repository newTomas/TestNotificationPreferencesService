export interface EventLogger {
  event(name: string, data: Record<string, unknown>): void;
}

export const EVENT_LOGGER = Symbol('EventLogger');
