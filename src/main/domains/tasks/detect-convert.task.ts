import { ImageInput, DetectedImage } from '@/shared/domains/image-processing/types';
import { ImageFormat } from '@/shared/domains/image-processing/enums';
import { SharpAdapter } from '@/main/domains/media-processing/adapters/SharpAdapter';
import { AnimationDetector } from '@/main/domains/image-processing/utils/AnimationDetector';
import { FFmpegAdapter } from '@/main/domains/media-processing/adapters/FFmpegAdapter';
import { FileSystemService } from '@/main/domains/filesystem/services/FileSystemService';
import { nanoid } from 'nanoid';
import path from 'path';
import ffmpegStatic from 'ffmpeg-static';

export async function execute(input: ImageInput): Promise<DetectedImage> {
  const startTime = Date.now();
  console.log(`[detect-convert] START: ${input.originalFileName}`);
  
  const sharpAdapter = new SharpAdapter();
  const fileSystem = new FileSystemService();
  const animationDetector = new AnimationDetector(sharpAdapter, fileSystem);
  const ffmpegAdapter = new FFmpegAdapter(ffmpegStatic || 'ffmpeg', 'ffprobe');

  const sessionId = Date.now().toString();
  const uniqueId = nanoid();
  const tempDir = path.dirname(input.filePath);
  
  const detectStart = Date.now();
  const isAnimated = await animationDetector.isAnimated(input.filePath);
  console.log(`[detect-convert] Animation detection: ${Date.now() - detectStart}ms, isAnimated=${isAnimated}`);

  if (input.settings.enableAnimation === false && isAnimated) {
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

  if (isAnimated) {
    const apngStart = Date.now();
    const isApng = await animationDetector.detectApng(input.filePath);
    console.log(`[detect-convert] APNG detection: ${Date.now() - apngStart}ms, isApng=${isApng}`);
    
    if (isApng) {
      const tempWebp = path.join(tempDir, `${uniqueId}_apng.webp`);
      const convertStart = Date.now();
      await ffmpegAdapter.convert(input.filePath, tempWebp, {
        format: 'webp',
        lossless: true,
        loop: 0
      });
      console.log(`[detect-convert] FFmpeg APNG→WebP: ${Date.now() - convertStart}ms`);
      
      const metadata = await sharpAdapter.getMetadata(tempWebp);
      const duration = (metadata.pages || 1) * 100;

      console.log(`[detect-convert] DONE: ${Date.now() - startTime}ms total`);
      return {
        sessionId,
        tempPath: tempWebp,
        format: ImageFormat.WEBP,
        width: metadata.width,
        height: metadata.height,
        isAnimated: true,
        hasAlpha: metadata.hasAlpha,
        duration,
        originalFileName: input.originalFileName,
        packId: input.packId,
        packType: input.packType,
        groupId: input.groupId,
        settings: input.settings
      };
    }

    const tempWebp = path.join(tempDir, `${uniqueId}_anim.webp`);
    const convertStart = Date.now();
    await sharpAdapter.convert(input.filePath, tempWebp, { format: 'webp', animated: true });
    console.log(`[detect-convert] Sharp animated convert: ${Date.now() - convertStart}ms`);
    const metadata = await sharpAdapter.getMetadata(tempWebp);
    const duration = (metadata.pages || 1) * 100;

    console.log(`[detect-convert] DONE: ${Date.now() - startTime}ms total`);
    return {
      sessionId,
      tempPath: tempWebp,
      format: ImageFormat.WEBP,
      width: metadata.width,
      height: metadata.height,
      isAnimated: true,
      hasAlpha: metadata.hasAlpha,
      duration,
      originalFileName: input.originalFileName,
      packId: input.packId,
      packType: input.packType,
      groupId: input.groupId,
      settings: input.settings
    };
  }

  const tempWebp = path.join(tempDir, `${uniqueId}_static.webp`);
  const convertStart = Date.now();
  await sharpAdapter.convert(input.filePath, tempWebp, { format: 'webp', animated: false });
  console.log(`[detect-convert] Sharp static convert: ${Date.now() - convertStart}ms`);
  const metadata = await sharpAdapter.getMetadata(tempWebp);

  console.log(`[detect-convert] DONE: ${Date.now() - startTime}ms total`);
  return {
    sessionId,
    tempPath: tempWebp,
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
