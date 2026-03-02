/**
 * ServiceFactory - фабрика для создания сервисов с применением wrapper'ов
 * Применяет цепочку wrapper'ов к сервису в порядке их передачи
 * 
 * @example
 * const factory = new ServiceFactory([
 *   new LoggerWrapper(transport),
 *   new ErrorWrapper(transport)
 * ]);
 * const service = factory.create(new MyService());
 */

import { IServiceWrapper } from './interfaces/IServiceWrapper';

export class ServiceFactory {
  constructor(private wrappers: IServiceWrapper[]) {}

  create<T extends object>(service: T): T {
    return this.wrappers.reduce(
      (wrapped, wrapper) => wrapper.wrap(wrapped),
      service
    );
  }
}
