import { GridEntity } from '../entities/GridEntity';
import { GridLayout } from '../../../../shared/domains/grid/types';
import { StickerPackType } from '../../../../../shared/domains/sticker-pack/enums';

export interface FragmentInput {
  id: string;
  groupId?: string;
  row?: number;
  col?: number;
}

export interface IGridService {
  initializeGrid(packId: string, packType: StickerPackType, fragments: FragmentInput[]): GridEntity;
  loadGrid(packId: string, packType: StickerPackType, layout: GridLayout, validFragmentIds?: string[]): GridEntity;
  addFragments(currentGrid: GridEntity, newFragments: FragmentInput[]): GridEntity;
  moveGroup(currentGrid: GridEntity, groupId: string, targetRow: number, targetCol: number): GridEntity;
  moveSingleFragment(currentGrid: GridEntity, fragmentId: string, targetRow: number, targetCol: number): GridEntity;
  moveFragment(currentGrid: GridEntity, fragmentId: string, targetRow: number, targetCol: number): GridEntity;
  clearCell(currentGrid: GridEntity, fragmentId: string): GridEntity;
  removeGroup(currentGrid: GridEntity, groupId: string): GridEntity;
  createGroupFromFragments(currentGrid: GridEntity, cellIds: string[], newGroupId: string): GridEntity;
  removeFragmentsFromGroup(currentGrid: GridEntity, cellIds: string[]): GridEntity;
  deleteFragments(currentGrid: GridEntity, fragmentIds: string[]): GridEntity;
  normalizeGrid(currentGrid: GridEntity): GridEntity;
}
