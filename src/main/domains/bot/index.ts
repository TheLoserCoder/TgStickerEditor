import { container } from '../core/Container';
import { BOT_SERVICE_TOKEN, BOT_ENTITY_FACTORY_TOKEN, BOT_ENTITY_MAPPER_TOKEN, BOT_REPOSITORY_TOKEN } from './constants';
import { BotService } from './services/BotService';
import { BotRepository } from './repositories/BotRepository';
import { IBotRepository } from './repositories/IBotRepository';
import { BotEntityFactory } from './entities/BotEntityFactory';
import { BotEntityMapper } from './entities/BotEntityMapper';
import { IBotEntityFactory } from './entities/IBotEntityFactory';
import { IBotEntityMapper } from './entities/IBotEntityMapper';
import { STORE_SERVICE_TOKEN } from '../store/constants';
import { IStoreService } from '../../../shared/domains/store/interfaces/IStoreService';
import { ID_GENERATOR_TOKEN } from '../../../shared/utils/id-generator/constants';
import { IIdGenerator } from '../../../shared/utils/id-generator/interfaces/IIdGenerator';
import { NOTIFICATION_REPOSITORY_WRAPPER_FACTORY_TOKEN } from '../core/constants';
import { INotificationRepositoryWrapperFactory } from '../../factories/INotificationRepositoryWrapperFactory';
import { BotDomain } from './enums';
import { getMainServiceFactory } from '../../factories/mainFactory';

container.register(BOT_ENTITY_FACTORY_TOKEN, () => {
  return new BotEntityFactory();
});

container.register(BOT_ENTITY_MAPPER_TOKEN, () => {
  return new BotEntityMapper();
});

container.register(BOT_REPOSITORY_TOKEN, async () => {
  const [storeService, mapper, wrapperFactory] = await Promise.all([
    container.resolve<IStoreService>(STORE_SERVICE_TOKEN),
    container.resolve<IBotEntityMapper>(BOT_ENTITY_MAPPER_TOKEN),
    container.resolve<INotificationRepositoryWrapperFactory>(NOTIFICATION_REPOSITORY_WRAPPER_FACTORY_TOKEN),
  ]);
  
  const repository = new BotRepository(storeService, mapper);
  return wrapperFactory.wrap<IBotRepository>(repository, BotDomain.BOTS);
});

container.register(BOT_SERVICE_TOKEN, async () => {
  const [repository, entityFactory, mapper, idGenerator, factory] = await Promise.all([
    container.resolve<IBotRepository>(BOT_REPOSITORY_TOKEN),
    container.resolve<IBotEntityFactory>(BOT_ENTITY_FACTORY_TOKEN),
    container.resolve<IBotEntityMapper>(BOT_ENTITY_MAPPER_TOKEN),
    container.resolve<IIdGenerator>(ID_GENERATOR_TOKEN),
    getMainServiceFactory(),
  ]);
  
  const service = new BotService(repository, entityFactory, mapper, idGenerator);
  
  return factory.createService(service, BOT_SERVICE_TOKEN);
});

export { BOT_SERVICE_TOKEN };
