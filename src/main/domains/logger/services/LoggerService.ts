/**
 * LoggerService - централизованный сервис логирования с батчингом
 * Принимает логи из разных источников (main, renderer, workers)
 * Накапливает в буфер и периодически сбрасывает в транспорты
 */

import { ILoggerService } from '../../../../shared/domains/logger/interfaces/ILoggerService';
import { ILogTransport } from '../../../../shared/domains/logger/interfaces/ILogTransport';
import { LogEntry } from '../../../../shared/domains/logger/types';
import { BatchConfig } from '../constants';

export class LoggerService implements ILoggerService {
  private buffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(
    private transports: ILogTransport[],
    private batchSize: number = BatchConfig.BATCH_SIZE,
    private debounceTime: number = BatchConfig.DEBOUNCE_TIME
  ) {}

  log(entry: LogEntry): void {
    this.buffer.push(entry);

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    if (this.buffer.length >= this.batchSize) {
      this.flush();
    } else {
      this.flushTimer = setTimeout(() => this.flush(), this.debounceTime);
    }
  }

  flush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    }

    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    entries.forEach((entry) => {
      this.transports.forEach((transport) => transport.write(entry));
    });
  }

  destroy(): void {
    this.flush();
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
  }
}
