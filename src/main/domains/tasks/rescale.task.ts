import { TrimmedImage, RescaledImage } from '@/shared/domains/image-processing/types';
import { StickerPackType } from '@/shared/domains/sticker-pack/enums';
import { SharpAdapter } from '@/main/domains/media-processing/adapters/SharpAdapter';
import sharp from 'sharp';
import path from 'path';
import { nanoid } from 'nanoid';

const STICKER_SIZE = 512;
const EMOJI_SIZE = 100;
const BORDER_SIZE = 2;

export async function execute(input: TrimmedImage): Promise<RescaledImage> {
  const startTime = Date.now();
  console.log(`[rescale] START: ${input.originalFileName}, isAnimated=${input.isAnimated}`);
  
  const sharpAdapter = new SharpAdapter();
  const extension = input.format === 'gif' ? 'gif' : 'webp';
  const tempDir = path.dirname(input.tempPath);
  const uniqueId = nanoid();
  
  const cellSize = input.packType === StickerPackType.STICKER ? STICKER_SIZE : EMOJI_SIZE;
  const columns = input.settings.fragmentColumns;
  const rows = input.settings.fragmentRows;
  
  const canvasWidth = cellSize * columns;
  const canvasHeight = cellSize * rows;
  
  const availableWidth = canvasWidth - BORDER_SIZE * 2;
  const availableHeight = canvasHeight - BORDER_SIZE * 2;
  
  const scaleX = availableWidth / input.width;
  const scaleY = availableHeight / input.height;
  const scale = Math.min(scaleX, scaleY);
  
  const scaledWidth = Math.round(input.width * scale);
  const scaledHeight = Math.round(input.height * scale);

  const borderedWidth = scaledWidth + BORDER_SIZE * 2;
  const borderedHeight = scaledHeight + BORDER_SIZE * 2;
  
  const paddingLeft = Math.floor((canvasWidth - borderedWidth) / 2);
  const paddingTop = Math.floor((canvasHeight - borderedHeight) / 2);
  const paddingRight = canvasWidth - borderedWidth - paddingLeft;
  const paddingBottom = canvasHeight - borderedHeight - paddingTop;

  // Оптимизация: объединяем resize + extend в один pipeline
  const finalPath = path.join(tempDir, `${uniqueId}_rescale_final.${extension}`);
  const metadata = await sharpAdapter.getMetadata(input.tempPath);
  const isAnimated = !!metadata.pages && metadata.pages > 1;
  
  const pipelineStart = Date.now();
  const isUpscale = scale > 1;
  const scaleRatio = isUpscale ? scale : 1 / scale;
  const isHighQuality = input.settings.rescaleQuality === 'high';
  
  let pipeline = sharp(input.tempPath, { animated: isAnimated });
  
  if (isHighQuality) {
    pipeline = pipeline.pipelineColourspace('rgb16');
  }
  
  if (isHighQuality && !isUpscale && scaleRatio >= 3) {
    const intermediateWidth = Math.round(scaledWidth * 2);
    const intermediateHeight = Math.round(scaledHeight * 2);
    pipeline = pipeline
      .resize(intermediateWidth, intermediateHeight, { kernel: sharp.kernel.lanczos3, fit: 'fill' })
      .resize(scaledWidth, scaledHeight, { kernel: sharp.kernel.lanczos3, fit: 'fill' });
  } else {
    const kernel = isHighQuality ? sharp.kernel.lanczos3 : sharp.kernel.nearest;
    pipeline = pipeline.resize({
      width: scaledWidth,
      height: scaledHeight,
      fit: 'fill',
      kernel,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    });
  }
  
  if (isHighQuality) {
    pipeline = pipeline.toColourspace('srgb').sharpen({ sigma: 0.7, m1: 0.5, m2: 0.5 });
  }
  
  await pipeline
    .extend({
      top: paddingTop + BORDER_SIZE,
      bottom: paddingBottom + BORDER_SIZE,
      left: paddingLeft + BORDER_SIZE,
      right: paddingRight + BORDER_SIZE,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .webp({ quality: 80, effort: 4, loop: 0 })
    .toFile(finalPath);
  
  console.log(`[rescale] Combined pipeline: ${Date.now() - pipelineStart}ms`);
  console.log(`[rescale] DONE: ${Date.now() - startTime}ms total`);

  return {
    sessionId: input.sessionId,
    tempPath: finalPath,
    format: input.format,
    width: canvasWidth,
    height: canvasHeight,
    isAnimated: input.isAnimated,
    cellSize,
    originalFileName: input.originalFileName,
    packId: input.packId,
    packType: input.packType,
    groupId: input.groupId,
    settings: input.settings
  };
}
