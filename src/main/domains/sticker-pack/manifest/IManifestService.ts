import { StickerPackManifest, Fragment, ManifestUpdateData } from '../../../../shared/domains/sticker-pack/types';
import { StickerPackType } from '../../../../shared/domains/sticker-pack/enums';
import { GridEntity } from '../../grid/entities/GridEntity';

export interface IManifestService {
  create(folderPath: string, packId: string, name: string, type: StickerPackType): Promise<StickerPackManifest>;
  read(folderPath: string): Promise<StickerPackManifest | null>;
  update(folderPath: string, updates: ManifestUpdateData): Promise<StickerPackManifest>;
  updateWithGrid(folderPath: string, gridEntity: GridEntity): Promise<StickerPackManifest>;
  addFragmentToManifest(folderPath: string, fragment: Fragment): Promise<void>;
  addFragmentsBatch(folderPath: string, fragments: Fragment[]): Promise<void>;
  removeFragmentFromManifest(folderPath: string, fragmentId: string): Promise<string>;
  removeFragmentsBatch(folderPath: string, fragmentIds: string[]): Promise<string[]>;
  updateFragmentGroupInManifest(folderPath: string, fragmentId: string, groupId: string | null): Promise<void>;
  updateFragmentGroupBatch(folderPath: string, fragmentIds: string[], groupId: string | null): Promise<void>;
  getFragmentFileName(folderPath: string, fragmentId: string): Promise<string | null>;
}