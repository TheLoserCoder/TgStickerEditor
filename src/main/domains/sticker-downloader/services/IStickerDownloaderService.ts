import { DownloadResultDTO } from '@/shared/domains/sticker-downloader/types';

export interface IStickerDownloaderService {
  downloadStickers(url: string): Promise<DownloadResultDTO>;
}
