/**
 * Фабрика для renderer процесса
 * Создает ServiceFactory с настроенными wrapper'ами
 */

import { ServiceFactory } from '@/shared/domains/core';
import { LoggerWrapper } from '@/shared/domains/logger/LoggerWrapper';
import { ErrorWrapper } from '@/shared/domains/error/ErrorWrapper';
import { IPCTransport } from '../domains/logger/transports/IPCTransport';
import { ServiceTransport } from '../domains/error/transports/ServiceTransport';
import { RendererFactoryDependencies } from './types';

export function createRendererFactory(
  deps: RendererFactoryDependencies
): ServiceFactory {
  const { serviceProxy } = deps;

  const loggerTransport = new IPCTransport(serviceProxy);
  const errorTransport = new ServiceTransport(serviceProxy);

  return new ServiceFactory([
    new LoggerWrapper(loggerTransport),
    new ErrorWrapper(errorTransport)
  ]);
}
