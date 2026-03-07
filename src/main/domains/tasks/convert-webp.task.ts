import { promises as fs } from 'fs';
import path from 'path';
import { ImageFragment, ConvertedFragment } from '@/shared/domains/image-processing/types';
import { ImageFormat } from '@/shared/domains/image-processing/enums';
import { SharpAdapter } from '@/main/domains/media-processing/adapters/SharpAdapter';
import { webmConversionCache } from '@/main/domains/image-processing/utils/WebmConversionCache';
import { VIDEO_TILE_LIMIT, ANIMATION_MAX_DURATION, ANIMATION_TARGET_FPS } from '@/main/domains/image-processing/constants';
import ffmpeg from 'fluent-ffmpeg';

const WEBM_MIN_CRF = 32;
const WEBM_MAX_CRF = 45;
const WEBM_CRF_STEP = 3;

export async function execute(input: ImageFragment): Promise<ConvertedFragment> {
  try {
    // Статичное изображение
    if (!input.isAnimated) {
      const buffer = await fs.readFile(input.tempPath);
      return {
        sessionId: input.sessionId,
        fragmentId: input.fragmentId,
        tempPath: input.tempPath,
        fileName: `${input.originalFileName}_${input.fragmentId}.webp`,
        format: ImageFormat.WEBP,
        width: input.width,
        height: input.height,
        fileSize: buffer.length,
        row: input.row,
        col: input.col,
        packId: input.packId,
        packType: input.packType,
        groupId: input.groupId
      };
    }

    // Анимированное изображение - конвертация через GIF → WebM
    const sharpAdapter = new SharpAdapter();
    const metadata = await sharpAdapter.getMetadata(input.tempPath);
    
    console.log(`[convert-webp] Fragment ${input.fragmentId}: isAnimated=${metadata.isAnimated}, pages=${metadata.pages}, path=${input.tempPath}`);
    
    if (!metadata.isAnimated) {
      console.log(`[convert-webp] Fragment ${input.fragmentId}: File is not animated, returning as static WebP`);
      const buffer = await fs.readFile(input.tempPath);
      return {
        sessionId: input.sessionId,
        fragmentId: input.fragmentId,
        tempPath: input.tempPath,
        fileName: `${input.originalFileName}_${input.fragmentId}.webp`,
        format: ImageFormat.WEBP,
        width: input.width,
        height: input.height,
        fileSize: buffer.length,
        row: input.row,
        col: input.col,
        packId: input.packId,
        packType: input.packType,
        groupId: input.groupId
      };
    }

    // Конвертируем WebP в GIF для FFmpeg
    const tempDir = path.dirname(input.tempPath);
    const gifPath = input.tempPath.replace(/\.[^.]+$/, '_temp.gif');
    
    console.log(`[convert-webp] Fragment ${input.fragmentId}: Converting WebP to GIF for FFmpeg`);
    const convertStart = Date.now();
    await sharpAdapter.convert(input.tempPath, gifPath, {
      format: 'gif',
      animated: true,
      effort: 10
    });
    console.log(`[convert-webp] Fragment ${input.fragmentId}: WebP→GIF conversion: ${Date.now() - convertStart}ms`);

    // Получаем метаданные GIF для точного расчета speedFactor
    const FFmpegAdapter = (await import('@/main/domains/media-processing/adapters/FFmpegAdapter')).FFmpegAdapter;
    const ffmpegAdapter = new FFmpegAdapter(input.ffmpegPath || 'ffmpeg', input.ffprobePath || 'ffprobe');
    const gifMetadata = await ffmpegAdapter.getMetadata(gifPath);
    const gifDuration = gifMetadata.duration || ANIMATION_MAX_DURATION;
    const speedFactor = gifDuration > ANIMATION_MAX_DURATION ? gifDuration / ANIMATION_MAX_DURATION : 1.0;
    
    console.log(`[convert-webp] Fragment ${input.fragmentId}: GIF duration=${gifDuration.toFixed(3)}s, speedFactor=${speedFactor.toFixed(6)}`);

    const outputPath = input.tempPath.replace(/\.[^.]+$/, '.webm');

    // Получаем кешированный CRF или начинаем с минимального
    const cachedParams = webmConversionCache.get(input.groupId);
    let crf = cachedParams?.crf || WEBM_MIN_CRF;

    console.log(`[convert-webp] Fragment ${input.fragmentId}: startCrf=${crf} (cached=${!!cachedParams})`);

    let finalPath = outputPath;
    let finalSize = VIDEO_TILE_LIMIT + 1;

    // Бинарный поиск оптимального CRF
    while (crf <= WEBM_MAX_CRF) {
      console.log(`[convert-webp] Fragment ${input.fragmentId}: Trying CRF=${crf}`);
      const crfStart = Date.now();

      await new Promise<void>((resolve, reject) => {
        ffmpeg.setFfmpegPath(input.ffmpegPath || 'ffmpeg');

        // Фильтры: setpts для ускорения + fps для нормализации + обрезка для гарантии
        const setptsFilter = speedFactor > 1 ? `setpts=PTS/${speedFactor.toFixed(6)}` : '';
        const fpsFilter = `fps=${ANIMATION_TARGET_FPS}`;
        const vf = setptsFilter ? `${setptsFilter},${fpsFilter}` : fpsFilter;

        const command = ffmpeg(gifPath)
          .outputOptions('-c:v', 'libvpx-vp9')
          .outputOptions('-pix_fmt', 'yuva420p')
          .outputOptions('-crf', crf.toString())
          .outputOptions('-b:v', '0')
          .outputOptions('-quality', 'good')
          .outputOptions('-cpu-used', '2')
          .outputOptions('-auto-alt-ref', '0')
          .outputOptions('-an')
          .outputOptions('-vf', vf)
          .outputOptions('-t', ANIMATION_MAX_DURATION.toString())
          .outputOptions('-y');

        command
          .output(finalPath)
          .on('end', () => resolve())
          .on('error', (err) => reject(new Error(`FFmpeg conversion failed: ${err.message}`)))
          .run();
      });
      
      console.log(`[convert-webp] Fragment ${input.fragmentId}: CRF=${crf} encoding: ${Date.now() - crfStart}ms`);
      
      const stats = await fs.stat(finalPath);
      finalSize = stats.size;
      console.log(`[convert-webp] Fragment ${input.fragmentId}: CRF=${crf}, size=${finalSize}`);
      
      if (finalSize <= VIDEO_TILE_LIMIT) {
        console.log(`[convert-webp] Fragment ${input.fragmentId}: Success with CRF=${crf}`);
        webmConversionCache.set(input.groupId, { crf });
        break;
      }
      
      console.log(`[convert-webp] Fragment ${input.fragmentId}: Size ${finalSize} > ${VIDEO_TILE_LIMIT}, increasing CRF`);
      crf += WEBM_CRF_STEP;
    }

    // Удаляем временный GIF
    await fs.unlink(gifPath).catch(() => {});

    if (finalSize > VIDEO_TILE_LIMIT) {
      console.warn(`[convert-webp] Fragment ${input.fragmentId}: Failed to fit in ${VIDEO_TILE_LIMIT}, using best result with size=${finalSize}`);
    }

    // Проверяем финальную длительность через FFprobe
    const finalMetadata = await ffmpegAdapter.getMetadata(finalPath);
    const finalDuration = finalMetadata.duration || 0;
    const finalFps = finalMetadata.fps || 0;
    
    console.log(`[convert-webp] Fragment ${input.fragmentId}: FINAL - duration=${finalDuration.toFixed(3)}s, fps=${finalFps}, size=${finalSize}, limit=${VIDEO_TILE_LIMIT}`);
    
    if (finalDuration > ANIMATION_MAX_DURATION + 0.01) {
      console.warn(`[convert-webp] Fragment ${input.fragmentId}: WARNING - Duration ${finalDuration.toFixed(3)}s exceeds limit ${ANIMATION_MAX_DURATION}s`);
    }

    return {
      sessionId: input.sessionId,
      fragmentId: input.fragmentId,
      tempPath: finalPath,
      fileName: `${input.originalFileName}_${input.fragmentId}.webm`,
      format: ImageFormat.WEBM,
      width: input.width,
      height: input.height,
      fileSize: finalSize,
      row: input.row,
      col: input.col,
      packId: input.packId,
      packType: input.packType,
      groupId: input.groupId
    };
  } catch (error) {
    console.error(`[convert-webp] ERROR: fragmentId=${input.fragmentId}, ${error instanceof Error ? error.message : String(error)}`);
    console.error(`[convert-webp] Stack: ${error instanceof Error ? error.stack : 'N/A'}`);
    throw error;
  }
}
