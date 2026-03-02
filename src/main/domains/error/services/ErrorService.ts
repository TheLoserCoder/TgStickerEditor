/**
 * ErrorService - централизованный сервис обработки ошибок
 * Принимает ошибки из разных источников и передает их обработчикам
 */

import { IErrorService } from '@/shared/domains/error/interfaces/IErrorService';
import { IErrorHandler } from '@/shared/domains/error/interfaces/IErrorHandler';
import { ErrorEntry } from '@/shared/domains/error/types';

export class ErrorService implements IErrorService {
  constructor(private handlers: IErrorHandler[]) {}

  handle(entry: ErrorEntry): void {
    this.handlers.forEach(handler => handler.handle(entry));
  }
}
