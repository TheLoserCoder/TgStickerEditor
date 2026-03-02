import { IAnimationDetector } from './IAnimationDetector';
import { ISharpAdapter } from '../../media-processing/adapters/ISharpAdapter';
import { IFileSystemService } from '../../filesystem/IFileSystemService';
import { ImageProcessingError } from '../enums';
import { APNG_SIGNATURE } from '../constants';

export class AnimationDetector implements IAnimationDetector {
  constructor(
    private sharpAdapter: ISharpAdapter,
    private fileSystem: IFileSystemService
  ) {}

  async isAnimated(filePath: string): Promise<boolean> {
    try {
      const metadata = await this.sharpAdapter.getMetadata(filePath);
      
      if (metadata.format === 'gif' && metadata.pages && metadata.pages > 1) {
        return true;
      }
      
      if (metadata.format === 'webp' && metadata.pages && metadata.pages > 1) {
        return true;
      }
      
      if (metadata.format === 'png') {
        return await this.detectApng(filePath);
      }
      
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`${ImageProcessingError.DETECTION_FAILED}: ${message}`);
    }
  }

  async detectApng(filePath: string): Promise<boolean> {
    try {
      const buffer = await this.fileSystem.readFile(filePath);
      
      const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      if (!buffer.subarray(0, 8).equals(pngSignature)) {
        return false;
      }
      
      let offset = 8;
      while (offset < buffer.length) {
        if (offset + 8 > buffer.length) break;
        
        const chunkLength = buffer.readUInt32BE(offset);
        const chunkType = buffer.subarray(offset + 4, offset + 8);
        
        if (chunkType.equals(APNG_SIGNATURE)) {
          return true;
        }
        
        if (chunkType.equals(Buffer.from('IDAT'))) {
          break;
        }
        
        offset += 12 + chunkLength;
      }
      
      return false;
    } catch (error) {
      throw new Error(ImageProcessingError.APNG_DETECTION_FAILED);
    }
  }
}
