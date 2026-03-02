/**
 * IBotEntityMapper - интерфейс маппера для преобразования BotEntity ↔ DTO
 */

import { BotEntity } from './BotEntity';
import { Bot } from '@/shared/domains/bot/types';

export interface IBotEntityMapper {
  toDTO(entity: BotEntity): Bot;
  fromDTO(dto: Bot): BotEntity;
}
