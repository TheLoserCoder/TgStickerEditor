export interface ITelegramAdapter {
  createStickerSet(
    userId: string,
    name: string,
    title: string,
    sticker: Buffer,
    emoji: string,
    format: string,
    stickerType: string
  ): Promise<void>;

  addStickerToSet(
    userId: string,
    name: string,
    sticker: Buffer,
    emoji: string,
    format: string
  ): Promise<string>;

  getStickerSet(name: string): Promise<{ stickers: Array<{ file_id: string }> } | null>;

  deleteStickerFromSet(fileId: string): Promise<void>;

  setStickerPositionInSet(fileId: string, position: number): Promise<void>;
}
