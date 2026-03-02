/**
 * IPCServiceRegistry - реестр сервисов в main процессе
 * Регистрирует сервисы и обрабатывает IPC вызовы из renderer
 */

import { ipcMain } from 'electron';
import { IIPCServiceRegistry } from '@/shared/domains/ipc/interfaces/IIPCServiceRegistry';
import { IPC_SERVICE_CHANNEL } from '@/shared/domains/ipc/constants';
import { ServiceCall, ServiceResponse, SerializedError } from '@/shared/domains/ipc/types';
import { IContainer } from '@/shared/domains/core/interfaces/IContainer';

export class IPCServiceRegistry implements IIPCServiceRegistry {
  private services = new Map<string, object>();

  constructor(private container?: IContainer) {
    this.setupIpcHandler();
  }

  register<T extends object>(serviceName: string, service: T): void {
    this.services.set(serviceName, service);
  }

  unregister(serviceName: string): void {
    this.services.delete(serviceName);
  }

  get<T extends object>(serviceName: string): T | undefined {
    return this.services.get(serviceName) as T | undefined;
  }

  has(serviceName: string): boolean {
    return this.services.has(serviceName);
  }

  private setupIpcHandler(): void {
    ipcMain.handle(IPC_SERVICE_CHANNEL, async (event, call: ServiceCall): Promise<ServiceResponse> => {
      try {
        let service = this.services.get(call.service);

        if (!service && this.container?.has(call.service)) {
          service = await this.container.resolve(call.service);
        }

        if (!service) {
          throw new Error(`Service "${call.service}" not registered`);
        }

        const method = (service as any)[call.method];

        if (typeof method !== 'function') {
          throw new Error(`Method "${call.method}" not found in service "${call.service}"`);
        }

        const result = await method.apply(service, call.args);

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          error: this.serializeError(error),
        };
      }
    });
  }

  private serializeError(error: any): SerializedError {
    return {
      name: error?.name || 'Error',
      message: error?.message || String(error),
      stack: error?.stack,
    };
  }
}
