/**
 * StickerPackEntityMapper - маппер для преобразования StickerPackEntity ↔ DTO
 */

import { IStickerPackEntityMapper } from './IStickerPackEntityMapper';
import { StickerPackEntity } from './StickerPackEntity';
import { StickerPackInfrastructureDTO } from '@/shared/domains/sticker-pack/types';

export class StickerPackEntityMapper implements IStickerPackEntityMapper {
  toDTO(entity: StickerPackEntity): StickerPackInfrastructureDTO {
    return entity.toDTO();
  }

  fromDTO(dto: StickerPackInfrastructureDTO): StickerPackEntity {
    return StickerPackEntity.fromStorage(dto.id, dto.title);
  }
}
