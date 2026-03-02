export interface IStoreService {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  getAll(): Promise<Record<string, any>>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}
