/**
 * NotificationRepositoryWrapperFactory - фабрика для оборачивания репозиториев уведомлениями
 */

import { INotificationRepositoryWrapperFactory } from './INotificationRepositoryWrapperFactory';
import { IDataChangeNotifier } from '@/shared/domains/core/interfaces/IDataChangeNotifier';
import { NotificationRepositoryWrapper } from './wrappers/NotificationRepositoryWrapper';

export class NotificationRepositoryWrapperFactory implements INotificationRepositoryWrapperFactory {
  constructor(private notifier: IDataChangeNotifier) {}

  wrap<T extends object>(repository: T, domainKey: string): T {
    return NotificationRepositoryWrapper.wrap(repository, this.notifier, domainKey);
  }
}
