import { IServiceWrapper } from '../interfaces/IServiceWrapper';
import { IIPCServiceRegistry } from '../../../shared/domains/ipc/interfaces/IIPCServiceRegistry';

export class IPCRegistryWrapper implements IServiceWrapper {
  constructor(
    private registry: IIPCServiceRegistry,
    private serviceName: string
  ) {}

  wrap<T extends object>(service: T): T {
    this.registry.register(this.serviceName, service);
    return service;
  }
}
