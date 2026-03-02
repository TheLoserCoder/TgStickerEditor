/**
 * Фабрика для создания сервисов main процесса
 * Композирует базовую ServiceFactory (logger, error) и IPC wrapper
 */

import { ServiceFactory } from '@/shared/domains/core';
import { IPCWrapperFactory } from '../domains/ipc/services/IPCWrapperFactory';

export class MainServiceFactory {
  constructor(
    private baseFactory: ServiceFactory,
    private ipcWrapper: IPCWrapperFactory
  ) {}

  /**
   * Создаёт сервис с полным набором wrapper'ов (logger, error, IPC)
   */
  createService<T extends object>(instance: T, serviceName: string): T {
    // Базовое декорирование (logger, error)
    const wrapped = this.baseFactory.create(instance);
    
    // IPC wrapper
    return this.ipcWrapper.wrapService(wrapped, serviceName);
  }

  /**
   * Создаёт сервис без IPC wrapper'а (для внутренних сервисов)
   */
  createInternal<T extends object>(instance: T): T {
    return this.baseFactory.create(instance);
  }
}
