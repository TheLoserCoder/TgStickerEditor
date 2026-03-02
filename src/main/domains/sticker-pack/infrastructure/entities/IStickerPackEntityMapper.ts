/**
 * IStickerPackEntityMapper - интерфейс маппера для преобразования StickerPackEntity ↔ DTO
 */

import { StickerPackEntity } from './StickerPackEntity';
import { StickerPackInfrastructureDTO } from '@/shared/domains/sticker-pack/types';

export interface IStickerPackEntityMapper {
  toDTO(entity: StickerPackEntity): StickerPackInfrastructureDTO;
  fromDTO(dto: StickerPackInfrastructureDTO): StickerPackEntity;
}
