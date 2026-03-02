/**
 * FFmpeg Adapter
 * Зона ответственности: Реализация операций с видео через fluent-ffmpeg
 * Зависимости: ffmpegPath, ffprobePath внедряются через конструктор
 */

import ffmpeg from 'fluent-ffmpeg';
import { IFFmpegAdapter, VideoMetadata, FFmpegConvertOptions, ExtractOptions } from '../interfaces/IFFmpegAdapter';

export class FFmpegAdapter implements IFFmpegAdapter {
  constructor(
    private readonly ffmpegPath: string,
    private readonly ffprobePath: string
  ) {
    // Настраиваем fluent-ffmpeg на использование наших бинарников
    ffmpeg.setFfmpegPath(this.ffmpegPath);
    ffmpeg.setFfprobePath(this.ffprobePath);
  }

  /**
   * Получить метаданные видео через ffprobe
   */
  async getMetadata(inputPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(new Error(`FFprobe failed: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');

        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        const hasAudio = metadata.streams.some((s) => s.codec_type === 'audio');

        // Парсим FPS
        const fps = this.parseFps(videoStream.r_frame_rate);

        resolve({
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          duration: metadata.format?.duration ? parseFloat(String(metadata.format.duration)) : 0,
          fps,
          hasAudio,
          codec: videoStream.codec_name || 'unknown',
        });
      });
    });
  }

  /**
   * Конвертировать видео в другой формат
   */
  async convert(
    inputPath: string,
    outputPath: string,
    options: FFmpegConvertOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath);

      // Настройка формата
      switch (options.format) {
        case 'webm':
          command
            .outputOptions('-f', 'webm')
            .outputOptions('-c:v', 'libvpx-vp9')
            .outputOptions('-pix_fmt', 'yuva420p'); // Поддержка прозрачности

          if (options.lossless) {
            command.outputOptions('-lossless', '1');
          } else {
            const crf = options.quality !== undefined ? options.quality : 30;
            command.outputOptions('-crf', crf.toString());
            command.outputOptions('-b:v', '0');
          }
          break;

        case 'mp4':
          command
            .outputOptions('-f', 'mp4')
            .outputOptions('-c:v', 'libx264')
            .outputOptions('-pix_fmt', 'yuv420p');
          break;

        case 'gif':
          command
            .outputOptions('-f', 'gif')
            .outputOptions('-loop', options.loop !== undefined ? options.loop.toString() : '0');
          break;

        case 'webp':
          command
            .outputOptions('-f', 'webp')
            .outputOptions('-c:v', 'libwebp_anim')
            .outputOptions('-lossless', options.lossless ? '1' : '0')
            .outputOptions('-loop', options.loop !== undefined ? options.loop.toString() : '0');
          break;
      }

      // FPS
      if (options.fps) {
        command.outputOptions('-r', options.fps.toString());
      }

      command
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(new Error(`FFmpeg conversion failed: ${err.message}`)))
        .run();
    });
  }

  /**
   * Изменить длительность видео (ускорить/замедлить)
   */
  async adjustDuration(
    inputPath: string,
    outputPath: string,
    targetDuration: number
  ): Promise<void> {
    const metadata = await this.getMetadata(inputPath);
    const currentDuration = metadata.duration;

    // Если текущая длительность меньше или равна целевой, просто конвертируем
    if (currentDuration <= targetDuration) {
      await this.convert(inputPath, outputPath, { format: 'webm' });
      return;
    }

    const factor = targetDuration / currentDuration;

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions('-vf', `setpts=${factor}*PTS`)
        .outputOptions('-an') // Удаляем аудио
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(new Error(`FFmpeg adjustDuration failed: ${err.message}`)))
        .run();
    });
  }

  /**
   * Изменить размер видео
   */
  async resize(
    inputPath: string,
    outputPath: string,
    width: number,
    height: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions('-vf', `scale=${width}:${height}`)
        .outputOptions('-pix_fmt', 'yuva420p')
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(new Error(`FFmpeg resize failed: ${err.message}`)))
        .run();
    });
  }

  /**
   * Извлечь регион из видео (crop)
   */
  async extractFragment(
    inputPath: string,
    outputPath: string,
    options: ExtractOptions
  ): Promise<void> {
    const { left, top, width, height } = options;

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions('-vf', `crop=${width}:${height}:${left}:${top}`)
        .outputOptions('-pix_fmt', 'yuva420p')
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(new Error(`FFmpeg extractFragment failed: ${err.message}`)))
        .run();
    });
  }

  /**
   * Парсер FPS из строки вида "30/1" или "30000/1001"
   */
  private parseFps(fpsStr: string | undefined): number {
    if (!fpsStr) return 0;

    if (fpsStr.includes('/')) {
      const [num, den] = fpsStr.split('/').map(Number);
      return den !== 0 ? num / den : 0;
    }

    return Number(fpsStr) || 0;
  }
}
