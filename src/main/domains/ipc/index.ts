/**
 * IPC домен для main процесса
 */

export * from './services/IPCServiceRegistry';
export * from './services/IPCBridge';
export * from './services/IPCWrapperFactory';
export * from '../../../shared/domains/ipc';
export { IPC_BRIDGE_TOKEN, SERVICE_REGISTRY_TOKEN, IPC_WRAPPER_FACTORY_TOKEN } from './constants';

// Инициализация IPCBridge
import { BrowserWindow } from 'electron';
import { container } from '../core';
import { IPC_BRIDGE_TOKEN, SERVICE_REGISTRY_TOKEN, IPC_WRAPPER_FACTORY_TOKEN } from './constants';
import { IPCBridge } from './services/IPCBridge';
import { IPCServiceRegistry } from './services/IPCServiceRegistry';
import { IPCWrapperFactory } from './services/IPCWrapperFactory';
import { IIPCServiceRegistry } from '../../../shared/domains/ipc/interfaces/IIPCServiceRegistry';

// Регистрация IPCServiceRegistry
container.register(SERVICE_REGISTRY_TOKEN, () => {
  return new IPCServiceRegistry(container);
});

export function initializeIPCBridge(window: BrowserWindow): void {
  container.register(IPC_BRIDGE_TOKEN, () => {
    return new IPCBridge(window);
  });
}

// Регистрация IPCWrapperFactory
container.register(IPC_WRAPPER_FACTORY_TOKEN, async () => {
  const registry = await container.resolve<IIPCServiceRegistry>(SERVICE_REGISTRY_TOKEN);
  return new IPCWrapperFactory(registry);
});
