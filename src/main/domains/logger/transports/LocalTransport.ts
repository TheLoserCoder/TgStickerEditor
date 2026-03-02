/**
 * LocalTransport - транспорт для прямого вызова LoggerService из main процесса
 * Используется в main процессе для отправки логов в LoggerService
 */

import { ILogTransport } from '@/shared/domains/logger/interfaces/ILogTransport';
import { ILoggerService } from '@/shared/domains/logger/interfaces/ILoggerService';
import { LogEntry } from '@/shared/domains/logger/types';

export class LocalTransport implements ILogTransport {
  constructor(private loggerService: ILoggerService) {}

  write(entry: LogEntry): void {
    this.loggerService.log(entry);
  }
}
