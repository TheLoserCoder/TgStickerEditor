/**
 * LoggerWrapper - прокси для автоматического логирования вызовов методов
 * Оборачивает любой объект и логирует все вызовы его методов
 */

import { IServiceWrapper } from '../core/interfaces/IServiceWrapper';
import { ILogTransport } from './interfaces/ILogTransport';
import { LogEntry, LogLevel } from './types';

export class LoggerWrapper implements IServiceWrapper {
  constructor(private transport: ILogTransport) {}

  wrap<T extends object>(target: T): T {
    const className = target.constructor.name;

    return new Proxy(target, {
      get: (obj, prop) => {
        const original = obj[prop];

        if (typeof original !== 'function') {
          return original;
        }

        const methodName = String(prop);

        return (...args: any[]) => {
          this.log('debug', `${methodName} called`, className, methodName, { args });

          try {
            const result = original.apply(obj, args);

            if (result instanceof Promise) {
              return result
                .then((value) => {
                  this.log('debug', `${methodName} completed`, className, methodName);
                  return value;
                })
                .catch((error) => {
                  this.log('error', `${methodName} failed`, className, methodName, { error });
                  throw error;
                });
            }

            this.log('debug', `${methodName} completed`, className, methodName);
            return result;
          } catch (error) {
            this.log('error', `${methodName} failed`, className, methodName, { error });
            throw error;
          }
        };
      },
    });
  }

  private log(
    level: LogLevel,
    message: string,
    className: string,
    methodName: string,
    meta?: any
  ): void {
    const entry: LogEntry = {
      level,
      message: `[${className}] ${message}`,
      meta,
      timestamp: Date.now(),
      className,
      methodName,
    };

    this.transport.write(entry);
  }
}
