import { container } from '../core/Container';
import { TempFileService } from './services/TempFileService';
import { TEMP_FILE_SERVICE_TOKEN } from './constants';
import { FileSystemServiceToken } from '../filesystem/enums';
import { ID_GENERATOR_TOKEN } from '../../../shared/utils/id-generator/constants';
import { getMainServiceFactory } from '../../factories/mainFactory';

container.register(TEMP_FILE_SERVICE_TOKEN, async () => {
  const [fileSystem, idGenerator, factory] = await Promise.all([
    container.resolve(FileSystemServiceToken.SERVICE),
    container.resolve(ID_GENERATOR_TOKEN),
    getMainServiceFactory(),
  ]);
  
  const service = new TempFileService(fileSystem, idGenerator);
  return factory.createService(service, TEMP_FILE_SERVICE_TOKEN);
});
