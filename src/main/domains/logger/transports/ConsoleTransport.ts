/**
 * ConsoleTransport - транспорт для вывода логов в консоль
 * Используется в main процессе
 */

import { ILogTransport } from '@/shared/domains/logger/interfaces/ILogTransport';
import { LogEntry } from '@/shared/domains/logger/types';
import { ConsoleMethod } from '@/shared/domains/logger/enums';

export class ConsoleTransport implements ILogTransport {
  write(entry: LogEntry): void {
    const consoleMethod = entry.level === 'error' ? ConsoleMethod.ERROR : 
                         entry.level === 'warn' ? ConsoleMethod.WARN : ConsoleMethod.LOG;
    
    console[consoleMethod](entry.message, entry.meta || '');
  }
}
