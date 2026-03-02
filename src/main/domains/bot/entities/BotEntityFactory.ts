/**
 * BotEntityFactory - фабрика для создания BotEntity
 */

import { IBotEntityFactory } from './IBotEntityFactory';
import { BotEntity } from './BotEntity';

export class BotEntityFactory implements IBotEntityFactory {
  create(id: string, name: string, token: string, userId: string): BotEntity {
    return BotEntity.create(id, name, token, userId);
  }

  fromStorage(id: string, name: string, token: string, userId: string): BotEntity {
    return BotEntity.fromStorage(id, name, token, userId);
  }
}
