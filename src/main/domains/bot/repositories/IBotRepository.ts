import { BotEntity } from '../entities/BotEntity';

export interface IBotRepository {
  create(bot: BotEntity): Promise<BotEntity>;
  update(bot: BotEntity): Promise<BotEntity>;
  delete(id: string): Promise<void>;
  get(id: string): Promise<BotEntity | null>;
  getAll(): Promise<BotEntity[]>;
}
