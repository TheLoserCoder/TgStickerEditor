/**
 * SettingsEntityFactory - фабрика для создания SettingsEntity
 */

import { ISettingsEntityFactory } from './ISettingsEntityFactory';
import { SettingsEntity } from './SettingsEntity';
import { AppSettings, Theme } from '@/shared/domains/settings/types';

export class SettingsEntityFactory implements ISettingsEntityFactory {
  create(theme: Theme): SettingsEntity {
    return SettingsEntity.create(theme);
  }

  fromStorage(settings: Partial<AppSettings>): SettingsEntity {
    return SettingsEntity.fromStorage(settings);
  }

  fromDTO(dto: AppSettings): SettingsEntity {
    return SettingsEntity.create(dto.theme);
  }

  default(): SettingsEntity {
    return SettingsEntity.default();
  }
}
