import sharp from 'sharp';
import { ImageFragment } from '@/shared/domains/image-processing/types';

interface PaddingFragmentInput {
  fragmentPath: string;
  cellSize: number;
  isAnimated: boolean;
  fragment: ImageFragment;
}

export async function execute(input: PaddingFragmentInput): Promise<ImageFragment> {
  const paddingSize = Math.floor(input.cellSize * 0.1);
  const contentSize = input.cellSize - (2 * paddingSize);
  
  const outputPath = input.fragmentPath.replace('.webp', '_padded.webp');

  if (!input.isAnimated) {
    await sharp(input.fragmentPath)
      .resize(input.cellSize, contentSize, { fit: 'fill' })
      .extend({
        top: paddingSize,
        bottom: paddingSize,
        left: 0,
        right: 0,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp({ lossless: true })
      .toFile(outputPath);
  } else {
    await sharp(input.fragmentPath, { animated: true, pages: -1, limitInputPixels: false })
      .resize(input.cellSize, contentSize, { fit: 'fill' })
      .extend({
        top: paddingSize,
        bottom: paddingSize,
        left: 0,
        right: 0,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp({ lossless: false, quality: 90 })
      .toFile(outputPath);
  }

  return {
    ...input.fragment,
    tempPath: outputPath
  };
}
