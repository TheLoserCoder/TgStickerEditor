import { ITrimUtility } from './ITrimUtility';
import { ISharpAdapter } from '../../media-processing/adapters/ISharpAdapter';
import { ImageProcessingError } from '../enums';
import { TRIM_THRESHOLD } from '../constants';

export class TrimUtility implements ITrimUtility {
  constructor(private sharpAdapter: ISharpAdapter) {}

  async trimStatic(inputPath: string, outputPath: string): Promise<{ width: number; height: number }> {
    try {
      await this.sharpAdapter.trim(inputPath, outputPath, TRIM_THRESHOLD);
      const metadata = await this.sharpAdapter.getMetadata(outputPath);
      return { width: metadata.width || 0, height: metadata.height || 0 };
    } catch (error) {
      throw new Error(ImageProcessingError.TRIM_FAILED);
    }
  }

  async trimAnimated(inputPath: string, outputPath: string): Promise<{ width: number; height: number }> {
    try {
      const metadata = await this.sharpAdapter.getMetadata(inputPath);
      const pages = metadata.pages || 1;
      
      let minLeft = Infinity;
      let minTop = Infinity;
      let maxRight = 0;
      let maxBottom = 0;
      
      for (let page = 0; page < pages; page++) {
        const frameMetadata = await this.sharpAdapter.getMetadata(inputPath);
        const width = frameMetadata.width || 0;
        const height = frameMetadata.height || 0;
        
        minLeft = Math.min(minLeft, 0);
        minTop = Math.min(minTop, 0);
        maxRight = Math.max(maxRight, width);
        maxBottom = Math.max(maxBottom, height);
      }
      
      const cropWidth = maxRight - minLeft;
      const cropHeight = maxBottom - minTop;
      
      await this.sharpAdapter.extract(inputPath, outputPath, {
        left: minLeft,
        top: minTop,
        width: cropWidth,
        height: cropHeight
      });
      
      return { width: cropWidth, height: cropHeight };
    } catch (error) {
      throw new Error(ImageProcessingError.TRIM_FAILED);
    }
  }
}
