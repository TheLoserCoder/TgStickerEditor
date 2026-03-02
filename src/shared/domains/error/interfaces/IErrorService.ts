/**
 * Интерфейс сервиса обработки ошибок
 * Логирует ошибки и отправляет уведомления пользователю
 */

import { ErrorEntry } from '../types';

export interface IErrorService {
  handle(entry: ErrorEntry): void;
}
