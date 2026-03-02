import { ProcessingSettings } from '@/shared/domains/image-processing/types';
import { EditorPresetValidator } from './EditorPresetValidator';

export class EditorPresetEntity {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly settings: ProcessingSettings
  ) {}

  static create(id: string, name: string, settings: ProcessingSettings): EditorPresetEntity {
    EditorPresetValidator.validateName(name);
    EditorPresetValidator.validateSettings(settings);
    return new EditorPresetEntity(id, name.trim(), settings);
  }

  static fromStorage(id: string, name: string, settings: ProcessingSettings): EditorPresetEntity {
    return new EditorPresetEntity(id, name, settings);
  }
}
