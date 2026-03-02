/**
 * SettingsEntityMapper - маппер для преобразования SettingsEntity ↔ DTO
 */

import { ISettingsEntityMapper } from './ISettingsEntityMapper';
import { SettingsEntity } from './SettingsEntity';
import { AppSettings } from '@/shared/domains/settings/types';

export class SettingsEntityMapper implements ISettingsEntityMapper {
  toDTO(entity: SettingsEntity): AppSettings {
    return entity.toDTO();
  }

  fromDTO(dto: AppSettings): SettingsEntity {
    return SettingsEntity.fromStorage(dto);
  }
}
