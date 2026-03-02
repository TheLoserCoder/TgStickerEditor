/**
 * ISettingsEntityFactory - интерфейс фабрики для создания SettingsEntity
 */

import { SettingsEntity } from '../SettingsEntity';
import { AppSettings, Theme } from '@/shared/domains/settings/types';

export interface ISettingsEntityFactory {
  create(theme: Theme): SettingsEntity;
  fromStorage(settings: Partial<AppSettings>): SettingsEntity;
  fromDTO(dto: AppSettings): SettingsEntity;
  default(): SettingsEntity;
}
