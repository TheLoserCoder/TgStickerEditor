/**
 * INotificationRepositoryWrapperFactory - интерфейс фабрики для оборачивания репозиториев
 */

export interface INotificationRepositoryWrapperFactory {
  wrap<T extends object>(repository: T, domainKey: string): T;
}
