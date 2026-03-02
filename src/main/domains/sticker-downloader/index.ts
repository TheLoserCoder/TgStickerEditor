import { container } from '../core/Container';
import { getMainServiceFactory } from '../../factories/mainFactory';
import { AxiosHttpClient } from './http/AxiosHttpClient';
import { LineParser } from './parsers/LineParser';
import { ParserFactory } from './parsers/ParserFactory';
import { HttpDownloader } from './downloaders/HttpDownloader';
import { StickerDownloaderService } from './services/StickerDownloaderService';
import { STICKER_DOWNLOADER_TOKENS, STICKER_DOWNLOADER_SERVICE_TOKEN } from './constants';
import { FileSystemServiceToken } from '../filesystem/enums';
import { TEMP_FILE_SERVICE_TOKEN } from '../temp-file/constants';

container.register(STICKER_DOWNLOADER_TOKENS.HTTP_CLIENT, () => {
  return new AxiosHttpClient();
});

container.register(STICKER_DOWNLOADER_TOKENS.LINE_PARSER, async () => {
  const httpClient = await container.resolve(STICKER_DOWNLOADER_TOKENS.HTTP_CLIENT);
  return new LineParser(httpClient);
});

container.register(STICKER_DOWNLOADER_TOKENS.PARSER_FACTORY, async () => {
  const lineParser = await container.resolve(STICKER_DOWNLOADER_TOKENS.LINE_PARSER);
  return new ParserFactory([lineParser]);
});

container.register(STICKER_DOWNLOADER_TOKENS.DOWNLOADER, async () => {
  const [httpClient, fileSystem] = await Promise.all([
    container.resolve(STICKER_DOWNLOADER_TOKENS.HTTP_CLIENT),
    container.resolve(FileSystemServiceToken.SERVICE)
  ]);
  return new HttpDownloader(httpClient, fileSystem);
});

container.register(STICKER_DOWNLOADER_SERVICE_TOKEN, async () => {
  const [parserFactory, downloader, tempFileService, ipcBridge, factory] = await Promise.all([
    container.resolve(STICKER_DOWNLOADER_TOKENS.PARSER_FACTORY),
    container.resolve(STICKER_DOWNLOADER_TOKENS.DOWNLOADER),
    container.resolve(TEMP_FILE_SERVICE_TOKEN),
    container.resolve('IPCBridge'),
    getMainServiceFactory()
  ]);
  
  const service = new StickerDownloaderService(
    parserFactory,
    downloader,
    tempFileService,
    ipcBridge
  );
  
  return factory.createService(service, STICKER_DOWNLOADER_SERVICE_TOKEN);
});

export { STICKER_DOWNLOADER_SERVICE_TOKEN };
