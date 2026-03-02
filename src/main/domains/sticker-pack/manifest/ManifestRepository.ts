import { IManifestRepository } from './IManifestRepository';
import { ManifestEntity } from './ManifestEntity';
import { IManifestEntityMapper } from './IManifestEntityMapper';
import { StickerPackManifest } from '../../../../shared/domains/sticker-pack/types';
import { StickerPackFileName, ManifestDomain } from '../../../../shared/domains/sticker-pack/enums';
import { IFileSystemService } from '../../filesystem/services/IFileSystemService';
import { BaseRepository } from '../../core/BaseRepository';
import * as path from 'path';

export class ManifestRepository extends BaseRepository<ManifestEntity, StickerPackManifest> implements IManifestRepository {
  constructor(
    private fileSystem: IFileSystemService,
    mapper: IManifestEntityMapper
  ) {
    super(mapper, ManifestDomain.MANIFESTS);
  }

  async create(folderPath: string, manifest: ManifestEntity): Promise<ManifestEntity> {
    const filePath = path.join(folderPath, StickerPackFileName.MANIFEST);
    const dto = this.mapper.toDTO(manifest);
    await this.fileSystem.writeFile(filePath, JSON.stringify(dto, null, 2));
    return manifest;
  }

  async update(folderPath: string, manifest: ManifestEntity): Promise<ManifestEntity> {
    const filePath = path.join(folderPath, StickerPackFileName.MANIFEST);
    const dto = this.mapper.toDTO(manifest);
    await this.fileSystem.writeFile(filePath, JSON.stringify(dto, null, 2));
    return manifest;
  }

  async get(folderPath: string): Promise<ManifestEntity | null> {
    const filePath = path.join(folderPath, StickerPackFileName.MANIFEST);
    const exists = await this.fileSystem.exists(filePath);
    
    if (!exists) {
      return null;
    }
    
    const data = await this.fileSystem.readFile(filePath);
    const dto = JSON.parse(data);
    return this.mapper.fromDTO(dto);
  }
}
