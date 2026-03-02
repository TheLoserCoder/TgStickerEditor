/**
 * StickerPackEntityFactory - фабрика для создания StickerPackEntity
 */

import { IStickerPackEntityFactory } from './IStickerPackEntityFactory';
import { StickerPackEntity } from './StickerPackEntity';

export class StickerPackEntityFactory implements IStickerPackEntityFactory {
  create(packId: string, title: string): StickerPackEntity {
    return StickerPackEntity.create(packId, title);
  }
}
