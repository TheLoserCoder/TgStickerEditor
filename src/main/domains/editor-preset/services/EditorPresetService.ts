import { IEditorPresetService } from '@/shared/domains/editor-preset/interfaces/IEditorPresetService';
import { EditorPreset } from '@/shared/domains/editor-preset/types';
import { ProcessingSettings } from '@/shared/domains/image-processing/types';
import { IEditorPresetRepository } from '../repositories/IEditorPresetRepository';
import { IEditorPresetEntityFactory } from '../entities/IEditorPresetEntityFactory';
import { IEditorPresetEntityMapper } from '../entities/IEditorPresetEntityMapper';
import { PresetServiceError } from './enums';

export class EditorPresetService implements IEditorPresetService {
  constructor(
    private repository: IEditorPresetRepository,
    private entityFactory: IEditorPresetEntityFactory,
    private entityMapper: IEditorPresetEntityMapper
  ) {}

  async create(name: string, settings: ProcessingSettings): Promise<EditorPreset> {
    const entity = this.entityFactory.create(name, settings);
    const created = await this.repository.create(entity);
    return this.entityMapper.toDTO(created);
  }

  async getAll(): Promise<EditorPreset[]> {
    const entities = await this.repository.getAll();
    return entities.map(entity => this.entityMapper.toDTO(entity));
  }

  async getById(id: string): Promise<EditorPreset | null> {
    const entity = await this.repository.getById(id);
    return entity ? this.entityMapper.toDTO(entity) : null;
  }

  async update(id: string, updates: Partial<Omit<EditorPreset, 'id'>>): Promise<EditorPreset> {
    const existing = await this.repository.getById(id);
    if (!existing) {
      throw new Error(PresetServiceError.NOT_FOUND);
    }

    const dto = this.entityMapper.toDTO(existing);
    const updated = this.entityFactory.fromDTO({
      ...dto,
      ...updates,
    });

    const result = await this.repository.update(id, updated);
    return this.entityMapper.toDTO(result);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
