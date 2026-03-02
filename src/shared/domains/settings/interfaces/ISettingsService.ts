import { AppSettings } from '../types';

export interface ISettingsService {
  get<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]>;
  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void>;
  getAll(): Promise<AppSettings>;
  reset(): Promise<void>;
  resetKey<K extends keyof AppSettings>(key: K): Promise<void>;
}
