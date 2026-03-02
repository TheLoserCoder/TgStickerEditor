import { container } from '../core/Container';
import { StickerPackServiceToken } from '../../../shared/domains/sticker-pack/enums';
import { StickerPackService } from './infrastructure/StickerPackService';
import { IStickerPackService } from './infrastructure/IStickerPackService';
import { StickerPackEntityFactory } from './infrastructure/entities/StickerPackEntityFactory';
import { StickerPackEntityMapper } from './infrastructure/entities/StickerPackEntityMapper';
import { IStickerPackEntityFactory } from './infrastructure/entities/IStickerPackEntityFactory';
import { IStickerPackEntityMapper } from './infrastructure/entities/IStickerPackEntityMapper';
import { StickerPackFacade } from './facade/StickerPackFacade';
import { ManifestService } from './manifest/ManifestService';
import { IManifestService } from './manifest/IManifestService';
import { ManifestEntityMapper } from './manifest/ManifestEntityMapper';
import { IManifestEntityMapper } from './manifest/IManifestEntityMapper';
import { FragmentService } from './fragment/FragmentService';
import { IFragmentService } from './fragment/IFragmentService';
import { PackIndexRepository } from './infrastructure/repositories/PackIndexRepository';
import { PackStorageRepository } from './infrastructure/repositories/PackStorageRepository';
import { IPackIndexRepository } from './infrastructure/repositories/IPackIndexRepository';
import { IPackStorageRepository } from './infrastructure/repositories/IPackStorageRepository';
import { ManifestRepository } from './manifest/ManifestRepository';
import { IManifestRepository } from './manifest/IManifestRepository';
import { FragmentFileRepository } from './fragment/FragmentFileRepository';
import { IFragmentFileRepository } from './fragment/IFragmentFileRepository';
import { STORE_SERVICE_TOKEN, DATA_CHANGE_NOTIFIER_TOKEN } from '../store/constants';
import { IStoreService } from '../../../shared/domains/store/interfaces/IStoreService';
import { IDataChangeNotifier } from '../../../shared/domains/core/interfaces/IDataChangeNotifier';
import { FileSystemServiceToken } from '../filesystem/enums';
import { IFileSystemService } from '../filesystem/services/IFileSystemService';
import { ID_GENERATOR_TOKEN } from '../../../shared/utils/id-generator/constants';
import { IIdGenerator } from '../../../shared/utils/id-generator/interfaces/IIdGenerator';
import { NOTIFICATION_REPOSITORY_WRAPPER_FACTORY_TOKEN } from '../core/constants';
import { INotificationRepositoryWrapperFactory } from '../../factories/INotificationRepositoryWrapperFactory';
import { StickerPackDomain, ManifestDomain } from '../../../shared/domains/sticker-pack/enums';
import { getStickerPackBasePath } from '../../config/paths';
import { GRID_SERVICE_TOKEN, GRID_ENTITY_MAPPER_TOKEN } from '../grid/constants';
import { IGridService } from '../grid/services/IGridService';
import { IGridEntityMapper } from '../grid/entities/IGridEntityMapper';
import { getMainServiceFactory } from '../../factories/mainFactory';

const PACK_INDEX_REPO = 'PackIndexRepository';
const PACK_STORAGE_REPO = 'PackStorageRepository';
const MANIFEST_REPO = 'ManifestRepository';
const MANIFEST_ENTITY_MAPPER = 'ManifestEntityMapper';
const FRAGMENT_FILE_REPO = 'FragmentFileRepository';
const STICKER_PACK_ENTITY_FACTORY = 'StickerPackEntityFactory';
const STICKER_PACK_ENTITY_MAPPER = 'StickerPackEntityMapper';

container.register(STICKER_PACK_ENTITY_FACTORY, () => {
  return new StickerPackEntityFactory();
});

container.register(STICKER_PACK_ENTITY_MAPPER, () => {
  return new StickerPackEntityMapper();
});

container.register(MANIFEST_ENTITY_MAPPER, () => {
  return new ManifestEntityMapper();
});

