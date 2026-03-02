/**
 * Store домен для main процесса
 */

export * from './adapters/ElectronStoreAdapter';
export * from './services/StoreService';
export * from './services/DataChangeNotifier';
export * from './services/StoreSyncService';
export { STORE_SERVICE_TOKEN, DATA_CHANGE_NOTIFIER_TOKEN, STORE_SYNC_SERVICE_TOKEN } from './constants';

import Store from 'electron-store';
import { container } from '../core';
import { STORE_SERVICE_TOKEN, DATA_CHANGE_NOTIFIER_TOKEN } from './constants';
import { ASYNC_LOCAL_STORAGE_TOKEN } from '../core/constants';
import { ElectronStoreAdapter } from './adapters/ElectronStoreAdapter';
import { StoreService } from './services/StoreService';
import { DataChangeNotifier } from './services/DataChangeNotifier';
import { getMainServiceFactory } from '../../factories/mainFactory';
import { IAsyncLocalStorage } from '../../../shared/domains/core/interfaces/IAsyncLocalStorage';

container.register(DATA_CHANGE_NOTIFIER_TOKEN, async () => {
  const asyncLocalStorage = await container.resolve<IAsyncLocalStorage>(ASYNC_LOCAL_STORAGE_TOKEN);
  return new DataChangeNotifier(asyncLocalStorage);
});

container.register(STORE_SERVICE_TOKEN, async () => {
  const factory = await getMainServiceFactory();
  const StoreClass = (Store as any).default || Store;
  const store = new ElectronStoreAdapter(new StoreClass());
  const service = new StoreService(store);

  return factory.createInternal(service);
});
