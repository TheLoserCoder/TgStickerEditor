import * as cheerio from 'cheerio';
import { IParser, ParsedSticker } from './IParser';
import { IHttpClient } from '../http/IHttpClient';
import { StickerProvider } from '@/shared/domains/sticker-downloader/enums';

export class LineParser implements IParser {
  readonly provider = StickerProvider.LINE;
  
  constructor(private httpClient: IHttpClient) {}
  
  canHandle(url: string): boolean {
    return url.includes('store.line.me/stickershop');
  }
  
  async parse(url: string): Promise<ParsedSticker[]> {
    const html = await this.httpClient.get(url);
    const $ = cheerio.load(html);
    const stickers: ParsedSticker[] = [];
    
    console.log('[LineParser] Parsing page, found elements:', $('li.mdCMN09Li').length);
    
    $('li.mdCMN09Li').each((index, element) => {
      const dataPreview = $(element).attr('data-preview');
      if (!dataPreview) return;
      
      try {
        const previewData = JSON.parse(dataPreview);
        const parsed = this.extractStickerUrl(previewData, index);
        if (parsed) stickers.push(parsed);
      } catch (error) {
        console.error('[LineParser] Failed to parse data-preview:', error);
      }
    });
    
    console.log('[LineParser] Parsed stickers:', stickers.length);
    return stickers;
  }
  
  private extractStickerUrl(previewData: any, index: number): ParsedSticker | null {
    if (previewData.animationUrl) {
      return { url: previewData.animationUrl, isAnimated: true, index };
    }
    if (previewData.staticUrl) {
      return { url: previewData.staticUrl, isAnimated: false, index };
    }
    if (previewData.fallbackStaticUrl) {
      return { url: previewData.fallbackStaticUrl, isAnimated: false, index };
    }
    return null;
  }
}
