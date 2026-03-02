/**
 * IPCServiceProxy - прокси для вызова сервисов из renderer процесса
 * Автоматически преобразует вызовы методов в IPC запросы
 */

import { IServiceWrapper } from '@/shared/domains/core/interfaces/IServiceWrapper';
import { IPC_SERVICE_CHANNEL } from '@/shared/domains/ipc/constants';
import { ServiceCall, ServiceResponse } from '@/shared/domains/ipc/types';
import { ErrorName } from '@/shared/domains/ipc/enums';

export class IPCServiceProxy implements IServiceWrapper {
  wrap<T extends object>(serviceName: string): T {
    return new Proxy({} as T, {
      get: (target, method: string) => {
        return async (...args: any[]) => {
          const call: ServiceCall = {
            service: serviceName,
            method,
            args,
          };

          const response: ServiceResponse = await window.electron.ipc.invoke(IPC_SERVICE_CHANNEL, call);

          if (!response.success) {
            const error = new Error(response.error?.message || ErrorName.UNKNOWN_ERROR);
            error.name = response.error?.name || ErrorName.ERROR;
            if (response.error?.stack) {
              error.stack = response.error.stack;
            }
            throw error;
          }

          return response.data;
        };
      },
    });
  }
}
