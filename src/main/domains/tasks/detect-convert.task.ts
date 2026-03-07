import { ImageInput, DetectedImage } from '@/shared/domains/image-processing/types';
import { ImageFormat } from '@/shared/domains/image-processing/enums';
import { SharpAdapter } from '@/main/domains/media-processing/adapters/SharpAdapter';
import { AnimationDetector } from '@/main/domains/image-processing/utils/AnimationDetector';
import { FFmpegAdapter } from '@/main/domains/media-processing/adapters/FFmpegAdapter';
import { FileSystemService } from '@/main/domains/filesystem/services/FileSystemService';
import { ANIMATION_MAX_DURATION, ANIMATION_MAX_FRAMES, ANIMATION_TARGET_FPS } from '@/main/domains/image-processing/constants';
import { nanoid } from 'nanoid';
import path from 'path';

export async function execute(input: ImageInput): Promise<DetectedImage> {
  const startTime = Date.now();
  console.log(`[detect-convert] START: ${input.originalFileName}`);
  
  const sharpAdapter = new SharpAdapter();
  const fileSystem = new FileSystemService();
  const animationDetector = new AnimationDetector(sharpAdapter, fileSystem);
  const ffmpegAdapter = new FFmpegAdapter(input.ffmpegPath || 'ffmpeg', input.ffprobePath || 'ffprobe');

  const sessionId = Date.now().toString();
  const uniqueId = nanoid();
  const tempDir = path.dirname(input.filePath);
  
  const detectStart = Date.now();
  const isAnimated = await animationDetector.isAnimated(input.filePath);
  console.log(`[detect-convert] Animation detection: ${Date.now() - detectStart}ms, isAnimated=${isAnimated}`);

  // Статичное изображение или анимация отключена
  if (!isAnimated || input.settings.enableAnimation === false) {
    const tempPath = path.join(tempDir, `${uniqueId}_static.webp`);
    const convertStart = Date.now();
    await sharpAdapter.convert(input.filePath, tempPath, { format: 'webp', animated: false });
    console.log(`[detect-convert] Convert to static: ${Date.now() - convertStart}ms`);
    const metadata = await sharpAdapter.getMetadata(tempPath);

    console.log(`[detect-convert] DONE: ${Date.now() - startTime}ms total`);
    return {
      sessionId,
      tempPath,
      format: ImageFormat.WEBP,
      width: metadata.width,
      height: metadata.height,
      isAnimated: false,
      hasAlpha: metadata.hasAlpha,
      originalFileName: input.originalFileName,
      packId: input.packId,
      packType: input.packType,
      groupId: input.groupId,
      settings: input.settings
    };
  }

  // Анимированное изображение - обработка через FFmpeg
  let processPath = input.filePath;
  let needsCleanup = false;

  // WebP → GIF конвертация (FFmpeg не поддерживает анимированный WebP)
  const isWebP = input.filePath.toLowerCase().endsWith('.webp');
  if (isWebP) {
    const gifPath = path.join(tempDir, `${uniqueId}_temp.gif`);
    console.log(`[detect-convert] Converting WebP to GIF for FFmpeg`);
    await sharpAdapter.convert(input.filePath, gifPath, {
      format: 'gif',
      animated: true,
      effort: 10
    });
    processPath = gifPath;
    needsCleanup = true;
  }

  // Получение метаданных через FFprobe
  const metadata = await ffmpegAdapter.getMetadata(processPath);
  const originalDuration = metadata.duration || 0;
  const originalFps = metadata.fps || 25;
  const originalFrames = Math.round(originalDuration * originalFps);

  console.log(`[detect-convert] Original: duration=${originalDuration.toFixed(2)}s, fps=${originalFps}, frames=${originalFrames}`);

  // ВСЕГДА применяем ограничения: 2.99с и 24 FPS
  const targetDuration = ANIMATION_MAX_DURATION;
  const targetFps = ANIMATION_TARGET_FPS;
  const speedFactor = originalDuration > ANIMATION_MAX_DURATION ? originalDuration / ANIMATION_MAX_DURATION : 1.0;

  console.log(`[detect-convert] Target: duration=${targetDuration}s, fps=${targetFps}, speedFactor=${speedFactor.toFixed(6)}`);

  const tempWebp = path.join(tempDir, `${uniqueId}_optimized.webp`);
  
  // FFmpeg фильтры: всегда ограничиваем FPS и длительность
  const setptsFilter = speedFactor > 1 ? `setpts=PTS/${speedFactor.toFixed(6)}` : '';
  const fpsFilter = `fps=${targetFps}`;
  const vf = setptsFilter ? `${setptsFilter},${fpsFilter}` : fpsFilter;

  await ffmpegAdapter.convertWithFilters(processPath, tempWebp, {
    vf,
    format: 'webp',
    lossless: false,
    loop: 0,
    duration: targetDuration
  });

  if (needsCleanup) {
    await fileSystem.rm(processPath).catch(() => {});
  }

  const webpMetadata = await sharpAdapter.getMetadata(tempWebp);
  const frameTimings = await extractFrameTimings(tempWebp, ffmpegAdapter);
  const finalFrameCount = webpMetadata.pages || ANIMATION_MAX_FRAMES;

  // Проверяем финальную длительность через FFprobe
  const finalMetadata = await ffmpegAdapter.getMetadata(tempWebp);
  const actualDuration = finalMetadata.duration || targetDuration;
  const actualFps = finalMetadata.fps || targetFps;
  
  console.log(`[detect-convert] FINAL - duration=${actualDuration.toFixed(3)}s, fps=${actualFps}, frames=${finalFrameCount}, target=${targetDuration}s`);
  
  if (actualDuration > ANIMATION_MAX_DURATION + 0.01) {
    console.warn(`[detect-convert] WARNING - Duration ${actualDuration.toFixed(3)}s exceeds limit ${ANIMATION_MAX_DURATION}s`);
  }

  console.log(`[detect-convert] DONE: ${Date.now() - startTime}ms total`);
  return {
    sessionId,
    tempPath: tempWebp,
    format: ImageFormat.WEBP,
    width: webpMetadata.width,
    height: webpMetadata.height,
    isAnimated: true,
    hasAlpha: webpMetadata.hasAlpha,
    duration: targetDuration,
    frameCount: finalFrameCount,
    frameTimings,
    originalFileName: input.originalFileName,
    packId: input.packId,
    packType: input.packType,
    groupId: input.groupId,
    settings: input.settings
  };
}

async function extractFrameTimings(webpPath: string, ffmpegAdapter: FFmpegAdapter): Promise<number[]> {
  try {
    const frames = await ffmpegAdapter.getFrameTimings(webpPath);
    return frames.map(f => Math.round(f.duration * 1000)); // в миллисекунды
  } catch (error) {
    console.warn(`[detect-convert] Failed to extract frame timings: ${error}`);
    return [];
  }
}
