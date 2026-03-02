/**
 * ServiceTransport - транспорт для отправки ошибок в ErrorService через IPC
 * Используется в renderer процессе
 */

import { IErrorTransport } from '@/shared/domains/error/interfaces/IErrorTransport';
import { IErrorService } from '@/shared/domains/error/interfaces/IErrorService';
import { ErrorEntry } from '@/shared/domains/error/types';
import { ServiceProxy } from '../../ipc/services/ServiceProxy';
import { ServiceName } from '@/shared/domains/ipc/enums';

export class ServiceTransport implements IErrorTransport {
  constructor(private serviceProxy: ServiceProxy) {}

  handle(entry: ErrorEntry): void {
    const errorService = this.serviceProxy.wrap<IErrorService>(ServiceName.ERROR_SERVICE);
    errorService.handle(entry);
  }
}
