/**
 * StoreService - сервис для управления постоянным хранилищем
 */

import { IStoreService } from '@/shared/domains/store/interfaces/IStoreService';
import { IStore } from '@/shared/domains/store/interfaces/IStore';

export class StoreService implements IStoreService {
  constructor(private store: IStore) {}

  get<T>(key: string): T | undefined {
    return this.store.get<T>(key);
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, value);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  clear(): void {
    this.store.clear();
  }

  getAll(): Record<string, any> {
    const store = this.store as any;
    return store.store || {};
  }
}
