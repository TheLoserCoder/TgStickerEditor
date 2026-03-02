/**
 * Фабрика для main процесса
 * Создаёт ServiceFactory с wrapper'ами на основе конфигурации
 */

import { ServiceFactory } from '@/shared/domains/core';
import { WRAPPER_REGISTRY, WrapperType, FactoryServices } from './wrapperRegistry';
import { MainServiceFactory } from './MainServiceFactory';
import { container } from '../domains/core';
import { LOGGER_SERVICE_TOKEN } from '../domains/logger/constants';
import { ERROR_SERVICE_TOKEN } from '../domains/error/constants';
import { IPC_WRAPPER_FACTORY_TOKEN } from '../domains/ipc/constants';
import { ILoggerService } from '@/shared/domains/logger/interfaces/ILoggerService';
import { IErrorService } from '@/shared/domains/error/interfaces/IErrorService';
import { IPCWrapperFactory } from '../domains/ipc/services/IPCWrapperFactory';
import { ENV, getWrapperConfig } from '../config';

export function createMainFactory(
  services: FactoryServices,
  enabledWrappers: WrapperType[]
): ServiceFactory {
  const wrappers = enabledWrappers
    .map(type => WRAPPER_REGISTRY[type])
    .filter(Boolean)
    .map(factory => factory.create(services));
  
  return new ServiceFactory(wrappers);
}

let factoryInstance: MainServiceFactory | null = null;

/**
 * Получить singleton MainServiceFactory
 * Lazy initialization без регистрации в контейнере
 */
export async function getMainServiceFactory(): Promise<MainServiceFactory> {
  if (factoryInstance) return factoryInstance;
  
  const [logger, error, ipcWrapper] = await Promise.all([
    container.resolve<ILoggerService>(LOGGER_SERVICE_TOKEN),
    container.resolve<IErrorService>(ERROR_SERVICE_TOKEN),
    container.resolve<IPCWrapperFactory>(IPC_WRAPPER_FACTORY_TOKEN),
  ]);
  
  const enabledWrappers = getWrapperConfig(ENV.NODE_ENV);
  const baseFactory = createMainFactory({ logger, error }, enabledWrappers);
  
  factoryInstance = new MainServiceFactory(baseFactory, ipcWrapper);
  return factoryInstance;
}
