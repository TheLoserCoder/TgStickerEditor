/**
 * StoreSyncService - синхронизирует изменения данных с renderer через IPC
 */

import { IIPCBridge } from '@/shared/domains/ipc/interfaces/IIPCBridge';
import { IPCChannel } from '@/shared/domains/store/constants';
import { DataChangeNotifier } from './DataChangeNotifier';
import { DataChangeEvent } from '../enums';

export class StoreSyncService {
  constructor(
    private notifier: DataChangeNotifier,
    private ipcBridge: IIPCBridge
  ) {
    console.log('[StoreSyncService] Initializing...');
    this.setupListeners();
    console.log('[StoreSyncService] Listeners setup complete');
  }

  private setupListeners(): void {
    this.notifier.on(DataChangeEvent.CHANGE, ({ domain, data }) => {
      console.log('[StoreSyncService] CHANGE event received', { domain, data });
      this.ipcBridge.send(IPCChannel.DATA_UPDATE, { domain, data });
      console.log('[StoreSyncService] IPC message sent');
    });

    this.notifier.on(DataChangeEvent.CLEAR, () => {
      console.log('[StoreSyncService] CLEAR event received');
      this.ipcBridge.send(IPCChannel.DATA_UPDATE, { domain: '*', data: null });
    });
  }

  destroy(): void {
    this.notifier.removeAllListeners();
  }
}
