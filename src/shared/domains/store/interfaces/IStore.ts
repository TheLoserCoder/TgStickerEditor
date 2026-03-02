/**
 * Базовый интерфейс для хранилища
 * Может быть реализован через electron-store, localStorage и т.д.
 */

export interface IStore {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  delete(key: string): void;
  has(key: string): boolean;
  clear(): void;
}
