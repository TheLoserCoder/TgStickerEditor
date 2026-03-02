import { IFragmentUtility } from './IFragmentUtility';
import { ISharpAdapter } from '../../media-processing/adapters/ISharpAdapter';
import { ImageProcessingError } from '../enums';
import path from 'path';

export class FragmentUtility implements IFragmentUtility {
  constructor(private sharpAdapter: ISharpAdapter) {}

  async fragment(
    inputPath: string,
    outputDir: string,
    columns: number,
    rows: number,
    cellSize: number
  ): Promise<Array<{ path: string; row: number; col: number; width: number; height: number }>> {
    try {
      const metadata = await this.sharpAdapter.getMetadata(inputPath);
      const totalWidth = metadata.width || 0;
      const totalHeight = metadata.height || 0;
      
      const fragments: Array<{ path: string; row: number; col: number; width: number; height: number }> = [];
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          const left = col * cellSize;
          const top = row * cellSize;
          const width = Math.min(cellSize, totalWidth - left);
          const height = Math.min(cellSize, totalHeight - top);
          
          if (width <= 0 || height <= 0) continue;
          
          const outputPath = path.join(outputDir, `fragment_${row}_${col}.webp`);
          
          await this.sharpAdapter.extract(inputPath, outputPath, {
            left,
            top,
            width,
            height
          });
          
          fragments.push({ path: outputPath, row, col, width, height });
        }
      }
      
      return fragments;
    } catch (error) {
      throw new Error(ImageProcessingError.FRAGMENTATION_FAILED);
    }
  }
}
