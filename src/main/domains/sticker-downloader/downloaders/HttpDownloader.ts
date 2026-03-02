import * as path from 'path';
import { IDownloader, DownloadOptions } from './IDownloader';
import { ParsedSticker } from '../parsers/IParser';
import { IHttpClient } from '../http/IHttpClient';
import { IFileSystemService } from '../../filesystem/services/IFileSystemService';
import { DownloadError } from '../enums';

export class HttpDownloader implements IDownloader {
  constructor(
    private httpClient: IHttpClient,
    private fileSystem: IFileSystemService
  ) {}
  
  async download(
    stickers: ParsedSticker[],
    options: DownloadOptions
  ): Promise<string[]> {
    const { outputDir, onProgress, signal } = options;
    
    await this.fileSystem.mkdir(outputDir, { recursive: true });
    
    const filePaths: string[] = [];
    const total = stickers.length;
    
    for (let i = 0; i < stickers.length; i++) {
      if (signal?.aborted) {
        throw new Error(DownloadError.ABORTED);
      }
      
      const sticker = stickers[i];
      
      try {
        const buffer = await this.httpClient.getBuffer(sticker.url);
        const extension = this.getExtension(sticker.url, sticker.isAnimated);
        const fileName = `sticker_${sticker.index}.${extension}`;
        const filePath = path.join(outputDir, fileName);
        
        await this.fileSystem.writeFile(filePath, buffer);
        filePaths.push(filePath);
        
        if (onProgress) {
          onProgress(i + 1, total);
        }
      } catch (error) {
        // Ошибка будет залогирована через ErrorWrapper
      }
    }
    
    if (filePaths.length === 0) {
      throw new Error(DownloadError.NO_FILES_DOWNLOADED);
    }
    
    return filePaths;
  }
  
  private getExtension(url: string, isAnimated: boolean): string {
    const match = url.match(/\.(\w+)(?:\?|$)/);
    return match ? match[1] : 'png';
  }
}
