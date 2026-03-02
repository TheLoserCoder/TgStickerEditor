/**
 * IPCTransport - транспорт для отправки логов в main процесс через IPC
 * Используется в renderer процессе
 */

import { ILogTransport } from '@/shared/domains/logger/interfaces/ILogTransport';
import { ILoggerService } from '@/shared/domains/logger/interfaces/ILoggerService';
import { LogEntry } from '@/shared/domains/logger/types';
import { IPCServiceProxy } from '../../ipc/services/IPCServiceProxy';
import { ConsoleMethod } from '@/shared/domains/logger/enums';
import { ServiceName } from '@/shared/domains/ipc/enums';

export class IPCTransport implements ILogTransport {
  constructor(private ipcProxy: IPCServiceProxy) {}

  write(entry: LogEntry): void {
    const loggerService = this.ipcProxy.wrap<ILoggerService>(ServiceName.LOGGER_SERVICE);
    loggerService.log(entry);

    const consoleMethod = entry.level === 'error' ? ConsoleMethod.ERROR : 
                         entry.level === 'warn' ? ConsoleMethod.WARN : ConsoleMethod.LOG;
    console[consoleMethod](`[Renderer] ${entry.message}`, entry.meta || '');
  }
}
