/**
 * ENUM домена MediaProcessing
 * Зона ответственности: Типы медиа и ошибки обработки
 */

/**
 * Форматы медиа-файлов
 */
export enum MediaFormat {
  GIF = 'gif',
  WEBP = 'webp',
  WEBM = 'webm',
  MP4 = 'mp4',
  PNG = 'png',
  JPEG = 'jpeg',
  AVIF = 'avif',
}

/**
 * Ошибки обработки медиа
 */
export enum MediaProcessingError {
  FFMPEG_NOT_FOUND = 'FFMPEG_NOT_FOUND',
  FFPROBE_NOT_FOUND = 'FFPROBE_NOT_FOUND',
  CONVERSION_FAILED = 'CONVERSION_FAILED',
  METADATA_EXTRACTION_FAILED = 'METADATA_EXTRACTION_FAILED',
  RESIZE_FAILED = 'RESIZE_FAILED',
  EXTRACT_FAILED = 'EXTRACT_FAILED',
  TRIM_FAILED = 'TRIM_FAILED',
  TILE_FAILED = 'TILE_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  OUTPUT_WRITE_FAILED = 'OUTPUT_WRITE_FAILED',
}
