/**
 * Интерфейс для FFmpeg адаптера
 * Зона ответственности: Абстракция для операций с видео/анимацией через FFmpeg
 */

/**
 * Метаданные видео/анимации
 */
export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  fps: number;
  hasAudio: boolean;
  codec: string;
}

/**
 * Опции для конвертации видео
 */
export interface FFmpegConvertOptions {
  format: 'webm' | 'mp4' | 'gif' | 'webp';
  fps?: number;
  quality?: number; // CRF для webm
  lossless?: boolean;
  loop?: number; // 0 = infinite для gif/webp
  targetDuration?: number; // Целевая длительность (сек)
}

/**
 * Опции для извлечения региона (crop)
 */
export interface ExtractOptions {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Результат фрагментации
 */
export interface FragmentResult {
  paths: string[];
  duration: number;
  fps: number;
  frameCount: number;
}

/**
 * Интерфейс FFmpeg адаптера
 */
export interface IFFmpegAdapter {
  /**
   * Получить метаданные видео через ffprobe
   */
  getMetadata(inputPath: string): Promise<VideoMetadata>;

  /**
   * Конвертировать видео в другой формат
   */
  convert(
    inputPath: string,
    outputPath: string,
    options: FFmpegConvertOptions
  ): Promise<void>;

  /**
   * Изменить длительность видео (ускорить/замедлить)
   */
  adjustDuration(
    inputPath: string,
    outputPath: string,
    targetDuration: number
  ): Promise<void>;

  /**
   * Изменить размер видео
   */
  resize(
    inputPath: string,
    outputPath: string,
    width: number,
    height: number
  ): Promise<void>;

  /**
   * Извлечь регион из видео (crop)
   */
  extractFragment(
    inputPath: string,
    outputPath: string,
    options: ExtractOptions
  ): Promise<void>;

  /**
   * Фрагментация анимации на тайлы с конвертацией в WebM
   */
  fragmentToWebM(
    inputPath: string,
    outputDir: string,
    columns: number,
    rows: number,
    tileSize: number,
    maxDuration: number,
    crf: number
  ): Promise<FragmentResult>;
}

  /**
   * Нарезка PNG атласа напрямую на WebM тайлы
   */
  fragmentPNGAtlasToWebM(
    atlasPath: string,
    outputDir: string,
    columns: number,
    rows: number,
    tileSize: number,
    frameCount: number,
    fps: number,
    crf: number
  ): Promise<FragmentResult>;
}
