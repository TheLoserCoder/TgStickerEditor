import { StickerPackType } from '../../../../shared/domains/sticker-pack/enums';
import { RescaleQuality } from '../../../../shared/domains/image-processing/enums';

export interface IRescaleUtility {
  rescale(
    inputPath: string,
    outputPath: string,
    packType: StickerPackType,
    columns: number,
    rows: number,
    quality: RescaleQuality
  ): Promise<{ width: number; height: number; cellSize: number }>;
}
