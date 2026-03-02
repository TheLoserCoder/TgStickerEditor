import { IEditorPresetRepository } from './IEditorPresetRepository';
import { EditorPresetEntity } from '../entities/EditorPresetEntity';
import { IEditorPresetEntityMapper } from '../entities/IEditorPresetEntityMapper';
import { IStoreService } from '@/shared/domains/store/interfaces/IStoreService';
import { EditorPreset } from '@/shared/domains/editor-preset/types';
import { PresetStoreKey, PresetDomain } from '../enums';
import { BaseRepository } from '../../core/BaseRepository';

export class EditorPresetRepository extends BaseRepository<EditorPresetEntity, EditorPreset> implements IEditorPresetRepository {
  constructor(
    private storeService: IStoreService,
    mapper: IEditorPresetEntityMapper
  ) {
    super(mapper, PresetDomain.EDITOR_PRESET);
  }

  async create(preset: EditorPresetEntity): Promise<EditorPresetEntity> {
    const presets = await this.getAll();
    const presetsMap = presets.reduce((acc, p) => {
      acc[p.id] = this.mapper.toDTO(p);
      return acc;
    }, {} as Record<string, EditorPreset>);

    presetsMap[preset.id] = this.mapper.toDTO(preset);
    await this.storeService.set(PresetStoreKey.PRESETS, presetsMap);
    return preset;
  }

  async getAll(): Promise<EditorPresetEntity[]> {
    const presetsMap = await this.storeService.get<Record<string, EditorPreset>>(PresetStoreKey.PRESETS) || {};
    return Object.values(presetsMap).map(dto => this.mapper.fromDTO(dto));
  }

  async getById(id: string): Promise<EditorPresetEntity | null> {
    const presetsMap = await this.storeService.get<Record<string, EditorPreset>>(PresetStoreKey.PRESETS) || {};
    const dto = presetsMap[id];
    return dto ? this.mapper.fromDTO(dto) : null;
  }

  async update(id: string, preset: EditorPresetEntity): Promise<EditorPresetEntity> {
    const presetsMap = await this.storeService.get<Record<string, EditorPreset>>(PresetStoreKey.PRESETS) || {};
    presetsMap[id] = this.mapper.toDTO(preset);
    await this.storeService.set(PresetStoreKey.PRESETS, presetsMap);
    return preset;
  }

  async delete(id: string): Promise<void> {
    const presetsMap = await this.storeService.get<Record<string, EditorPreset>>(PresetStoreKey.PRESETS) || {};
    delete presetsMap[id];
    await this.storeService.set(PresetStoreKey.PRESETS, presetsMap);
  }
}
