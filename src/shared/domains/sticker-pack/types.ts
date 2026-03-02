import { StickerPackType } from './enums';
import { GridLayout } from '../grid/types';
import { FragmentUploadStatus, TelegramPackInfo } from '../telegram/types';

export type Fragment = {
  id: string;
  fileName: string;
  groupId: string | null;
  uploadStatus?: FragmentUploadStatus;
};

export type GridCell = {
  cellId: string;
  fragmentId: string | null;
  row: number;
  col: number;
  fileId?: string;
  uploadStatus?: string;
};

export type StickerPackManifest = {
  id: string;
  name: string;
  type: StickerPackType;
  createdAt: string;
  updatedAt: string;
  fragments: Fragment[];
  gridLayout?: GridLayout;
  telegramPack?: TelegramPackInfo;
};

export type ManifestUpdateData = {
  name?: string;
  fragments?: Fragment[];
  gridLayout?: GridLayout;
  telegramPack?: TelegramPackInfo;
};

export type StickerPackInfrastructureDTO = {
  id: string;
  title: string;
  folderName: string;
};

export type StickerPack = StickerPackManifest;
