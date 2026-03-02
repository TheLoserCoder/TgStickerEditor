/**
 * IManifestEntityMapper - интерфейс маппера для преобразования ManifestEntity ↔ DTO
 */

import { ManifestEntity } from './ManifestEntity';
import { StickerPackManifest } from '@/shared/domains/sticker-pack/types';

export interface IManifestEntityMapper {
  toDTO(entity: ManifestEntity): StickerPackManifest;
  fromDTO(dto: StickerPackManifest): ManifestEntity;
}
