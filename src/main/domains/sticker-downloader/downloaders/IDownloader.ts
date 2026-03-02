import { ParsedSticker } from '../parsers/IParser';

export interface DownloadOptions {
  outputDir: string;
  onProgress?: (current: number, total: number) => void;
  signal?: AbortSignal;
}

export interface IDownloader {
  download(stickers: ParsedSticker[], options: DownloadOptions): Promise<string[]>;
}
