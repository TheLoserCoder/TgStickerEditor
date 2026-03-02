import { AppSettings, Theme } from '../../../shared/domains/settings/types';

export const SETTINGS_SERVICE_TOKEN = 'SettingsService';
export const SETTINGS_REPOSITORY_TOKEN = 'SettingsRepository';
export const SETTINGS_ENTITY_FACTORY_TOKEN = 'SettingsEntityFactory';
export const SETTINGS_ENTITY_MAPPER_TOKEN = 'SettingsEntityMapper';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system' as Theme,
};
