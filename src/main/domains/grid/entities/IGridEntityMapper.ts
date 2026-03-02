import { GridEntity } from './GridEntity';
import { GridLayout } from '../../../../../shared/domains/grid/types';
import { StickerPackType } from '../../../../../shared/domains/sticker-pack/enums';

export interface IGridEntityMapper {
  toEntity(packId: string, packType: StickerPackType, layout: GridLayout): GridEntity;
  toDTO(entity: GridEntity): GridLayout;
}
