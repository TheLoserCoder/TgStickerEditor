/**
 * Типы для renderer фабрики
 */

import { IPCServiceProxy } from '../domains/ipc/services/IPCServiceProxy';

export type RendererFactoryDependencies = {
  serviceProxy: IPCServiceProxy;
};
