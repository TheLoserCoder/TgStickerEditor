/**
 * EventEmitterTransport - транспорт для отправки ошибок через EventEmitter
 * Используется в renderer процессе для разрыва циклической зависимости
 */

import { EventEmitter } from 'events';
import { IErrorTransport } from '@/shared/domains/error/interfaces/IErrorTransport';
import { ErrorEntry } from '@/shared/domains/error/types';
import { EventName } from '@/shared/domains/error/enums';

export class EventEmitterTransport implements IErrorTransport {
  constructor(private eventEmitter: EventEmitter) {}

  handle(entry: ErrorEntry): void {
    this.eventEmitter.emit(EventName.ERROR, entry);
  }
}
