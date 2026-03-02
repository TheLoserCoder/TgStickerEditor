import { EditorPresetEntity } from '../entities/EditorPresetEntity';

export interface IEditorPresetRepository {
  create(preset: EditorPresetEntity): Promise<EditorPresetEntity>;
  getAll(): Promise<EditorPresetEntity[]>;
  getById(id: string): Promise<EditorPresetEntity | null>;
  update(id: string, preset: EditorPresetEntity): Promise<EditorPresetEntity>;
  delete(id: string): Promise<void>;
}
