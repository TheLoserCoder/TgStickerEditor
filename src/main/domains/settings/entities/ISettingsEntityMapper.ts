/**
 * ISettingsEntityMapper - интерфейс маппера для преобразования SettingsEntity ↔ DTO
 */

import { SettingsEntity } from './SettingsEntity';
import { AppSettings } from '@/shared/domains/settings/types';

export interface ISettingsEntityMapper {
  toDTO(entity: SettingsEntity): AppSettings;
  fromDTO(dto: AppSettings): SettingsEntity;
}
