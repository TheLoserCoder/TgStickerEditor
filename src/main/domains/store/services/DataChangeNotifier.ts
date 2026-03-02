/**
 * DataChangeNotifier - уведомляет об изменениях данных
 */

import { EventEmitter } from 'events';
import { IDataChangeNotifier } from '@/shared/domains/core/interfaces/IDataChangeNotifier';
import { IAsyncLocalStorage } from '@/shared/domains/core/interfaces/IAsyncLocalStorage';
import { DataChangeEvent } from '../enums';

export class DataChangeNotifier extends EventEmitter implements IDataChangeNotifier {
  constructor(private asyncLocalStorage: IAsyncLocalStorage) {
    super();
  }

  notifyChange(domain: string, data: any): void {
    const store = this.asyncLocalStorage.getStore();
    
    if (store) {
      store.set(domain, data);
      return;
    }
    
    console.log('[DataChangeNotifier] notifyChange called', { domain, data, listenerCount: this.listenerCount(DataChangeEvent.CHANGE) });
    this.emit(DataChangeEvent.CHANGE, { domain, data });
  }

  async notifyGroup<T>(actionType: string, callback: () => Promise<T | ((batch: Map<string, any>) => any)>): Promise<any> {
    const store = new Map<string, any>();
    
    const result = await this.asyncLocalStorage.run(store, callback);
    
    if (typeof result === 'function') {
      const customResult = result(store);
      this.emit(DataChangeEvent.CHANGE, { domain: actionType, data: customResult });
      return customResult;
    }
    
    if (store.size > 0) {
      const batchData = Object.fromEntries(store);
      this.emit(DataChangeEvent.CHANGE, { domain: actionType, data: batchData });
    }
    
    return result;
  }

  notifyClear(): void {
    console.log('[DataChangeNotifier] notifyClear called');
    this.emit(DataChangeEvent.CLEAR);
  }
}
