import { createHash } from 'node:crypto';
import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, firstValueFrom, from } from 'rxjs';
import { IDEMPOTENCY_STORE, type IdempotencyStore } from '../../application/ports/idempotency-store';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(@Inject(IDEMPOTENCY_STORE) private readonly store: IdempotencyStore) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ method: string; headers: Record<string, unknown>; body: unknown }>();
    const key = request.headers['idempotency-key'];
    if (request.method !== 'POST' || typeof key !== 'string' || key.length === 0) {
      return next.handle();
    }
    const requestHash = createHash('sha256')
      .update(JSON.stringify(request.body ?? {}))
      .digest('hex');
    return from(this.replayOrExecute(key, requestHash, next));
  }

  private async replayOrExecute(key: string, requestHash: string, next: CallHandler) {
    const existing = await this.store.find(key);
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new ConflictException('idempotency_key_reuse');
      }
      return existing.body;
    }
    const result = await firstValueFrom(next.handle());
    await this.store.save(key, requestHash, result);
    return result;
  }
}
