/**
 * IBotEntityFactory - интерфейс фабрики для создания BotEntity
 */

import { BotEntity } from './BotEntity';

export interface IBotEntityFactory {
  create(id: string, name: string, token: string, userId: string): BotEntity;
  fromStorage(id: string, name: string, token: string, userId: string): BotEntity;
}
