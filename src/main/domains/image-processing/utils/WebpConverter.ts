import { IWebpConverter } from './IWebpConverter';
import { ISharpAdapter } from '../../media-processing/adapters/ISharpAdapter';
import { IFileSystemService } from '../../filesystem/IFileSystemService';
import { ImageProcessingError, TelegramLimits } from '../enums';
import { WEBP_QUALITY, WEBP_ALPHA_QUALITY, WEBP_EFFORT } from '../constants';

export class WebpConverter implements IWebpConverter {
  constructor(
    private sharpAdapter: ISharpAdapter,
    private fileSystem: IFileSystemService
  ) {}

  async convert(inputPath: string, outputPath: string, isAnimated: boolean): Promise<number> {
    try {
      await this.sharpAdapter.convert(inputPath, outputPath, {
        format: 'webp',
        quality: WEBP_QUALITY,
        alphaQuality: WEBP_ALPHA_QUALITY,
        effort: WEBP_EFFORT,
        animated: isAnimated
      });
      
      const stats = await this.fileSystem.readFile(outputPath);
      const fileSize = stats.length;
      
      if (!this.validateSize(fileSize, isAnimated)) {
        throw new Error(ImageProcessingError.FILE_SIZE_EXCEEDED);
      }
      
      return fileSize;
    } catch (error) {
      if (error instanceof Error && error.message === ImageProcessingError.FILE_SIZE_EXCEEDED) {
        throw error;
      }
      throw new Error(ImageProcessingError.WEBP_CONVERSION_FAILED);
    }
  }

  validateSize(fileSize: number, isAnimated: boolean): boolean {
    const limit = isAnimated ? TelegramLimits.VIDEO_MAX_SIZE : TelegramLimits.STATIC_MAX_SIZE;
    return fileSize <= limit;
  }
}