container.register(PACK_INDEX_REPO, async () => {
  const [storeService, mapper, wrapperFactory] = await Promise.all([
    container.resolve<IStoreService>(STORE_SERVICE_TOKEN),
    container.resolve<IStickerPackEntityMapper>(STICKER_PACK_ENTITY_MAPPER),
    container.resolve<INotificationRepositoryWrapperFactory>(NOTIFICATION_REPOSITORY_WRAPPER_FACTORY_TOKEN),
  ]);
  
  const repository = new PackIndexRepository(storeService, mapper);
  return wrapperFactory.wrap<IPackIndexRepository>(repository, StickerPackDomain.STICKER_PACKS);
});

container.register(PACK_STORAGE_REPO, async () => {
  const fileSystem = await container.resolve<IFileSystemService>(FileSystemServiceToken.SERVICE);
  return new PackStorageRepository(fileSystem, getStickerPackBasePath());
});

container.register(MANIFEST_REPO, async () => {
  const [fileSystem, mapper, wrapperFactory] = await Promise.all([
    container.resolve<IFileSystemService>(FileSystemServiceToken.SERVICE),
    container.resolve<IManifestEntityMapper>(MANIFEST_ENTITY_MAPPER),
    container.resolve<INotificationRepositoryWrapperFactory>(NOTIFICATION_REPOSITORY_WRAPPER_FACTORY_TOKEN),
  ]);
  
  const repository = new ManifestRepository(fileSystem, mapper);
  return wrapperFactory.wrap<IManifestRepository>(repository, ManifestDomain.MANIFESTS);
});

container.register(FRAGMENT_FILE_REPO, async () => {
  const fileSystem = await container.resolve<IFileSystemService>(FileSystemServiceToken.SERVICE);
  return new FragmentFileRepository(fileSystem);
});

container.register(StickerPackServiceToken.MANIFEST, async () => {
  const [manifestRepo, mapper, gridMapper] = await Promise.all([
    container.resolve<IManifestRepository>(MANIFEST_REPO),
    container.resolve<IManifestEntityMapper>(MANIFEST_ENTITY_MAPPER),
    container.resolve<IGridEntityMapper>(GRID_ENTITY_MAPPER_TOKEN),
  ]);
  
  return new ManifestService(manifestRepo, mapper, gridMapper);
});

container.register(StickerPackServiceToken.FRAGMENT, async () => {
  const [fragmentFileRepo, manifestService, idGenerator] = await Promise.all([
    container.resolve<IFragmentFileRepository>(FRAGMENT_FILE_REPO),
    container.resolve<IManifestService>(StickerPackServiceToken.MANIFEST),
    container.resolve<IIdGenerator>(ID_GENERATOR_TOKEN),
  ]);
  
  return new FragmentService(fragmentFileRepo, manifestService, idGenerator);
});

container.register(StickerPackServiceToken.SERVICE, async () => {
  const [indexRepo, storageRepo, entityFactory, mapper] = await Promise.all([
    container.resolve<IPackIndexRepository>(PACK_INDEX_REPO),
    container.resolve<IPackStorageRepository>(PACK_STORAGE_REPO),
    container.resolve<IStickerPackEntityFactory>(STICKER_PACK_ENTITY_FACTORY),
    container.resolve<IStickerPackEntityMapper>(STICKER_PACK_ENTITY_MAPPER),
  ]);
  
  return new StickerPackService(indexRepo, storageRepo, entityFactory, mapper);
});

container.register(StickerPackServiceToken.FACADE, async () => {
  const [packService, manifestService, fragmentService, gridService, idGenerator, notifier, factory] = await Promise.all([
    container.resolve<IStickerPackService>(StickerPackServiceToken.SERVICE),
    container.resolve<IManifestService>(StickerPackServiceToken.MANIFEST),
    container.resolve<IFragmentService>(StickerPackServiceToken.FRAGMENT),
    container.resolve<IGridService>(GRID_SERVICE_TOKEN),
    container.resolve<IIdGenerator>(ID_GENERATOR_TOKEN),
    container.resolve<IDataChangeNotifier>(DATA_CHANGE_NOTIFIER_TOKEN),
    getMainServiceFactory(),
  ]);
  
  const facade = new StickerPackFacade(packService, manifestService, fragmentService, gridService, idGenerator, notifier);
  
  return factory.createService(facade, StickerPackServiceToken.FACADE);
});

export { StickerPackServiceToken };
