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
   * Конвертировать видео с кастомными фильтрами
   */
  async convertWithFilters(
    inputPath: string,
    outputPath: string,
    options: FFmpegConvertOptions & { vf?: string; duration?: number }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath);

      // Применяем видео фильтры
      if (options.vf) {
        command.outputOptions('-vf', options.vf);
      }

      // Ограничение длительности
      if (options.duration) {
        command.outputOptions('-t', options.duration.toString());
      }

      // Настройка формата
      switch (options.format) {
        case 'webp':
          command
            .outputOptions('-f', 'webp')
            .outputOptions('-c:v', 'libwebp_anim')
            .outputOptions('-lossless', options.lossless ? '1' : '0')
            .outputOptions('-loop', options.loop !== undefined ? options.loop.toString() : '0');
          break;

        case 'webm':
          command
            .outputOptions('-f', 'webm')
            .outputOptions('-c:v', 'libvpx-vp9')
            .outputOptions('-pix_fmt', 'yuva420p');
          break;
      }

      command
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(new Error(`FFmpeg convertWithFilters failed: ${err.message}`)))
        .run();
    });
  }

  /**
   * Получить тайминги кадров через ffprobe
   */
  async getFrameTimings(inputPath: string): Promise<Array<{ duration: number }>> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, ['-show_frames', '-select_streams', 'v:0', '-print_format', 'json'], (err, data: any) => {
        if (err) {
          reject(new Error(`FFprobe getFrameTimings failed: ${err.message}`));
          return;
        }

        const frames = data.frames || [];
        const timings = frames
          .filter((f: any) => f.media_type === 'video')
          .map((f: any) => ({
            duration: parseFloat(f.pkt_duration_time || f.duration_time || '0.04')
          }));

        resolve(timings);
      });
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
   * Фрагментация анимации на тайлы с конвертацией в WebM
   */
  async fragmentToWebM(
    inputPath: string,
    outputDir: string,
    columns: number,
    rows: number,
    tileSize: number,
    maxDuration: number,
    crf: number = 30
  ): Promise<{ paths: string[]; duration: number; fps: number; frameCount: number }> {
    const metadata = await this.getMetadata(inputPath);
    const duration = metadata.duration;
    const fps = 30;

    // Вычисляем setpts factor если нужно сжать
    const setptsFactor = duration > maxDuration ? maxDuration / duration : 1;
    const finalDuration = Math.min(duration, maxDuration);

    // Строим filter_complex
    const totalTiles = columns * rows;
    const splitOutputs = Array.from({ length: totalTiles }, (_, i) => `v${i}`);
    const cropOutputs = Array.from({ length: totalTiles }, (_, i) => `t${i}`);

    let filterComplex = `[0:v]format=yuva420p,fps=${fps},setpts=${setptsFactor}*PTS,split=${totalTiles}`;
    filterComplex += splitOutputs.map(v => `[${v}]`).join('');
    filterComplex += ';';

    // Добавляем crop + format=yuva420p для каждого тайла
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const index = r * columns + c;
        const x = c * tileSize;
        const y = r * tileSize;
        filterComplex += `[v${index}]crop=${tileSize}:${tileSize}:${x}:${y},format=yuva420p[t${index}]`;
        if (index < totalTiles - 1) filterComplex += ';';
      }
    }

    // Создаем пути для выходных файлов
    const outputPaths: string[] = [];
    for (let i = 0; i < totalTiles; i++) {
      outputPaths.push(`${outputDir}/tile_${i}.webm`);
    }

    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .complexFilter(filterComplex);

      // Добавляем выходы для каждого тайла
      for (let i = 0; i < totalTiles; i++) {
        command
          .output(outputPaths[i])
          .outputOptions([
            `-map`, `[t${i}]`,
            '-c:v', 'libvpx-vp9',
            '-pix_fmt', 'yuva420p',
            '-metadata:s:v:0', 'alpha_mode=1',
            '-auto-alt-ref', '0',
            '-crf', crf.toString(),
            '-b:v', '0',
            '-deadline', 'realtime',
            '-cpu-used', '6',
            '-row-mt', '1',
            '-an'
          ]);
      }

      command
        .on('end', () => {
          resolve({
            paths: outputPaths,
            duration: finalDuration,
            fps,
            frameCount: Math.round(finalDuration * fps)
          });
        })
        .on('error', (err) => reject(new Error(`FFmpeg fragmentToWebM failed: ${err.message}`)))
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

  /**
   * Нарезка PNG атласа напрямую на WebM тайлы
   */
  async fragmentPNGAtlasToWebM(
    atlasPath: string,
    outputDir: string,
    columns: number,
    rows: number,
    tileSize: number,
    frameCount: number,
    fps: number,
    crf: number = 30
  ): Promise<{ paths: string[]; duration: number; fps: number; frameCount: number }> {
    const totalTiles = columns * rows;
    const outputPaths: string[] = [];
    
    for (let i = 0; i < totalTiles; i++) {
      outputPaths.push(`${outputDir}/tile_${i}.webm`);
    }

    const duration = frameCount / fps;

    return new Promise((resolve, reject) => {
      const command = ffmpeg(atlasPath)
        .inputOptions([
          '-loop', '1',
          '-framerate', fps.toString()
        ]);

      // Добавляем выходы для каждого тайла
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
          const index = r * columns + c;
          const x = c * tileSize;
          const y = r * tileSize;
          
          command
            .output(outputPaths[index])
            .outputOptions([
              '-vf', `crop=${tileSize}:${tileSize}:${x}:'n*${tileSize}',format=yuva420p`,
              '-frames:v', frameCount.toString(),
              '-c:v', 'libvpx-vp9',
              '-pix_fmt', 'yuva420p',
              '-auto-alt-ref', '0',
              '-crf', crf.toString(),
              '-b:v', '0',
              '-deadline', 'realtime',
              '-cpu-used', '6',
              '-row-mt', '1',
              '-an'
            ]);
        }
      }

      command
        .on('end', () => {
          resolve({
            paths: outputPaths,
            duration,
            fps,
            frameCount
          });
        })
        .on('error', (err) => reject(new Error(`FFmpeg fragmentPNGAtlasToWebM failed: ${err.message}`)))
        .run();
    });
  }
}
