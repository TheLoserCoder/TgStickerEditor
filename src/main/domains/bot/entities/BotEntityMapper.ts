/**
 * BotEntityMapper - маппер для преобразования BotEntity ↔ DTO
 */

import { IBotEntityMapper } from './IBotEntityMapper';
import { BotEntity } from './BotEntity';
import { Bot } from '@/shared/domains/bot/types';

export class BotEntityMapper implements IBotEntityMapper {
  toDTO(entity: BotEntity): Bot {
    return {
      id: entity.id,
      name: entity.name,
      token: entity.token,
      userId: entity.userId,
    };
  }

  fromDTO(dto: Bot): BotEntity {
    return BotEntity.fromStorage(dto.id, dto.name, dto.token, dto.userId);
  }
}
