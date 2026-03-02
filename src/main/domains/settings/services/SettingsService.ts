import { ISettingsService } from '../../../../shared/domains/settings/interfaces/ISettingsService';
import { AppSettings } from '../../../../shared/domains/settings/types';
import { ISettingsRepository } from '../repositories/ISettingsRepository';
import { ISettingsEntityFactory } from '../entities/ISettingsEntityFactory';

export class SettingsService implements ISettingsService {
  constructor(
    private repository: ISettingsRepository,
    private entityFactory: ISettingsEntityFactory
  ) {}

  async get<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
    const settings = await this.getAll();
    return settings[key];
  }

  async set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
    const current = await this.repository.get();
    const currentEntity = current || this.entityFactory.default();
    const currentDTO = currentEntity.toDTO();
    
    const updated: AppSettings = {
      ...currentDTO,
      [key]: value,
    };
    
    const updatedEntity = this.entityFactory.fromDTO(updated);
    await this.repository.update(updatedEntity);
  }

  async getAll(): Promise<AppSettings> {
    const entity = await this.repository.get();
    const finalEntity = entity || this.entityFactory.default();
    return finalEntity.toDTO();
  }

  async reset(): Promise<void> {
    const entity = this.entityFactory.default();
    await this.repository.update(entity);
  }

  async resetKey<K extends keyof AppSettings>(key: K): Promise<void> {
    const defaultEntity = this.entityFactory.default();
    const defaultDTO = defaultEntity.toDTO();
    await this.set(key, defaultDTO[key]);
  }
}
