import { container } from '../core/Container';
import { SETTINGS_SERVICE_TOKEN, SETTINGS_REPOSITORY_TOKEN, SETTINGS_ENTITY_FACTORY_TOKEN, SETTINGS_ENTITY_MAPPER_TOKEN } from './constants';
import { SettingsService } from './services/SettingsService';
import { SettingsRepository } from './repositories/SettingsRepository';
import { ISettingsRepository } from './repositories/ISettingsRepository';
import { SettingsEntityFactory } from './entities/SettingsEntityFactory';
import { SettingsEntityMapper } from './entities/SettingsEntityMapper';
import { ISettingsEntityFactory } from './entities/ISettingsEntityFactory';
import { ISettingsEntityMapper } from './entities/ISettingsEntityMapper';
import { STORE_SERVICE_TOKEN } from '../store/constants';
import { IStoreService } from '../../../shared/domains/store/interfaces/IStoreService';
import { getMainServiceFactory } from '../../factories/mainFactory';
import { NOTIFICATION_REPOSITORY_WRAPPER_FACTORY_TOKEN } from '../core/constants';
import { INotificationRepositoryWrapperFactory } from '../../factories/INotificationRepositoryWrapperFactory';
import { SettingsDomain } from './enums';

container.register(SETTINGS_ENTITY_FACTORY_TOKEN, () => {
  return new SettingsEntityFactory();
});

container.register(SETTINGS_ENTITY_MAPPER_TOKEN, () => {
  return new SettingsEntityMapper();
});

container.register(SETTINGS_REPOSITORY_TOKEN, async () => {
  const [storeService, mapper, wrapperFactory] = await Promise.all([
    container.resolve<IStoreService>(STORE_SERVICE_TOKEN),
    container.resolve<ISettingsEntityMapper>(SETTINGS_ENTITY_MAPPER_TOKEN),
    container.resolve<INotificationRepositoryWrapperFactory>(NOTIFICATION_REPOSITORY_WRAPPER_FACTORY_TOKEN),
  ]);
  
  const repository = new SettingsRepository(storeService, mapper);
  return wrapperFactory.wrap<ISettingsRepository>(repository, SettingsDomain.SETTINGS);
});

container.register(SETTINGS_SERVICE_TOKEN, async () => {
  const [repository, entityFactory, factory] = await Promise.all([
    container.resolve<ISettingsRepository>(SETTINGS_REPOSITORY_TOKEN),
    container.resolve<ISettingsEntityFactory>(SETTINGS_ENTITY_FACTORY_TOKEN),
    getMainServiceFactory(),
  ]);
  
  const service = new SettingsService(repository, entityFactory);
  
  return factory.createService(service, SETTINGS_SERVICE_TOKEN);
});

export { SETTINGS_SERVICE_TOKEN };
