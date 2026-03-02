/**
 * Фабрика для создания IPC wrapper'ов
 * Инкапсулирует логику обёртывания сервисов для IPC
 */

import { IPCRegistryWrapper } from '@/shared/domains/ipc/IPCRegistryWrapper';
import { IIPCServiceRegistry } from '@/shared/domains/ipc/interfaces/IIPCServiceRegistry';

export class IPCWrapperFactory {
  constructor(private registry: IIPCServiceRegistry) {}

  createWrapper(serviceName: string): IPCRegistryWrapper {
    return new IPCRegistryWrapper(this.registry, serviceName);
  }

  wrapService<T extends object>(service: T, serviceName: string): T {
    const wrapper = this.createWrapper(serviceName);
    return wrapper.wrap(service) as T;
  }
}
