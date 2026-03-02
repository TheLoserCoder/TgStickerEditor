import { StickerProvider } from '@/shared/domains/sticker-downloader/enums';

export interface ParsedSticker {
  url: string;
  isAnimated: boolean;
  index: number;
}

export interface IParser {
  readonly provider: StickerProvider;
  parse(url: string): Promise<ParsedSticker[]>;
  canHandle(url: string): boolean;
}
