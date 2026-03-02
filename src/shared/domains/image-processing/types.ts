import { StickerPackType } from '../sticker-pack/enums';
import { ImageFormat, RescaleQuality } from './enums';

export interface ProcessingSettings {
  enableAnimation: boolean;
  enableTrim: boolean;
  rescaleQuality: RescaleQuality;
  fragmentColumns: number;
  fragmentRows: number;
}

export interface ImageInput {
  filePath: string;
  originalFileName: string;
  packId: string;
  packType: StickerPackType;
  groupId: string;
  settings: ProcessingSettings;
  ffmpegPath?: string;
}

export interface DetectedImage {
  sessionId: string;
  tempPath: string;
  format: ImageFormat;
  width: number;
  height: number;
  isAnimated: boolean;
  hasAlpha: boolean;
  duration?: number;
  originalFileName: string;
  packId: string;
  packType: StickerPackType;
  groupId: string;
  settings: ProcessingSettings;
}

export interface TrimmedImage {
  sessionId: string;
  tempPath: string;
  format: ImageFormat;
  width: number;
  height: number;
  isAnimated: boolean;
  hasAlpha: boolean;
  duration?: number;
  originalFileName: string;
  packId: string;
  packType: StickerPackType;
  groupId: string;
  settings: ProcessingSettings;
}

export interface RescaledImage {
  sessionId: string;
  tempPath: string;
  format: ImageFormat;
  width: number;
  height: number;
  isAnimated: boolean;
  cellSize: number;
  originalFileName: string;
  packId: string;
  packType: StickerPackType;
  groupId: string;
  settings: ProcessingSettings;
}

export interface ImageFragment {
  sessionId: string;
  fragmentId: string;
  tempPath: string;
  format: ImageFormat;
  width: number;
  height: number;
  isAnimated: boolean;
  row: number;
  col: number;
  originalFileName: string;
  packId: string;
  packType: StickerPackType;
  groupId: string;
}

export interface ConvertedFragment {
  sessionId: string;
  fragmentId: string;
  tempPath: string;
  fileName: string;
  format: ImageFormat;
  width: number;
  height: number;
  fileSize: number;
  row: number;
  col: number;
  packId: string;
  packType: StickerPackType;
  groupId: string;
}

export interface ProcessedFragment {
  id: string;
  fileName: string;
  tempPath: string;
  groupId: string;
}

export interface GridFragmentData {
  id: string;
  groupId: string;
  row: number;
  col: number;
}

export interface ProcessingResult {
  packId: string;
  packType: StickerPackType;
  fragments: ProcessedFragment[];
  gridData: GridFragmentData[];
}
