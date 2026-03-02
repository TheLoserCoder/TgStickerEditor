/**
 * Домен логирования для main процесса
 */

export * from './services/LoggerService';
export * from './transports/FileTransport';
export * from './transports/ConsoleTransport';
export * from './transports/LocalTransport';
export * from './constants';

// Регистрация в контейнере
import { container } from '../core';
import { LOGGER_SERVICE_TOKEN } from './constants';
import { LoggerService } from './services/LoggerService';
import { FileTransport } from './transports/FileTransport';
import { ConsoleTransport } from './transports/ConsoleTransport';
import { app } from 'electron';
import * as path from 'path';

container.register(LOGGER_SERVICE_TOKEN, () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = path.join(app.getPath('userData'), 'logs', `app_${timestamp}.log`);
  
  const transports = [
    new FileTransport(logPath),
    new ConsoleTransport()
  ];
  return new LoggerService(transports);
});
