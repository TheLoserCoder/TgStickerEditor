import { DownloadResultDTO } from '../types';

export interface IStickerDownloaderService {
  downloadStickers(url: string): Promise<DownloadResultDTO>;
}
