export interface StoredResponse {
  readonly requestHash: string;
  readonly body: unknown;
}

export interface IdempotencyStore {
  find(key: string): Promise<StoredResponse | null>;
  save(key: string, requestHash: string, body: unknown): Promise<void>;
}

export const IDEMPOTENCY_STORE = Symbol('IdempotencyStore');
