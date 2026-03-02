import { UploadResult } from '../types';
import { TelegramStickerType } from '../enums';

export interface UploadPackRequest {
  packId: string;
  botId?: string;
  botToken?: string;
  userId?: string;
  packName?: string;
  packTitle?: string;
  stickerType?: TelegramStickerType;
}

export interface ITelegramPackFacade {
  uploadPack(request: UploadPackRequest): Promise<UploadResult>;
  updatePack(request: UploadPackRequest): Promise<UploadResult>;
}
