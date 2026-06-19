import { GlobalPolicy } from '../../domain/policy';

export interface PolicyRepository {
  findActive(): Promise<GlobalPolicy[]>;
}

export const POLICY_REPOSITORY = Symbol('PolicyRepository');
