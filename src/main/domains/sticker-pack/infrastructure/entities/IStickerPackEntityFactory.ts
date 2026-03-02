/**
 * IStickerPackEntityFactory - интерфейс фабрики для создания StickerPackEntity
 */

import { StickerPackEntity } from './StickerPackEntity';

export interface IStickerPackEntityFactory {
  create(packId: string, title: string): StickerPackEntity;
}
