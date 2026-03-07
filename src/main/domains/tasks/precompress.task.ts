import { RescaledImage } from '@/shared/domains/image-processing/types';
import { SharpAdapter } from '@/main/domains/media-processing/adapters/SharpAdapter';
import { STATIC_TILE_LIMIT, VIDEO_TILE_LIMIT } from '@/main/domains/image-processing/constants';
import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

const QUALITY_MAX = 90;
const QUALITY_MIN = 10;

function estimateQuality(originalSize: number, targetSize: number): number {
  const ratio = targetSize / originalSize;
  const quality = Math.round(100 * Math.sqrt(ratio));
  return Math.max(QUALITY_MIN, Math.min(QUALITY_MAX, quality));
}

export async function execute(input: RescaledImage): Promise<RescaledImage> {
  const startTime = Date.now();
  console.log(`[precompress] START: ${input.originalFileName}, isAnimated=${input.isAnimated}`);
  
  try {
    if (!input.isAnimated) {
      console.log(`[precompress] SKIPPED: not animated`);
      return input;
    }

    const stats = await fs.stat(input.tempPath);
    const fileSize = stats.size;
    const totalTiles = input.settings.fragmentColumns * input.settings.fragmentRows;
    const limit = input.isAnimated ? VIDEO_TILE_LIMIT : STATIC_TILE_LIMIT;
    const maxSize = limit * totalTiles;

    console.log(`[precompress] fileSize=${fileSize}, maxSize=${maxSize}, totalTiles=${totalTiles}`);

    if (fileSize <= maxSize) {
      console.log(`[precompress] SKIPPED: file size within limits`);
      return input;
    }

    // Оценка начального quality
    const estimatedQuality = estimateQuality(fileSize, maxSize);
    console.log(`[precompress] Estimated quality: ${estimatedQuality} (ratio: ${(maxSize / fileSize).toFixed(2)})`);

    // Бинарный поиск quality с умной стартовой точкой
    const sharpAdapter = new SharpAdapter();
    const tempDir = path.dirname(input.tempPath);
    const uniqueId = nanoid();
    
    console.log(`[precompress] Reading input buffer...`);
    const readStart = Date.now();
    const inputBuffer = await fs.readFile(input.tempPath);
    console.log(`[precompress] Buffer read: ${Date.now() - readStart}ms, size=${inputBuffer.length}`);

    let minQuality = QUALITY_MIN;
    let maxQuality = QUALITY_MAX;
    let bestBuffer: Buffer | null = null;
    let bestQuality = QUALITY_MIN;

    // Сначала проверяем оценочное значение
    console.log(`[precompress] Testing estimated quality=${estimatedQuality}`);
    const estimateStart = Date.now();
    const estimatedBuffer = await sharpAdapter.convertBuffer(inputBuffer, {
      format: 'webp',
      quality: estimatedQuality,
      lossless: false,
      effort: 4,
      animated: true
    });
    console.log(`[precompress] Estimated compression: ${Date.now() - estimateStart}ms`);

    console.log(`[precompress] Estimated result: quality=${estimatedQuality}, size=${estimatedBuffer.length}`);

    if (estimatedBuffer.length <= maxSize) {
      // Оценка попала или меньше - ищем лучше
      bestBuffer = estimatedBuffer;
      bestQuality = estimatedQuality;
      minQuality = estimatedQuality + 1;
    } else {
      // Оценка больше - ищем ниже
      maxQuality = estimatedQuality - 1;
    }

    // Бинарный поиск в оставшемся диапазоне
    console.log(`[precompress] Binary search: quality range ${minQuality}-${maxQuality}`);

    while (minQuality <= maxQuality) {
      const quality = Math.round((minQuality + maxQuality) / 2);
      
      console.log(`[precompress] Trying quality=${quality}`);
      const iterStart = Date.now();
      
      const compressedBuffer = await sharpAdapter.convertBuffer(inputBuffer, {
        format: 'webp',
        quality,
        lossless: false,
        effort: 4,
        animated: true
      });
      
      console.log(`[precompress] Compression took: ${Date.now() - iterStart}ms`);
      console.log(`[precompress] quality=${quality}, size=${compressedBuffer.length}`);

      if (compressedBuffer.length <= maxSize) {
        bestBuffer = compressedBuffer;
        bestQuality = quality;
        minQuality = quality + 1;
      } else {
        maxQuality = quality - 1;
      }
    }

    if (!bestBuffer) {
      console.warn(`[precompress] Failed to compress within limit, using minimum quality`);
      const fallbackStart = Date.now();
      bestBuffer = await sharpAdapter.convertBuffer(inputBuffer, {
        format: 'webp',
        quality: QUALITY_MIN,
        lossless: false,
        effort: 4,
        animated: true
      });
      console.log(`[precompress] Fallback compression: ${Date.now() - fallbackStart}ms`);
      bestQuality = QUALITY_MIN;
    }

    console.log(`[precompress] Writing output file...`);
    const writeStart = Date.now();
    const outputPath = path.join(tempDir, `${uniqueId}_compressed.webp`);
    await fs.writeFile(outputPath, bestBuffer);
    console.log(`[precompress] File written: ${Date.now() - writeStart}ms`);

    console.log(`[precompress] DONE: ${Date.now() - startTime}ms, bestQuality=${bestQuality}, originalSize=${fileSize}, compressedSize=${bestBuffer.length}`);

    return {
      sessionId: input.sessionId,
      tempPath: outputPath,
      format: input.format,
      width: input.width,
      height: input.height,
      isAnimated: input.isAnimated,
      cellSize: input.cellSize,
      frameCount: input.frameCount,
      frameTimings: input.frameTimings,
      originalFileName: input.originalFileName,
      packId: input.packId,
      packType: input.packType,
      groupId: input.groupId,
      settings: input.settings,
      ffmpegPath: input.ffmpegPath,
      ffprobePath: input.ffprobePath
    };
  } catch (error) {
    console.error(`[precompress] ERROR: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`[precompress] Stack: ${error instanceof Error ? error.stack : 'N/A'}`);
    throw error;
  }
}
