import { EditorPreset } from '../types';
import { ProcessingSettings } from '../../image-processing/types';

export interface IEditorPresetService {
  create(name: string, settings: ProcessingSettings): Promise<EditorPreset>;
  getAll(): Promise<EditorPreset[]>;
  getById(id: string): Promise<EditorPreset | null>;
  update(id: string, updates: Partial<Omit<EditorPreset, 'id'>>): Promise<EditorPreset>;
  delete(id: string): Promise<void>;
}
