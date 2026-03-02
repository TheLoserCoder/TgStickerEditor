import { ISettingsRepository } from './ISettingsRepository';
import { SettingsEntity } from '../entities/SettingsEntity';
import { ISettingsEntityMapper } from '../entities/ISettingsEntityMapper';
import { IStoreService } from '../../../shared/domains/store/interfaces/IStoreService';
import { AppSettings } from '../../../shared/domains/settings/types';
import { SettingsStoreKey, SettingsDomain } from '../enums';
import { BaseRepository } from '../../core/BaseRepository';

export class SettingsRepository extends BaseRepository<SettingsEntity, AppSettings> implements ISettingsRepository {
  constructor(
    private storeService: IStoreService,
    mapper: ISettingsEntityMapper
  ) {
    super(mapper, SettingsDomain.SETTINGS);
  }

  async update(settings: SettingsEntity): Promise<SettingsEntity> {
    await this.storeService.set(SettingsStoreKey.SETTINGS, this.mapper.toDTO(settings));
    return settings;
  }

  async get(): Promise<SettingsEntity | null> {
    const dto = await this.storeService.get<AppSettings>(SettingsStoreKey.SETTINGS);
    return dto ? this.mapper.fromDTO(dto) : null;
  }
}
