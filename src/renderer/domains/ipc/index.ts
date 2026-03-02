/**
 * IPC домен для renderer процесса
 */

import { IPCServiceProxy } from './services/IPCServiceProxy';

export * from './services/IPCServiceProxy';
export * from './services/IPCBridge';
export * from '../../../shared/domains/ipc';

export const ipcProxy = new IPCServiceProxy();
