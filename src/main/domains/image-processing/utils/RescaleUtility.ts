import { IRescaleUtility } from './IRescaleUtility';
import { ISharpAdapter } from '../../media-processing/adapters/ISharpAdapter';
import { StickerPackType } from '../../../../shared/domains/sticker-pack/enums';
import { RescaleQuality } from '../../../../shared/domains/image-processing/enums';
import { ImageProcessingError, TelegramLimits } from '../enums';

export class RescaleUtility implements IRescaleUtility {
  constructor(private sharpAdapter: ISharpAdapter) {}

  async rescale(
    inputPath: string,
    outputPath: string,
    packType: StickerPackType,
    columns: number,
    rows: number,
    quality: RescaleQuality
  ): Promise<{ width: number; height: number; cellSize: number }> {
    try {
      const metadata = await this.sharpAdapter.getMetadata(inputPath);
      const width = metadata.width || 0;
      const height = metadata.height || 0;
      
      const cellSize = packType === StickerPackType.EMOJI 
        ? TelegramLimits.EMOJI_SIZE 
        : TelegramLimits.STICKER_SIZE;
      
      const borderSize = 2;
      const cellByWidth = (width + borderSize * 2) / columns;
      const cellByHeight = (height + borderSize * 2) / rows;
      const gridCellSize = Math.ceil(Math.max(cellByWidth, cellByHeight));
      
      const totalWidth = gridCellSize * columns;
      const totalHeight = gridCellSize * rows;
      
      const canvasWidth = totalWidth - borderSize * 2;
      const canvasHeight = totalHeight - borderSize * 2;
      
      const scaleW = canvasWidth / width;
      const scaleH = canvasHeight / height;
      const scale = Math.min(scaleW, scaleH);
      
      const scaledWidth = Math.round(width * scale);
      const scaledHeight = Math.round(height * scale);
      
      const kernel = this.getKernel(quality);
      
      await this.sharpAdapter.resize(inputPath, outputPath, {
        width: scaledWidth,
        height: scaledHeight,
        fit: 'fill',
        kernel
      });
      
      const finalWidth = cellSize * columns;
      const finalHeight = cellSize * rows;
      
      return { width: finalWidth, height: finalHeight, cellSize };
    } catch (error) {
      throw new Error(ImageProcessingError.RESCALE_FAILED);
    }
  }

  private getKernel(quality: RescaleQuality): string {
    switch (quality) {
      case RescaleQuality.SHARP:
        return 'lanczos3';
      case RescaleQuality.SMOOTH:
        return 'cubic';
      case RescaleQuality.NONE:
      default:
        return 'nearest';
    }
  }
}
