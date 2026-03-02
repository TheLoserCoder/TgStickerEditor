import { Bot, InputFile } from 'grammy';
import axios from 'axios';
import { ITelegramAdapter } from './ITelegramAdapter';

export class GrammyAdapter implements ITelegramAdapter {
  public bot: Bot;

  constructor(token: string) {
    const FormData = require('form-data');
    
    const customFetch = async (url: string, init?: any) => {
      try {
        const options: any = {
          method: init?.method || 'GET',
          url: url,
          headers: init?.headers || {},
        };

        if (init?.body) {
          if (typeof init.body === 'string') {
            options.data = init.body;
            options.headers['Content-Type'] = 'application/json';
          } else if (init.body.constructor && init.body.constructor.name === 'FormData') {
            const formData = new FormData();
            for (const [key, value] of init.body.entries()) {
              formData.append(key, value);
            }
            options.data = formData;
            options.headers = { ...options.headers, ...formData.getHeaders() };
          } else {
            options.data = init.body;
          }
        }

        const response = await axios(options);
        
        return {
          ok: response.status >= 200 && response.status < 300,
          status: response.status,
          statusText: response.statusText,
          headers: new Map(Object.entries(response.headers)),
          json: async () => response.data,
          text: async () => JSON.stringify(response.data),
        };
      } catch (error: any) {
        if (error.response) {
          return {
            ok: false,
            status: error.response.status,
            statusText: error.response.statusText,
            headers: new Map(Object.entries(error.response.headers)),
            json: async () => error.response.data,
            text: async () => JSON.stringify(error.response.data),
          };
        }
        throw error;
      }
    };

    this.bot = new Bot(token, {
      client: {
        apiRoot: 'https://api.telegram.org',
        environment: {
          fetch: customFetch as any,
        },
      },
    });
  }

  async createStickerSet(
    userId: string,
    name: string,
    title: string,
    sticker: Buffer,
    emoji: string,
    format: string,
    stickerType: string
  ): Promise<void> {
    const isVideo = format === 'video';
    await this.bot.api.createNewStickerSet(
      userId,
      name,
      title,
      [
        {
          sticker: new InputFile(sticker, isVideo ? 'sticker.webm' : 'sticker.webp'),
          emoji_list: [emoji],
          format: format as any,
        },
      ],
      stickerType === 'custom_emoji' ? { sticker_type: 'custom_emoji' } : undefined
    );
  }

  async addStickerToSet(
    userId: string,
    name: string,
    sticker: Buffer,
    emoji: string,
    format: string
  ): Promise<string> {
    const isVideo = format === 'video';
    await this.bot.api.addStickerToSet(
      userId,
      name,
      {
        sticker: new InputFile(sticker, isVideo ? 'sticker.webm' : 'sticker.webp'),
        emoji_list: [emoji],
        format: format as any,
      }
    );
    
    const stickerSet = await this.getStickerSet(name);
    if (stickerSet?.stickers?.length > 0) {
      return stickerSet.stickers[stickerSet.stickers.length - 1].file_id;
    }
    
    throw new Error('Failed to get fileId after adding sticker');
  }

  async getStickerSet(name: string): Promise<{ stickers: Array<{ file_id: string }> } | null> {
    try {
      const stickerSet = await this.bot.api.getStickerSet(name);
      return stickerSet as any;
    } catch (error) {
      return null;
    }
  }

  async deleteStickerFromSet(fileId: string): Promise<void> {
    await this.bot.api.deleteStickerFromSet(fileId);
  }

  async setStickerPositionInSet(fileId: string, position: number): Promise<void> {
    await this.bot.api.setStickerPositionInSet(fileId, position);
  }
}
