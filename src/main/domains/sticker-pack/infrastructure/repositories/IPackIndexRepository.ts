import { StickerPackEntity } from '../entities/StickerPackEntity';

export interface IPackIndexRepository {
  create(pack: StickerPackEntity): Promise<StickerPackEntity>;
  update(pack: StickerPackEntity): Promise<StickerPackEntity>;
  delete(packId: string): Promise<{ id: string }>;
  get(packId: string): Promise<StickerPackEntity | null>;
  getAll(): Promise<StickerPackEntity[]>;
}
