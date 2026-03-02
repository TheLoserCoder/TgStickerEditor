/**
 * Интерфейс транспорта для обработки ошибок
 * Реализации: IPCTransport (main), ReduxTransport (renderer)
 */

import { ErrorEntry } from '../types';

export interface IErrorTransport {
  handle(entry: ErrorEntry): void;
}
