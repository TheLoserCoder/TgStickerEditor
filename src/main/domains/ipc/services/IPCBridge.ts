/**
 * IPCBridge - реализация IPC коммуникации для main процесса
 * Отправляет события в renderer, принимает события из renderer
 */

import { BrowserWindow, ipcMain } from 'electron';
import { IIPCBridge } from '../../../shared/domains/ipc/interfaces/IIPCBridge';

export class IPCBridge implements IIPCBridge {
  constructor(private window: BrowserWindow) {}

  invoke<T>(channel: string, data?: any): Promise<T> {
    throw new Error('Main process cannot invoke renderer');
  }

  send(channel: string, data?: any): void {
    console.log('[IPCBridge] Sending to renderer', { channel, data });
    this.window.webContents.send(channel, data);
  }

  on<T>(channel: string, handler: (data: T) => void): void {
    ipcMain.on(channel, (event, data) => handler(data));
  }

  off(channel: string, handler: Function): void {
    ipcMain.off(channel, handler as any);
  }
}
