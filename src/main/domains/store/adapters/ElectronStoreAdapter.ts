/**
 * ElectronStoreAdapter - адаптер для electron-store
 * Оборачивает electron-store в интерфейс IStore
 */

import Store from 'electron-store';
import { IStore } from '@/shared/domains/store/interfaces/IStore';

export class ElectronStoreAdapter implements IStore {
  constructor(private electronStore: Store) {}

  get<T>(key: string): T | undefined {
    return this.electronStore.get(key) as T | undefined;
  }

  set<T>(key: string, value: T): void {
    this.electronStore.set(key, value);
  }

  delete(key: string): void {
    this.electronStore.delete(key);
  }

  has(key: string): boolean {
    return this.electronStore.has(key);
  }

  clear(): void {
    this.electronStore.clear();
  }
}
