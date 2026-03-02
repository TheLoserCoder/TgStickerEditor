import { EditorPresetEntity } from './EditorPresetEntity';
import { EditorPreset } from '@/shared/domains/editor-preset/types';
import { ProcessingSettings } from '@/shared/domains/image-processing/types';

export interface IEditorPresetEntityFactory {
  create(name: string, settings: ProcessingSettings): EditorPresetEntity;
  fromDTO(dto: EditorPreset): EditorPresetEntity;
}
