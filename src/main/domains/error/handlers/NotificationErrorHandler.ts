/**
 * NotificationErrorHandler - обработчик для отправки уведомлений пользователю
 * Отправляет ошибки в renderer через IPC
 */

import { IErrorHandler } from '@/shared/domains/error/interfaces/IErrorHandler';
import { IIPCBridge } from '@/shared/domains/ipc/interfaces/IIPCBridge';
import { ErrorEntry } from '@/shared/domains/error/types';
import { IPCChannel } from '@/shared/domains/error/constants';

export class NotificationErrorHandler implements IErrorHandler {
  constructor(private ipcBridge: IIPCBridge) {}

  handle(entry: ErrorEntry): void {
    this.ipcBridge.send(IPCChannel.ERROR_SHOW, {
      message: entry.error.message,
      title: `Ошибка в ${entry.context.className}.${entry.context.methodName}`,
      severity: entry.severity,
      timestamp: entry.timestamp
    });
  }
}
