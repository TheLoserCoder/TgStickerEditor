/**
 * Core домен для main процесса
 */

import { container } from './Container';
import { AsyncLocalStorageAdapter } from './adapters/AsyncLocalStorageAdapter';
import { ASYNC_LOCAL_STORAGE_TOKEN, NOTIFICATION_REPOSITORY_WRAPPER_FACTORY_TOKEN } from './constants';
import { IAsyncLocalStorage } from '@/shared/domains/core/interfaces/IAsyncLocalStorage';
import { NotificationRepositoryWrapperFactory } from '../../factories/NotificationRepositoryWrapperFactory';
import { INotificationRepositoryWrapperFactory } from '../../factories/INotificationRepositoryWrapperFactory';
import { IDataChangeNotifier } from '@/shared/domains/core/interfaces/IDataChangeNotifier';
import { DATA_CHANGE_NOTIFIER_TOKEN } from '../store/constants';

container.register(ASYNC_LOCAL_STORAGE_TOKEN, () => {
  return new AsyncLocalStorageAdapter();
});

container.register(NOTIFICATION_REPOSITORY_WRAPPER_FACTORY_TOKEN, async () => {
  const notifier = await container.resolve<IDataChangeNotifier>(DATA_CHANGE_NOTIFIER_TOKEN);
  return new NotificationRepositoryWrapperFactory(notifier);
});

export { Container, container } from './Container';
export { MAIN_FACTORY_TOKEN, MAIN_SERVICE_FACTORY_TOKEN, ASYNC_LOCAL_STORAGE_TOKEN, NOTIFICATION_REPOSITORY_WRAPPER_FACTORY_TOKEN } from './constants';
export { BaseRepository } from './BaseRepository';
