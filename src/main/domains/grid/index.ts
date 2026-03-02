import { container } from '../core/Container';
import { SMART_GRID_CALCULATOR_TOKEN, GRID_SERVICE_TOKEN, GRID_ENTITY_MAPPER_TOKEN } from './constants';
import { ISmartGridCalculator } from './utils/ISmartGridCalculator';
import { SmartGridCalculator } from './utils/SmartGridCalculator';
import { IGridService } from './services/IGridService';
import { GridService } from './services/GridService';
import { IGridEntityMapper } from './entities/IGridEntityMapper';
import { GridEntityMapper } from './entities/GridEntityMapper';
import { ID_GENERATOR_TOKEN } from '../../../shared/utils/id-generator/constants';
import { IIdGenerator } from '../../../shared/utils/id-generator/interfaces/IIdGenerator';

container.register(GRID_ENTITY_MAPPER_TOKEN, () => {
  return new GridEntityMapper();
});

container.register(
  SMART_GRID_CALCULATOR_TOKEN,
  async () => {
    const idGenerator = await container.resolve<IIdGenerator>(ID_GENERATOR_TOKEN);
    return new SmartGridCalculator(idGenerator);
  }
);

container.register(
  GRID_SERVICE_TOKEN,
  async () => {
    const calculator = await container.resolve<ISmartGridCalculator>(SMART_GRID_CALCULATOR_TOKEN);
    const idGenerator = await container.resolve<IIdGenerator>(ID_GENERATOR_TOKEN);
    return new GridService(calculator, idGenerator);
  }
);
