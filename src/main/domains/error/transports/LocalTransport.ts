/**
 * LocalTransport - транспорт для отправки ошибок в ErrorService из main процесса
 * Используется в main процессе
 */

import { IErrorTransport } from '@/shared/domains/error/interfaces/IErrorTransport';
import { IErrorService } from '@/shared/domains/error/interfaces/IErrorService';
import { ErrorEntry } from '@/shared/domains/error/types';

export class LocalTransport implements IErrorTransport {
  constructor(private errorService: IErrorService) {}

  handle(entry: ErrorEntry): void {
    this.errorService.handle(entry);
  }
}
