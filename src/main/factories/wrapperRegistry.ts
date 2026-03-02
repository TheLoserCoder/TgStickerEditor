/**
 * Реестр доступных wrapper'ов для фабрики
 */

import { IServiceWrapper } from '@/shared/domains/core';
import { LoggerWrapper } from '@/shared/domains/logger/LoggerWrapper';
import { ErrorWrapper } from '@/shared/domains/error/ErrorWrapper';
import { LocalTransport as LoggerLocalTransport } from '../domains/logger/transports/LocalTransport';
import { LocalTransport as ErrorLocalTransport } from '../domains/error/transports/LocalTransport';
import { ILoggerService } from '@/shared/domains/logger/interfaces/ILoggerService';
import { IErrorService } from '@/shared/domains/error/interfaces/IErrorService';

export enum WrapperType {
  LOGGER = 'logger',
  ERROR = 'error'
}

export interface FactoryServices {
  logger: ILoggerService;
  error: IErrorService;
}

export interface WrapperFactory {
  create: (services: FactoryServices) => IServiceWrapper;
}

export const WRAPPER_REGISTRY: Record<WrapperType, WrapperFactory> = {
  [WrapperType.LOGGER]: {
    create: (services) => new LoggerWrapper(new LoggerLocalTransport(services.logger))
  },
  [WrapperType.ERROR]: {
    create: (services) => new ErrorWrapper(new ErrorLocalTransport(services.error))
  }
};
