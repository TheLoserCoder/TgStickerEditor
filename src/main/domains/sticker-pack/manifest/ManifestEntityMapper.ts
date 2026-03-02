/**
 * ManifestEntityMapper - маппер для преобразования ManifestEntity ↔ DTO
 */

import { IManifestEntityMapper } from './IManifestEntityMapper';
import { ManifestEntity } from './ManifestEntity';
import { StickerPackManifest } from '@/shared/domains/sticker-pack/types';

export class ManifestEntityMapper implements IManifestEntityMapper {
  toDTO(entity: ManifestEntity): StickerPackManifest {
    return entity.toDTO();
  }

  fromDTO(dto: StickerPackManifest): ManifestEntity {
    return ManifestEntity.fromDTO(dto);
  }
}
