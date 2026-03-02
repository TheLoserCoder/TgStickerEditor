/**
 * IPCBridge - реализация IPC коммуникации для renderer процесса
 * Вызывает сервисы в main, отправляет и принимает события
 */

import { IIPCBridge } from '../../../shared/domains/ipc/interfaces/IIPCBridge';

export class IPCBridge implements IIPCBridge {
  invoke<T>(channel: string, data?: any): Promise<T> {
    return window.electron.ipc.invoke(channel, data);
  }

  send(channel: string, data?: any): void {
    window.electron.ipc.send(channel, data);
  }

  on<T>(channel: string, handler: (data: T) => void): void {
    window.electron.ipc.on(channel, (data: T) => {
      handler(data);
    });
  }

  off(channel: string, handler: Function): void {
    // preload не предоставляет off, но он возвращает unsubscribe функцию
  }
}
