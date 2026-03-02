/**
 * Интерфейс обработчика ошибок
 * Реализации: LogErrorHandler, NotificationErrorHandler
 */

import { ErrorEntry } from '../types';

export interface IErrorHandler {
  handle(entry: ErrorEntry): void;
}
