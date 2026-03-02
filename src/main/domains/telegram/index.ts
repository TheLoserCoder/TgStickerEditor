import { Container } from '../core/Container';
import { TelegramPackFacade } from './facade/TelegramPackFacade';
import { EmptyImageGenerator } from './utils/EmptyImageGenerator';
import { TELEGRAM_SERVICE_TOKEN, EMPTY_IMAGE_GENERATOR_TOKEN } from './constants';
import { IFileSystemService } from '../filesystem/services/IFileSystemService';
import { IIPCBridge } from '../ipc/interfaces/IIPCBridge';
import { IStickerPackFacade } from '../sticker-pack/facade/IStickerPackFacade';
import { IManifestService } from '../sticker-pack/manifest/IManifestService';
import { FileSystemServiceToken } from '../filesystem/enums';
import { IPC_BRIDGE_TOKEN } from '../ipc/constants';
import { STICKER_PACK_FACADE_TOKEN, MANIFEST_SERVICE_TOKEN } from '../sticker-pack/constants';
import { StickerPackServiceToken } from '../../../shared/domains/sticker-pack/enums';
import { getMainServiceFactory } from '../../factories/mainFactory';

export function registerTelegramDomain(container: Container): void {
  container.register(EMPTY_IMAGE_GENERATOR_TOKEN, () => new EmptyImageGenerator());

  container.register(TELEGRAM_SERVICE_TOKEN, async () => {
    const [stickerPackFacade, manifestService, fileSystem, emptyImageGenerator, ipcBridge, factory] = await Promise.all([
      container.resolve<IStickerPackFacade>(STICKER_PACK_FACADE_TOKEN),
      container.resolve<IManifestService>(StickerPackServiceToken.MANIFEST),
      container.resolve<IFileSystemService>(FileSystemServiceToken.SERVICE),
      container.resolve<EmptyImageGenerator>(EMPTY_IMAGE_GENERATOR_TOKEN),
      container.resolve<IIPCBridge>(IPC_BRIDGE_TOKEN),
      getMainServiceFactory(),
    ]);
    
    const service = new TelegramPackFacade(stickerPackFacade, manifestService, fileSystem, emptyImageGenerator, ipcBridge);
    return factory.createService(service, TELEGRAM_SERVICE_TOKEN);
  });
}

registerTelegramDomain(Container.getInstance());

export { TELEGRAM_SERVICE_TOKEN };