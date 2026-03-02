import { IStickerPackService } from './IStickerPackService';
import { IPackIndexRepository } from './repositories/IPackIndexRepository';
import { IPackStorageRepository } from './repositories/IPackStorageRepository';
import { IStickerPackEntityFactory } from './entities/IStickerPackEntityFactory';
import { IStickerPackEntityMapper } from './entities/IStickerPackEntityMapper';
import { StickerPackError } from '../../../../shared/domains/sticker-pack/enums';

export class StickerPackService implements IStickerPackService {
  constructor(
    private readonly indexRepo: IPackIndexRepository,
    private readonly storageRepo: IPackStorageRepository,
    private readonly entityFactory: IStickerPackEntityFactory,
    private readonly mapper: IStickerPackEntityMapper
  ) {}

  async createPackInfrastructure(packId: string, title: string): Promise<string> {
    const entity = this.entityFactory.create(packId, title);
    const dto = this.mapper.toDTO(entity);
    
    await this.storageRepo.createFolder(dto.folderName);
    await this.indexRepo.create(entity);
    
    return this.storageRepo.getFolderPath(dto.folderName);
  }

  async deletePackInfrastructure(packId: string): Promise<void> {
    const entity = await this.indexRepo.get(packId);
    
    if (!entity) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }
    
    const dto = this.mapper.toDTO(entity);
    await this.storageRepo.deleteFolder(dto.folderName);
    await this.indexRepo.delete(packId);
  }

  async getPackPath(packId: string): Promise<string | null> {
    const entity = await this.indexRepo.get(packId);
    if (!entity) return null;
    
    const dto = this.mapper.toDTO(entity);
    return this.storageRepo.getFolderPath(dto.folderName);
  }

  async getAllPackIds(): Promise<string[]> {
    const entities = await this.indexRepo.getAll();
    return entities.map(entity => this.mapper.toDTO(entity).id);
  }
}
