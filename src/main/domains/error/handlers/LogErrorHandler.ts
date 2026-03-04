/**
 * LogErrorHandler - обработчик для логирования ошибок
 * Отправляет ошибки в LoggerService
 */

import { IErrorHandler } from '@/shared/domains/error/interfaces/IErrorHandler';
import { ILoggerService } from '@/shared/domains/logger/interfaces/ILoggerService';
import { ErrorEntry } from '@/shared/domains/error/types';
import { LogLevel } from '@/shared/domains/logger/types';

export class LogErrorHandler implements IErrorHandler {
  constructor(private loggerService: ILoggerService) {}

  handle(entry: ErrorEntry): void {
    console.error(`[ErrorHandler] ${entry.context.className}.${entry.context.methodName}:`, entry.error);
    
    const logLevel: LogLevel = entry.severity === 'critical' || entry.severity === 'error' 
      ? 'error' 
      : entry.severity === 'warning' 
      ? 'warn' 
      : 'info';

    this.loggerService.log({
      level: logLevel,
      message: `[${entry.context.className}.${entry.context.methodName}] ${entry.error.message}`,
      meta: {
        error: {
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack
        },
        context: entry.context,
        severity: entry.severity
      },
      timestamp: entry.timestamp,
      className: entry.context.className,
      methodName: entry.context.methodName
    });
  }
}
