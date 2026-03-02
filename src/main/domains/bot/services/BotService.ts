import { IBotService } from '../../../../shared/domains/bot/interfaces/IBotService';
import { Bot } from '../../../../shared/domains/bot/types';
import { IBotRepository } from '../repositories/IBotRepository';
import { IBotEntityFactory } from '../entities/IBotEntityFactory';
import { IBotEntityMapper } from '../entities/IBotEntityMapper';
import { IIdGenerator } from '../../../../shared/utils/id-generator/interfaces/IIdGenerator';
import { BotServiceError } from '../enums';

export class BotService implements IBotService {
  constructor(
    private repository: IBotRepository,
    private entityFactory: IBotEntityFactory,
    private mapper: IBotEntityMapper,
    private idGenerator: IIdGenerator
  ) {}

  async create(name: string, token: string, userId: string): Promise<Bot> {
    const id = this.idGenerator.generate();
    const entity = this.entityFactory.create(id, name, token, userId);
    
    const created = await this.repository.create(entity);
    return this.mapper.toDTO(created);
  }

  async getById(id: string): Promise<Bot | null> {
    const entity = await this.repository.get(id);
    return entity ? this.mapper.toDTO(entity) : null;
  }

  async getAll(): Promise<Bot[]> {
    const entities = await this.repository.getAll();
    return entities.map(entity => this.mapper.toDTO(entity));
  }

  async update(id: string, data: Partial<Omit<Bot, 'id'>>): Promise<Bot> {
    const entity = await this.repository.get(id);

    if (!entity) {
      throw new Error(`${BotServiceError.NOT_FOUND}: ${id}`);
    }

    const updated = this.entityFactory.create(
      entity.id,
      data.name ?? entity.name,
      data.token ?? entity.token,
      data.userId ?? entity.userId
    );
    
    const result = await this.repository.update(updated);
    return this.mapper.toDTO(result);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
