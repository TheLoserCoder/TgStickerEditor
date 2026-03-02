import { IEditorPresetEntityFactory } from './IEditorPresetEntityFactory';
import { EditorPresetEntity } from './EditorPresetEntity';
import { EditorPreset } from '@/shared/domains/editor-preset/types';
import { ProcessingSettings } from '@/shared/domains/image-processing/types';
import { IIdGenerator } from '@/shared/utils/id-generator/IIdGenerator';

export class EditorPresetEntityFactory implements IEditorPresetEntityFactory {
  constructor(private idGenerator: IIdGenerator) {}

  create(name: string, settings: ProcessingSettings): EditorPresetEntity {
    const id = this.idGenerator.generate();
    return EditorPresetEntity.create(id, name, settings);
  }

  fromDTO(dto: EditorPreset): EditorPresetEntity {
    return EditorPresetEntity.fromStorage(dto.id, dto.name, dto.settings);
  }
}
