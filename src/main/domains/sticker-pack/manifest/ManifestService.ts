import { IManifestService } from './IManifestService';
import { StickerPackManifest, Fragment, ManifestUpdateData } from '@/shared/domains/sticker-pack/types';
import { StickerPackType, ManifestValidationError } from '@/shared/domains/sticker-pack/enums';
import { IManifestRepository } from './IManifestRepository';
import { IManifestEntityMapper } from './IManifestEntityMapper';
import { ManifestEntity } from './ManifestEntity';
import { GridEntity } from '../../grid/entities/GridEntity';
import { IGridEntityMapper } from '../../grid/entities/IGridEntityMapper';

export class ManifestService implements IManifestService {
  constructor(
    private manifestRepo: IManifestRepository,
    private mapper: IManifestEntityMapper,
    private gridMapper: IGridEntityMapper
  ) {}

  async create(folderPath: string, packId: string, name: string, type: StickerPackType): Promise<StickerPackManifest> {
    const manifest = ManifestEntity.create(packId, name, type);
    const created = await this.manifestRepo.create(folderPath, manifest);
    return this.mapper.toDTO(created);
  }

  async read(folderPath: string): Promise<StickerPackManifest | null> {
    const entity = await this.manifestRepo.get(folderPath);
    return entity ? this.mapper.toDTO(entity) : null;
  }

  async update(folderPath: string, updates: ManifestUpdateData): Promise<StickerPackManifest> {
    const entity = await this.manifestRepo.get(folderPath);
    if (!entity) {
      throw new Error(ManifestValidationError.MANIFEST_NOT_FOUND);
    }
    
    entity.update(updates);
    const updated = await this.manifestRepo.update(folderPath, entity);
    return this.mapper.toDTO(updated);
  }

  async addFragmentToManifest(folderPath: string, fragment: Fragment): Promise<void> {
    const entity = await this.manifestRepo.get(folderPath);
    if (!entity) {
      throw new Error(ManifestValidationError.MANIFEST_NOT_FOUND);
    }

    entity.addFragment(fragment);
    await this.manifestRepo.update(folderPath, entity);
  }

  async addFragmentsBatch(folderPath: string, fragments: Fragment[]): Promise<void> {
    const entity = await this.manifestRepo.get(folderPath);
    if (!entity) {
      throw new Error(ManifestValidationError.MANIFEST_NOT_FOUND);
    }

    for (const fragment of fragments) {
      entity.addFragment(fragment);
    }
    await this.manifestRepo.update(folderPath, entity);
  }

  async removeFragmentFromManifest(folderPath: string, fragmentId: string): Promise<string> {
    const entity = await this.manifestRepo.get(folderPath);
    if (!entity) {
      throw new Error(ManifestValidationError.MANIFEST_NOT_FOUND);
    }

    const fragment = entity.fragments.find(f => f.id === fragmentId);
    
    if (!fragment) {
      throw new Error(ManifestValidationError.FRAGMENT_NOT_FOUND);
    }

    const fileName = fragment.fileName;
    entity.removeFragment(fragmentId);
    await this.manifestRepo.update(folderPath, entity);
    
    return fileName;
  }

  async updateFragmentGroupInManifest(folderPath: string, fragmentId: string, groupId: string | null): Promise<void> {
    const entity = await this.manifestRepo.get(folderPath);
    if (!entity) {
      throw new Error(ManifestValidationError.MANIFEST_NOT_FOUND);
    }

    entity.updateFragmentGroup(fragmentId, groupId);
    await this.manifestRepo.update(folderPath, entity);
  }

  async getFragmentFileName(folderPath: string, fragmentId: string): Promise<string | null> {
    const entity = await this.manifestRepo.get(folderPath);
    if (!entity) {
      return null;
    }

    const fragment = entity.fragments.find(f => f.id === fragmentId);
    return fragment?.fileName || null;
  }

  async updateWithGrid(folderPath: string, gridEntity: GridEntity): Promise<StickerPackManifest> {
    const entity = await this.manifestRepo.get(folderPath);
    if (!entity) {
      throw new Error(ManifestValidationError.MANIFEST_NOT_FOUND);
    }

    const gridLayout = this.gridMapper.toDTO(gridEntity);
    entity.update({ gridLayout });
    const updated = await this.manifestRepo.update(folderPath, entity);
    return this.mapper.toDTO(updated);
  }

  async removeFragmentsBatch(folderPath: string, fragmentIds: string[]): Promise<string[]> {
    const entity = await this.manifestRepo.get(folderPath);
    if (!entity) {
      throw new Error(ManifestValidationError.MANIFEST_NOT_FOUND);
    }

    const fileNames: string[] = [];
    for (const fragmentId of fragmentIds) {
      const fragment = entity.fragments.find(f => f.id === fragmentId);
      if (fragment) {
        fileNames.push(fragment.fileName);
        entity.removeFragment(fragmentId);
      }
    }

    await this.manifestRepo.update(folderPath, entity);
    return fileNames;
  }

  async updateFragmentGroupBatch(folderPath: string, fragmentIds: string[], groupId: string | null): Promise<void> {
    const entity = await this.manifestRepo.get(folderPath);
    if (!entity) {
      throw new Error(ManifestValidationError.MANIFEST_NOT_FOUND);
    }

    for (const fragmentId of fragmentIds) {
      entity.updateFragmentGroup(fragmentId, groupId);
    }

    await this.manifestRepo.update(folderPath, entity);
  }
}
