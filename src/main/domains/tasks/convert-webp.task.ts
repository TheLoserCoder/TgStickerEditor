import { promises as fs } from 'fs';
import path from 'path';
import { ImageFragment, ConvertedFragment } from '@/shared/domains/image-processing/types';
import { ImageFormat } from '@/shared/domains/image-processing/enums';
import { SharpAdapter } from '@/main/domains/media-processing/adapters/SharpAdapter';
import { FFmpegAdapter } from '@/main/domains/media-processing/adapters/FFmpegAdapter';
import ffmpeg from 'fluent-ffmpeg';
import { getFFmpegPath } from '../../utils/ffmpeg-path';

const WEBM_MAX_DURATION = 2.99;
const WEBM_MAX_SIZE = 256 * 1024;
const WEBM_MIN_CRF = 32;
const WEBM_MAX_CRF = 45;
const WEBM_CRF_STEP = 3;

export async function execute(input: ImageFragment): Promise<ConvertedFragment> {
  if (input.format === ImageFormat.WEBP && !input.isAnimated) {
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

  if (input.isAnimated && input.format === ImageFormat.WEBP) {
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

    // Конвертируем WebP в GIF для FFmpeg (FFmpeg не поддерживает анимированный WebP)
    const tempDir = path.dirname(input.tempPath);
    const gifPath = input.tempPath.replace(/\.[^.]+$/, '_temp.gif');
    
    console.log(`[convert-webp] Fragment ${input.fragmentId}: Converting WebP to GIF for FFmpeg`);
    await sharpAdapter.convert(input.tempPath, gifPath, {
      format: 'gif',
      animated: true,
      effort: 10
    });

    const ffmpegAdapter = new FFmpegAdapter(getFFmpegPath(), 'ffprobe');
    const outputPath = input.tempPath.replace(/\.[^.]+$/, '.webm');

    const ffmpegMetadata = await ffmpegAdapter.getMetadata(gifPath);
    const currentDuration = ffmpegMetadata.duration || 0;

    console.log(`[convert-webp] Fragment ${input.fragmentId}: FFmpeg duration=${currentDuration}s`);

    const speedFactor = currentDuration > WEBM_MAX_DURATION
      ? WEBM_MAX_DURATION / currentDuration
      : 1.0;

    let crf = WEBM_MIN_CRF;
    let finalPath = outputPath;

    while (crf <= WEBM_MAX_CRF) {
      const setptsFilter = speedFactor < 1
        ? `setpts=${speedFactor.toFixed(4)}*PTS,`
        : '';

      const vf = `${setptsFilter}scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuva420p,fps=30`;

      console.log(`[convert-webp] Fragment ${input.fragmentId}: Trying CRF=${crf}`);

      await new Promise<void>((resolve, reject) => {
        ffmpeg.setFfmpegPath(getFFmpegPath());

        let stderrOutput = '';

        ffmpeg(gifPath)
          .outputOptions('-vf', vf)
          .outputOptions('-t', WEBM_MAX_DURATION.toString())
          .outputOptions('-c:v', 'libvpx-vp9')
          .outputOptions('-pix_fmt', 'yuva420p')
          .outputOptions('-crf', crf.toString())
          .outputOptions('-b:v', '0')
          .outputOptions('-quality', 'good')
          .outputOptions('-cpu-used', '2')
          .outputOptions('-auto-alt-ref', '0')
          .outputOptions('-an')
          .outputOptions('-y')
          .output(finalPath)
          .on('stderr', (line) => {
            stderrOutput += line + '\n';
          })
          .on('end', () => resolve())
          .on('error', (err) => {
            console.error(`[convert-webp] FFmpeg stderr:\n${stderrOutput}`);
            reject(new Error(`FFmpeg conversion failed: ${err.message}`));
          })
          .run();
      });
      
      const stats = await fs.stat(finalPath);
      console.log(`[convert-webp] Fragment ${input.fragmentId}: CRF=${crf}, size=${stats.size} bytes`);
      
      if (stats.size <= WEBM_MAX_SIZE || crf >= WEBM_MAX_CRF) {
        break;
      }
      
      crf += WEBM_CRF_STEP;
    }

    // Удаляем временный GIF
    await fs.unlink(gifPath).catch(() => {});

    const stats = await fs.stat(finalPath);

    return {
      sessionId: input.sessionId,
      fragmentId: input.fragmentId,
      tempPath: finalPath,
      fileName: `${input.originalFileName}_${input.fragmentId}.webm`,
      format: ImageFormat.WEBM,
      width: input.width,
      height: input.height,
      fileSize: stats.size,
      row: input.row,
      col: input.col,
      packId: input.packId,
      packType: input.packType,
      groupId: input.groupId
    };
  }

  if (input.isAnimated && input.format === ImageFormat.GIF) {
    const ffmpegAdapter = new FFmpegAdapter(getFFmpegPath(), 'ffprobe');
    const outputPath = input.tempPath.replace(/\.[^.]+$/, '.webm');

    const metadata = await ffmpegAdapter.getMetadata(input.tempPath);
    const currentDuration = metadata.duration || 0;

    const speedFactor = currentDuration > WEBM_MAX_DURATION
      ? WEBM_MAX_DURATION / currentDuration
      : 1.0;

    let crf = WEBM_MIN_CRF;
    let finalPath = outputPath;

    while (crf <= WEBM_MAX_CRF) {
      const setptsFilter = speedFactor < 1
        ? `setpts=${speedFactor.toFixed(4)}*PTS,`
        : '';

      const vf = `format=yuva420p,${setptsFilter}fps=30`;

      await new Promise<void>((resolve, reject) => {
        ffmpeg.setFfmpegPath(getFFmpegPath());

        ffmpeg(input.tempPath)
          .outputOptions('-vf', vf)
          .outputOptions('-t', WEBM_MAX_DURATION.toString())
          .outputOptions('-c:v', 'libvpx-vp9')
          .outputOptions('-pix_fmt', 'yuva420p')
          .outputOptions('-crf', crf.toString())
          .outputOptions('-b:v', '0')
          .outputOptions('-quality', 'good')
          .outputOptions('-cpu-used', '2')
          .outputOptions('-auto-alt-ref', '0')
          .outputOptions('-an')
          .outputOptions('-y')
          .output(finalPath)
          .on('end', () => resolve())
          .on('error', (err) => reject(new Error(`FFmpeg conversion failed: ${err.message}`)))
          .run();
      });
      
      const stats = await fs.stat(finalPath);
      if (stats.size <= WEBM_MAX_SIZE || crf >= WEBM_MAX_CRF) {
        break;
      }
      
      crf += WEBM_CRF_STEP;
    }

    const stats = await fs.stat(finalPath);

    return {
      sessionId: input.sessionId,
      fragmentId: input.fragmentId,
      tempPath: finalPath,
      fileName: `${input.originalFileName}_${input.fragmentId}.webm`,
      format: ImageFormat.WEBM,
      width: input.width,
      height: input.height,
      fileSize: stats.size,
      row: input.row,
      col: input.col,
      packId: input.packId,
      packType: input.packType,
      groupId: input.groupId
    };
  }

  const sharpAdapter = new SharpAdapter();
  const outputPath = input.tempPath.replace(/\.[^.]+$/, '.webp');
  
  await sharpAdapter.convert(input.tempPath, outputPath, {
    format: 'webp',
    quality: 90,
    animated: input.isAnimated
  });

  const stats = await fs.stat(outputPath);

  return {
    sessionId: input.sessionId,
    fragmentId: input.fragmentId,
    tempPath: outputPath,
    fileName: `${input.originalFileName}_${input.fragmentId}.webp`,
    format: ImageFormat.WEBP,
    width: input.width,
    height: input.height,
    fileSize: stats.size,
    row: input.row,
    col: input.col,
    packId: input.packId,
    packType: input.packType,
    groupId: input.groupId
  };
}
