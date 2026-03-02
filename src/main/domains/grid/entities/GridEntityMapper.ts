import { IGridEntityMapper } from './IGridEntityMapper';
import { GridEntity } from './GridEntity';
import { GridLayout } from '../../../../../shared/domains/grid/types';
import { StickerPackType } from '../../../../../shared/domains/sticker-pack/enums';

export class GridEntityMapper implements IGridEntityMapper {
  toEntity(packId: string, packType: StickerPackType, layout: GridLayout): GridEntity {
    return GridEntity.fromStorage(packId, packType, layout);
  }

  toDTO(entity: GridEntity): GridLayout {
    return entity.toDTO();
  }
}
