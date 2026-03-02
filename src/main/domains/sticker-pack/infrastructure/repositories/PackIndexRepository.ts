import { IPackIndexRepository } from './IPackIndexRepository';
import { StickerPackEntity } from '../entities/StickerPackEntity';
import { IStickerPackEntityMapper } from '../entities/IStickerPackEntityMapper';
import { StickerPackStoreKey, StickerPackDomain } from '../../../../../shared/domains/sticker-pack/enums';
import { StickerPackInfrastructureDTO } from '../../../../../shared/domains/sticker-pack/types';
import { IStoreService } from '../../../../../shared/domains/store/interfaces/IStoreService';
import { BaseRepository } from '../../../core/BaseRepository';

type PackIndex = Record<string, StickerPackInfrastructureDTO>;

export class PackIndexRepository extends BaseRepository<StickerPackEntity, StickerPackInfrastructureDTO> implements IPackIndexRepository {
  constructor(
    private readonly storeService: IStoreService,
    mapper: IStickerPackEntityMapper
  ) {
    super(mapper, StickerPackDomain.STICKER_PACKS);
  }

  async create(pack: StickerPackEntity): Promise<StickerPackEntity> {
    await this.updateIndex((index) => {
      const dto = this.mapper.toDTO(pack);
      index[dto.id] = dto;
    });
    return pack;
  }

  async update(pack: StickerPackEntity): Promise<StickerPackEntity> {
    await this.updateIndex((index) => {
      const dto = this.mapper.toDTO(pack);
      index[dto.id] = dto;
    });
    return pack;
  }

  async delete(packId: string): Promise<{ id: string }> {
    await this.updateIndex((index) => {
      delete index[packId];
    });
    return { id: packId };
  }

  async get(packId: string): Promise<StickerPackEntity | null> {
    const index = await this.getIndex();
    const dto = index[packId];
    return dto ? this.mapper.fromDTO(dto) : null;
  }

  async getAll(): Promise<StickerPackEntity[]> {
    const index = await this.getIndex();
    return Object.values(index).map(dto => this.mapper.fromDTO(dto));
  }

  private async updateIndex(action: (index: PackIndex) => void): Promise<void> {
    const index = await this.getIndex();
    action(index);
    await this.storeService.set(StickerPackStoreKey.INDEX, index);
  }

  private async getIndex(): Promise<PackIndex> {
    return await this.storeService.get<PackIndex>(StickerPackStoreKey.INDEX) ?? {};
  }
}
