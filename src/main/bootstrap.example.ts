/**
 * Bootstrap для main процесса
 * Инициализирует все сервисы и запускает приложение
 */

import Store from 'electron-store';
import { app, BrowserWindow } from 'electron';
import { ServiceFactory } from '@/shared/domains/core/ServiceFactory';
import { ElectronStoreAdapter } from './domains/store/adapters/ElectronStoreAdapter';
import { StoreService } from './domains/store/services/StoreService';
import { IPCBridge } from './domains/ipc/services/IPCBridge';
import { ServiceRegistry } from './domains/ipc/services/ServiceRegistry';
import { LoggerService } from './domains/logger/services/LoggerService';
import { ConsoleTransport } from './domains/logger/transports/ConsoleTransport';
import { FileTransport } from './domains/logger/transports/FileTransport';
import { LocalTransport as LoggerLocalTransport } from './domains/logger/transports/LocalTransport';
import { LoggerWrapper } from '@/shared/domains/logger/LoggerWrapper';
import { ErrorService } from './domains/error/services/ErrorService';
import { LocalTransport as ErrorLocalTransport } from './domains/error/transports/LocalTransport';
import { ErrorWrapper } from '@/shared/domains/error/ErrorWrapper';
import { ServiceName } from './domains/ipc/enums';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: '' // путь к preload скрипту
    }
  });

  await mainWindow.loadFile('index.html');
}

async function bootstrap() {
  await app.whenReady();

  // 1. Создать electron-store
  const electronStore = new Store();
  const storeAdapter = new ElectronStoreAdapter(electronStore);

  // 2. Создать IPC Bridge
  const ipcBridge = new IPCBridge(mainWindow!);

  // 3. Создать Logger
  const consoleTransport = new ConsoleTransport();
  const fileTransport = new FileTransport('./logs/app.log');
  const loggerService = new LoggerService([consoleTransport, fileTransport]);

  // 4. Создать Error Service
  const errorService = new ErrorService([]);

  // 5. Создать фабрику с wrapper'ами
  const loggerTransport = new LoggerLocalTransport(loggerService);
  const errorTransport = new ErrorLocalTransport(errorService);
  
  const factory = new ServiceFactory([
    new LoggerWrapper(loggerTransport),
    new ErrorWrapper(errorTransport)
  ]);

  // 6. Создать StoreService через фабрику
  const storeService = factory.create(
    new StoreService(storeAdapter, ipcBridge)
  );

  // 7. Зарегистрировать сервисы
  const registry = new ServiceRegistry(ipcBridge);
  registry.register(ServiceName.STORE_SERVICE, storeService);
  registry.register(ServiceName.LOGGER_SERVICE, loggerService);
  registry.register(ServiceName.ERROR_SERVICE, errorService);

  // 8. Создать окно
  await createWindow();
}

bootstrap();

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
