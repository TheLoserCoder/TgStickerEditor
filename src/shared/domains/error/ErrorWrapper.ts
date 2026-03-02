/**
 * ErrorWrapper - прокси для автоматического перехвата и обработки ошибок
 * Оборачивает любой объект и перехватывает ошибки в его методах
 */

import { IServiceWrapper } from '../core/interfaces/IServiceWrapper';
import { IErrorTransport } from './interfaces/IErrorTransport';
import { ErrorEntry, ErrorSeverity } from './types';

export class ErrorWrapper implements IServiceWrapper {
  constructor(
    private transport: IErrorTransport,
    private defaultSeverity: ErrorSeverity = 'error'
  ) {}

  wrap<T extends object>(target: T): T {
    const className = target.constructor.name;

    return new Proxy(target, {
      get: (obj, prop) => {
        const original = obj[prop];

        if (typeof original !== 'function') {
          return original;
        }

        const methodName = String(prop);

        return async (...args: any[]) => {
          try {
            return await original.apply(obj, args);
          } catch (error) {
            const entry: ErrorEntry = {
              error: error instanceof Error ? error : new Error(String(error)),
              context: {
                className,
                methodName,
                args
              },
              severity: this.defaultSeverity,
              timestamp: Date.now()
            };

            this.transport.handle(entry);

            throw error;
          }
        };
      },
    });
  }
}
