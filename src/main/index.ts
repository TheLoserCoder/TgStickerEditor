/**
 * Main процесс - точка входа
 */

import { app, BrowserWindow, protocol } from 'electron';
import * as path from 'path';
import { container } from './domains/core';
import { initializeIPCBridge } from './domains/ipc';
import { DATA_CHANGE_NOTIFIER_TOKEN, STORE_SYNC_SERVICE_TOKEN } from './domains/store/constants';
import { IPC_BRIDGE_TOKEN, SERVICE_REGISTRY_TOKEN, IPC_WRAPPER_FACTORY_TOKEN } from './domains/ipc/constants';
import { LOGGER_SERVICE_TOKEN } from './domains/logger/constants';
import { ERROR_SERVICE_TOKEN } from './domains/error/constants';
import { SETTINGS_SERVICE_TOKEN } from './domains/settings/constants';
import { DataChangeNotifier } from './domains/store/services/DataChangeNotifier';
import { StoreSyncService } from './domains/store/services/StoreSyncService';
import { IIPCBridge } from '@/shared/domains/ipc/interfaces/IIPCBridge';
import { ILoggerService } from '@/shared/domains/logger/interfaces/ILoggerService';
import { ProtocolService } from './protocol';
import { ProtocolScheme } from './protocol/enums';

import './domains';

let mainWindow: BrowserWindow | null = null;
let storeSyncService: StoreSyncService | null = null;
let loggerService: ILoggerService | null = null;
let protocolService: ProtocolService | null = null;

// Регистрация схем ДО app.ready
if (protocol && protocol.registerSchemesAsPrivileged) {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: ProtocolScheme.STICKER_PACKS,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        bypassCSP: true,
        stream: true
      }
    }
  ]);
}

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:5173');
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist-renderer/index.html'));
  }
}

async function bootstrap(): Promise<void> {
  await container.resolve(SERVICE_REGISTRY_TOKEN);
  
  loggerService = await container.resolve<ILoggerService>(LOGGER_SERVICE_TOKEN);
  
  protocolService = new ProtocolService(loggerService);
  protocolService.registerHandlers();
  
  await container.resolve(ERROR_SERVICE_TOKEN);
  
  await container.resolve(IPC_WRAPPER_FACTORY_TOKEN);
  
  await createWindow();
  
  if (!mainWindow) {
    throw new Error('Main window not created');
  }
  
  initializeIPCBridge(mainWindow);
  
  const notifier = await container.resolve<DataChangeNotifier>(DATA_CHANGE_NOTIFIER_TOKEN);
  const ipcBridge = await container.resolve<IIPCBridge>(IPC_BRIDGE_TOKEN);
  storeSyncService = new StoreSyncService(notifier, ipcBridge);
  
  mainWindow.show();
}

app.whenReady().then(bootstrap).catch(err => {
  console.error('A fatal error occurred during bootstrap:', err);
  app.quit();
});

app.on('window-all-closed', () => {
  loggerService?.destroy();
  storeSyncService?.destroy();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
