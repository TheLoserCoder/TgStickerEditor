import { useMemo, useEffect } from 'react';
import { store } from './store';
import { StateManager } from './adapters/StateManager';
import { StoreSyncAdapter } from './adapters/StoreSyncAdapter';
import { IPCBridge } from '../ipc/services/IPCBridge';

let stateManagerInstance: StateManager | null = null;
let storeSyncAdapterInstance: StoreSyncAdapter | null = null;

export const useStateManager = (): StateManager => {
  const stateManager = useMemo(() => {
    if (!stateManagerInstance) {
      stateManagerInstance = new StateManager(store);
    }
    return stateManagerInstance;
  }, []);

  useEffect(() => {
    if (!storeSyncAdapterInstance) {
      const ipcBridge = new IPCBridge();
      storeSyncAdapterInstance = new StoreSyncAdapter(ipcBridge);
      storeSyncAdapterInstance.initialize();
    }
  }, [stateManager]);

  return stateManager;
};
