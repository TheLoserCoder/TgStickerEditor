import { IBotRepository } from './IBotRepository';
import { BotEntity } from '../entities/BotEntity';
import { IBotEntityMapper } from '../entities/IBotEntityMapper';
import { IStoreService } from '../../../../shared/domains/store/interfaces/IStoreService';
import { Bot } from '@/shared/domains/bot/types';
import { BotStoreKey, BotDomain } from '../enums';
import { BaseRepository } from '../../core/BaseRepository';

export class BotRepository extends BaseRepository<BotEntity, Bot> implements IBotRepository {
  constructor(
    private storeService: IStoreService,
    mapper: IBotEntityMapper
  ) {
    super(mapper, BotDomain.BOTS);
  }

  async create(bot: BotEntity): Promise<BotEntity> {
    const bots = await this.getAllBots();
    bots[bot.id] = this.mapper.toDTO(bot);
    await this.storeService.set(BotStoreKey.BOTS, bots);
    return bot;
  }

  async update(bot: BotEntity): Promise<BotEntity> {
    const bots = await this.getAllBots();
    bots[bot.id] = this.mapper.toDTO(bot);
    await this.storeService.set(BotStoreKey.BOTS, bots);
    return bot;
  }

  async get(id: string): Promise<BotEntity | null> {
    const bots = await this.getAllBots();
    const dto = bots[id];
    
    if (!dto) {
      return null;
    }
    
    return this.mapper.fromDTO(dto);
  }

  async getAll(): Promise<BotEntity[]> {
    const bots = await this.getAllBots();
    return Object.values(bots).map(dto => this.mapper.fromDTO(dto));
  }

  async delete(id: string): Promise<{ id: string }> {
    const bots = await this.getAllBots();
    delete bots[id];
    await this.storeService.set(BotStoreKey.BOTS, bots);
    return { id };
  }

  private async getAllBots(): Promise<Record<string, Bot>> {
    return (await this.storeService.get<Record<string, Bot>>(BotStoreKey.BOTS)) || {};
  }
}
