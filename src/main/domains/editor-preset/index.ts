import { container } from '../core/Container';
import { IIdGenerator } from '@/shared/utils/id-generator/IIdGenerator';
import { IStoreService } from '@/shared/domains/store/interfaces/IStoreService';
import { EditorPresetEntityFactory } from './entities/EditorPresetEntityFactory';
import { EditorPresetEntityMapper } from './entities/EditorPresetEntityMapper';
import { EditorPresetRepository } from './repositories/EditorPresetRepository';
import { EditorPresetService } from './services/EditorPresetService';
import { IEditorPresetEntityFactory } from './entities/IEditorPresetEntityFactory';
import { IEditorPresetEntityMapper } from './entities/IEditorPresetEntityMapper';
import { IEditorPresetRepository } from './repositories/IEditorPresetRepository';
import { ID_GENERATOR_TOKEN } from '@/shared/utils/id-generator/constants';
import { STORE_SERVICE_TOKEN } from '../store/constants';
import { getMainServiceFactory } from '../../factories/mainFactory';
import {
  EDITOR_PRESET_ENTITY_FACTORY_TOKEN,
  EDITOR_PRESET_ENTITY_MAPPER_TOKEN,
  EDITOR_PRESET_REPOSITORY_TOKEN,
  EDITOR_PRESET_SERVICE_TOKEN,
} from './constants';

container.register(EDITOR_PRESET_ENTITY_MAPPER_TOKEN, () => {
  return new EditorPresetEntityMapper();
});

container.register(EDITOR_PRESET_ENTITY_FACTORY_TOKEN, async () => {
  const idGenerator = await container.resolve<IIdGenerator>(ID_GENERATOR_TOKEN);
  return new EditorPresetEntityFactory(idGenerator);
});

container.register(EDITOR_PRESET_REPOSITORY_TOKEN, async () => {
  const [storeService, mapper] = await Promise.all([
    container.resolve<IStoreService>(STORE_SERVICE_TOKEN),
    container.resolve<IEditorPresetEntityMapper>(EDITOR_PRESET_ENTITY_MAPPER_TOKEN),
  ]);
  return new EditorPresetRepository(storeService, mapper);
});

container.register(EDITOR_PRESET_SERVICE_TOKEN, async () => {
  const [repository, factory, mapper, mainFactory] = await Promise.all([
    container.resolve<IEditorPresetRepository>(EDITOR_PRESET_REPOSITORY_TOKEN),
    container.resolve<IEditorPresetEntityFactory>(EDITOR_PRESET_ENTITY_FACTORY_TOKEN),
    container.resolve<IEditorPresetEntityMapper>(EDITOR_PRESET_ENTITY_MAPPER_TOKEN),
    getMainServiceFactory(),
  ]);
  
  const service = new EditorPresetService(repository, factory, mapper);
  return mainFactory.createService(service, EDITOR_PRESET_SERVICE_TOKEN);
});

export { EDITOR_PRESET_SERVICE_TOKEN };
