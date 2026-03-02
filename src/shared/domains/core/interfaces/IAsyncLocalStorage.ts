/**
 * IAsyncLocalStorage - интерфейс для работы с асинхронным локальным хранилищем контекста
 */

export interface IAsyncLocalStorage {
  run<T>(store: Map<string, any>, callback: () => T): T;
  getStore(): Map<string, any> | undefined;
}
