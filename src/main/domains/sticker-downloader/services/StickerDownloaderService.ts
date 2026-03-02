import { IStickerDownloaderService } from './IStickerDownloaderService';
import { DownloadResultDTO } from '@/shared/domains/sticker-downloader/types';
import { StickerDownloaderIPCChannel } from '@/shared/domains/sticker-downloader/enums';
import { IParserFactory } from '../parsers/ParserFactory';
import { IDownloader } from '../downloaders/IDownloader';
import { ITempFileService } from '../../temp-file/services/ITempFileService';
import { IIPCBridge } from '../../ipc/services/IPCBridge';
import { DownloadError } from '../enums';

export class StickerDownloaderService implements IStickerDownloaderService {
  constructor(
    private parserFactory: IParserFactory,
    private downloader: IDownloader,
    private tempFileService: ITempFileService,
    private ipcBridge: IIPCBridge
  ) {}
  
  async downloadStickers(url: string): Promise<DownloadResultDTO> {
    const sessionId = `download_${Date.now()}`;
    
    try {
      const parser = this.parserFactory.getParser(url);
      if (!parser) {
        throw new Error(DownloadError.UNSUPPORTED_PROVIDER);
      }
      
      this.sendProgress(0, 'Парсинг страницы...');
      
      const stickers = await parser.parse(url);
      if (stickers.length === 0) {
        throw new Error(DownloadError.NO_STICKERS_FOUND);
      }
      
      this.sendProgress(10, `Найдено ${stickers.length} стикеров`);
      
      const tempDir = await this.tempFileService.createTempDir(sessionId, 'download');
      
      const filePaths = await this.downloader.download(stickers, {
        outputDir: tempDir,
        onProgress: (current, total) => {
          const progress = 10 + (current / total) * 90;
          this.sendProgress(progress, `Скачано ${current} из ${total}`);
        }
      });
      
      return {
        success: true,
        filePaths
      };
      
    } catch (error) {
      await this.tempFileService.cleanupSession(sessionId);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : DownloadError.UNKNOWN_ERROR
      };
    }
  }
  
  private sendProgress(progress: number, message: string): void {
    this.ipcBridge.send(StickerDownloaderIPCChannel.PROGRESS, {
      progress,
      message
    });
  }
}
