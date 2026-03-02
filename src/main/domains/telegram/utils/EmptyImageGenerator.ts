import sharp from 'sharp';
import { IEmptyImageGenerator } from './IEmptyImageGenerator';

export class EmptyImageGenerator implements IEmptyImageGenerator {
  async generate(size: number): Promise<Buffer> {
    return sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .png()
    .toBuffer();
  }
}
