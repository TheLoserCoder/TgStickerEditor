/**
 * Bootstrap для renderer процесса
 * Инициализирует Redux, синхронизацию с store и запускает React
 */

import { configureStore } from '@reduxjs/toolkit';
import { ServiceFactory } from '@/shared/domains/core/ServiceFactory';
import { IPCBridge } from './domains/ipc/services/IPCBridge';
import { IPCServiceProxy } from './domains/ipc/services/IPCServiceProxy';
import { ReduxStateManager } from './domains/store/adapters/ReduxStateManager';
import { StoreSyncAdapter } from './domains/store/adapters/StoreSyncAdapter';
import { LoggerWrapper } from '@/shared/domains/logger/LoggerWrapper';
import { IPCTransport } from './domains/logger/transports/IPCTransport';
import { ErrorWrapper } from '@/shared/domains/error/ErrorWrapper';
import { ServiceTransport } from './domains/error/transports/ServiceTransport';
import { IStoreService } from '@/shared/domains/store/interfaces/IStoreService';
import { ServiceName } from './domains/ipc/enums';

// Reducer для обработки store updates
function storeReducer(state = {}, action: any) {
  switch (action.type) {
    case '@@store/STATE_INITIALIZE':
      return action.payload;
    case '@@store/STATE_UPDATE':
      return {
        ...state,
        [action.payload.key]: action.payload.value
      };
    default:
      return state;
  }
}

async function bootstrap() {
  // 1. Создать Redux store
  const reduxStore = configureStore({
    reducer: {
      persistent: storeReducer,
      ephemeral: (state = {}) => state
    }
  });

  // 2. Создать IPC Bridge и Proxy
  const ipcBridge = new IPCBridge();
  const serviceProxy = new IPCServiceProxy(ipcBridge);

  // 3. Получить StoreService через proxy
  const storeService = serviceProxy.wrap<IStoreService>(ServiceName.STORE_SERVICE);

  // 4. Создать StateManager
  const stateManager = new ReduxStateManager(reduxStore);

  // 5. Создать фабрику с wrapper'ами
  const loggerTransport = new IPCTransport(serviceProxy);
  const errorTransport = new ServiceTransport(serviceProxy);

  const factory = new ServiceFactory([
    new LoggerWrapper(loggerTransport),
    new ErrorWrapper(errorTransport)
  ]);

  // 6. Создать StoreSyncAdapter через фабрику
  const syncAdapter = factory.create(
    new StoreSyncAdapter(storeService, stateManager, ipcBridge)
  );

  // 7. Инициализировать синхронизацию
  await syncAdapter.initialize();

  // 8. Запустить React приложение
  // import('./App').then(({ App }) => {
  //   ReactDOM.render(<App store={reduxStore} />, document.getElementById('root'));
  // });
}

bootstrap();
