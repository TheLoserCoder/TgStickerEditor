/**
 * Интерфейс для state manager в renderer
 * Может быть реализован через Redux, Zustand, MobX и т.д.
 */

export interface IStateManager {
  getState<T>(key: string): T | undefined;
  setState<T>(key: string, value: T): void;
  subscribe<T>(key: string, callback: (value: T) => void): () => void;
  getAll(): Record<string, any>;
  initialize(state: Record<string, any>): void;
}
