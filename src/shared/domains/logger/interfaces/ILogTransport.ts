/**
 * Интерфейс транспорта для записи логов
 * Реализации: FileTransport (main), IPCTransport (renderer)
 */

import { LogEntry } from '../types';

export interface ILogTransport {
  write(entry: LogEntry): void;
}
