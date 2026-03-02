/**
 * AsyncLocalStorageAdapter - адаптер для Node.js AsyncLocalStorage
 */

import { AsyncLocalStorage } from 'async_hooks';
import { IAsyncLocalStorage } from '@/shared/domains/core/interfaces/IAsyncLocalStorage';

export class AsyncLocalStorageAdapter implements IAsyncLocalStorage {
  private storage = new AsyncLocalStorage<Map<string, any>>();

  run<T>(store: Map<string, any>, callback: () => T): T {
    return this.storage.run(store, callback);
  }

  getStore(): Map<string, any> | undefined {
    return this.storage.getStore();
  }
}
