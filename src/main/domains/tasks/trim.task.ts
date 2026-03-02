import { DetectedImage, TrimmedImage } from '@/shared/domains/image-processing/types';
import { SharpAdapter } from '@/main/domains/media-processing/adapters/SharpAdapter';
import { nanoid } from 'nanoid';
import path from 'path';

const TRIM_THRESHOLD = 10;

export async function execute(input: DetectedImage): Promise<TrimmedImage> {
  const startTime = Date.now();
  console.log(`[trim] START: ${input.originalFileName}, enableTrim=${input.settings.enableTrim}`);
  
  if (input.settings.enableTrim === false) {
    console.log(`[trim] SKIPPED: ${Date.now() - startTime}ms`);
    return {
      ...input,
      tempPath: input.tempPath
    };
  }

  const sharpAdapter = new SharpAdapter();
  const extension = input.format === 'gif' ? 'gif' : 'webp';
  const uniqueId = nanoid();
  const tempDir = path.dirname(input.tempPath);
  const tempPath = path.join(tempDir, `${uniqueId}_trim.${extension}`);

  const trimStart = Date.now();
  const trimResult = await sharpAdapter.trim(input.tempPath, tempPath, TRIM_THRESHOLD);
  console.log(`[trim] Sharp trim: ${Date.now() - trimStart}ms`);
  console.log(`[trim] DONE: ${Date.now() - startTime}ms total`);

  return {
    sessionId: input.sessionId,
    tempPath,
    format: input.format,
    width: trimResult.width,
    height: trimResult.height,
    isAnimated: input.isAnimated,
    hasAlpha: input.hasAlpha,
    duration: input.duration,
    originalFileName: input.originalFileName,
    packId: input.packId,
    packType: input.packType,
    groupId: input.groupId,
    settings: input.settings
  };
}
