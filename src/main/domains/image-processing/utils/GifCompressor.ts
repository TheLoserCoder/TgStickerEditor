import { IGifCompressor } from './IGifCompressor';
import { IFFmpegAdapter } from '../../media-processing/adapters/IFFmpegAdapter';
import { ImageProcessingError } from '../enums';
import { GIF_MIN_SPEED_FACTOR, GIF_TARGET_FPS } from '../constants';

export class GifCompressor implements IGifCompressor {
  constructor(private ffmpegAdapter: IFFmpegAdapter) {}

  async compress(inputPath: string, outputPath: string, targetDuration: number): Promise<void> {
    try {
      const metadata = await this.ffmpegAdapter.getMetadata(inputPath);
      const currentDuration = metadata.duration || 0;
      
      if (currentDuration <= targetDuration) {
        return;
      }
      
      const speedFactor = targetDuration / currentDuration;
      
      if (speedFactor >= GIF_MIN_SPEED_FACTOR) {
        await this.ffmpegAdapter.adjustDuration(inputPath, outputPath, targetDuration);
      } else {
        const frameSkip = Math.ceil(1 / speedFactor);
        await this.compressWithFrameSkip(inputPath, outputPath, frameSkip);
      }
    } catch (error) {
      throw new Error(ImageProcessingError.GIF_COMPRESSION_FAILED);
    }
  }

  private async compressWithFrameSkip(
    inputPath: string,
    outputPath: string,
    frameSkip: number
  ): Promise<void> {
    const fps = GIF_TARGET_FPS / frameSkip;
    await this.ffmpegAdapter.convert(inputPath, outputPath, {
      fps,
      format: 'gif'
    });
  }
}
