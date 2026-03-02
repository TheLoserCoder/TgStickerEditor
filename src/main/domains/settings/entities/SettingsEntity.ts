import { AppSettings, Theme } from '@/shared/domains/settings/types';
import { SettingsValidationError, DefaultTheme } from '../enums';

export class SettingsEntity {
  private static readonly VALID_THEMES: Theme[] = ['light', 'dark', 'system'];

  private constructor(public readonly theme: Theme) {}

  static create(theme: Theme): SettingsEntity {
    if (!this.VALID_THEMES.includes(theme)) {
      throw new Error(`${SettingsValidationError.INVALID_THEME}: ${theme}`);
    }
    return new SettingsEntity(theme);
  }

  static fromStorage(settings: Partial<AppSettings>): SettingsEntity {
    return new SettingsEntity(settings.theme ?? DefaultTheme.SYSTEM);
  }

  static default(): SettingsEntity {
    return new SettingsEntity(DefaultTheme.SYSTEM);
  }

  toDTO(): AppSettings {
    return {
      theme: this.theme,
    };
  }
}
