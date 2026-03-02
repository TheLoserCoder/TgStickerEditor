/**
 * Error домен для main процесса
 */

export * from './services/ErrorService';
export * from './handlers/LogErrorHandler';
export * from './handlers/NotificationErrorHandler';
export * from './transports/LocalTransport';
export { ERROR_SERVICE_TOKEN } from './constants';

// Регистрация в контейнере
import { container } from '../core';
import { ERROR_SERVICE_TOKEN } from './constants';
import { ErrorService } from './services/ErrorService';
import { LogErrorHandler } from './handlers/LogErrorHandler';
import { NotificationErrorHandler } from './handlers/NotificationErrorHandler';
import { LOGGER_SERVICE_TOKEN } from '../logger/constants';

import { ILoggerService } from '../../../shared/domains/logger/interfaces/ILoggerService';

container.register(ERROR_SERVICE_TOKEN, async () => {
  const loggerService = await container.resolve<ILoggerService>(LOGGER_SERVICE_TOKEN);
  const handlers = [
    new LogErrorHandler(loggerService),
    new NotificationErrorHandler()
  ];
  return new ErrorService(handlers);
});
