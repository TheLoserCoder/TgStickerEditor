/**
 * StoreSyncAdapter - адаптер для синхронизации изменений через IPC
 * Слушает IPC уведомления и диспатчит соответствующие Redux actions
 */

import { IIPCBridge } from '@/shared/domains/ipc/interfaces/IIPCBridge';
import { IPCChannel } from '@/shared/domains/store/constants';
import { SLICE_REGISTRY } from '../sliceRegistry';
import { store } from '../store';

export class StoreSyncAdapter {
  constructor(private ipcBridge: IIPCBridge) {}

  initialize(): void {
    this.ipcBridge.on(IPCChannel.DATA_UPDATE, this.handleDataUpdate);
  }

  private handleDataUpdate = ({ domain, data }: { domain: string; data: any }): void => {
    const [domainName, method] = domain.split(':');
    
    const slice = SLICE_REGISTRY[domainName];
    if (!slice) {
      return;
    }

    const action = slice[method as keyof typeof slice];
    if (!action) {
      return;
    }

    if (method === 'delete') {
      store.dispatch(action(data.id || data));
    } else {
      store.dispatch(action(data));
    }
  };

  destroy(): void {
    this.ipcBridge.off(IPCChannel.DATA_UPDATE, this.handleDataUpdate);
  }
}
