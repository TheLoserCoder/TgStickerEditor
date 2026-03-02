import { SettingsEntity } from '../entities/SettingsEntity';

export interface ISettingsRepository {
  update(settings: SettingsEntity): Promise<SettingsEntity>;
  get(): Promise<SettingsEntity | null>;
}
