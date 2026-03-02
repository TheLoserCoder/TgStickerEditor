/**
 * Интерфейс сервиса логирования
 * Централизованный сервис для приема логов из разных источников с батчингом
 */

import { LogEntry } from '../types';

export interface ILoggerService {
  log(entry: LogEntry): void;
  flush(): void;
  destroy(): void;
}
