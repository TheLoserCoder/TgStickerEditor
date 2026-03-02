import { TelegramUploadStatus, TelegramStickerFormat, TelegramStickerType } from './enums';

export type TelegramPackInfo = {
  status: TelegramUploadStatus;
  name: string | null;
  url: string | null;
  botId: string;
  userId: string;
};

export type UploadStickerData = {
  filePath: string;
  emoji: string;
  cellId?: string;
};

export type UploadPackParams = {
  botToken: string;
  userId: string;
  packName: string;
  packTitle: string;
  stickerType: TelegramStickerType;
  format: TelegramStickerFormat;
  stickers: UploadStickerData[];
};

export type UploadResult = {
  success: boolean;
  packUrl?: string;
  error?: string;
  errorCode?: string;
};
