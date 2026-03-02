import { StickerPackManifest, Fragment, ManifestUpdateData } from '../types';
import { StickerPackType } from '../enums';
import { GridLayout } from '../../grid/types';

export interface IStickerPackFacade {
  createPack(name: string, type: StickerPackType): Promise<StickerPackManifest>;
  getPack(id: string): Promise<StickerPackManifest | null>;
  getAllPacks(): Promise<StickerPackManifest[]>;
  deletePack(id: string): Promise<void>;
  updatePackManifest(id: string, updates: ManifestUpdateData): Promise<StickerPackManifest>;
  openPackFolder(id: string): Promise<void>;
  getStickerPackPath(id: string): Promise<string>;
  
  addFragment(packId: string, sourceFilePath: string, fileName: string, groupId?: string): Promise<Fragment>;
  addFragments(packId: string, fragments: Array<{tempPath: string; fileName: string; groupId: string}>, gridData: Array<{id: string; groupId: string; row: number; col: number}>): Promise<GridLayout>;
  removeFragment(packId: string, fragmentId: string): Promise<void>;
  updateFragmentGroup(packId: string, fragmentId: string, groupId: string | null): Promise<Fragment>;
  getFragmentPath(packId: string, fragmentId: string): Promise<string | null>;

  initializeGrid(packId: string): Promise<GridLayout>;
  getGrid(packId: string): Promise<GridLayout | null>;
  addFragmentsToGrid(packId: string, fragmentIds: string[]): Promise<GridLayout>;
  moveGroupInGrid(packId: string, groupId: string, row: number, col: number): Promise<GridLayout>;
  moveSingleFragmentInGrid(packId: string, fragmentId: string, row: number, col: number): Promise<GridLayout>;
  moveFragmentInGrid(packId: string, fragmentId: string, row: number, col: number): Promise<GridLayout>;
  clearCellInGrid(packId: string, fragmentId: string): Promise<GridLayout>;
  removeGroupFromGrid(packId: string, groupId: string): Promise<GridLayout>;
  createGroupFromFragments(packId: string, cellIds: string[]): Promise<GridLayout>;
  removeFragmentsFromGroup(packId: string, cellIds: string[]): Promise<GridLayout>;
  deleteFragments(packId: string, fragmentIds: string[]): Promise<GridLayout>;
  deleteGroupWithFragments(packId: string, groupId: string): Promise<GridLayout>;
  deleteGroupKeepFragments(packId: string, groupId: string): Promise<GridLayout>;
  normalizeGrid(packId: string): Promise<GridLayout>;
}
