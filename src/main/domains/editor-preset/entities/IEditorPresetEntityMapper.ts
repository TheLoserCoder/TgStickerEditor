import { EditorPresetEntity } from './EditorPresetEntity';
import { EditorPreset } from '@/shared/domains/editor-preset/types';

export interface IEditorPresetEntityMapper {
  toDTO(entity: EditorPresetEntity): EditorPreset;
  fromDTO(dto: EditorPreset): EditorPresetEntity;
}
