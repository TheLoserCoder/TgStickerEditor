import { ProcessingSettings } from '@/shared/domains/image-processing/types';
import { PresetValidationError } from '../enums';

export class EditorPresetValidator {
  static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error(PresetValidationError.EMPTY_NAME);
    }
  }

  static validateSettings(settings: ProcessingSettings): void {
    if (!settings || typeof settings !== 'object') {
      throw new Error(PresetValidationError.INVALID_SETTINGS);
    }
  }
}
