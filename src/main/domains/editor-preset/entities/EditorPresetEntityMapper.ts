import { IEditorPresetEntityMapper } from './IEditorPresetEntityMapper';
import { EditorPresetEntity } from './EditorPresetEntity';
import { EditorPreset } from '@/shared/domains/editor-preset/types';

export class EditorPresetEntityMapper implements IEditorPresetEntityMapper {
  toDTO(entity: EditorPresetEntity): EditorPreset {
    return {
      id: entity.id,
      name: entity.name,
      settings: entity.settings,
    };
  }

  fromDTO(dto: EditorPreset): EditorPresetEntity {
    return EditorPresetEntity.fromStorage(dto.id, dto.name, dto.settings);
  }
}
