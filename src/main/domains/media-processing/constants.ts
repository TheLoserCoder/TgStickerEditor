/**
 * Константы домена MediaProcessing
 * Зона ответственности: Конфигурации и DI токены
 */

/**
 * Конфигурация FFmpeg по умолчанию
 */
export const FFMPEG_CONFIG = {
  DEFAULT_FPS: 30,
  DEFAULT_CRF: 30,
  CRF_MIN: 20,
  CRF_MAX: 50,
  MAX_SIZE_BYTES: 256 * 1024, // Telegram лимит (256 KB)
  VIDEO_SIZE_512: 512,
  VIDEO_SIZE_100: 100,
  LIMIT_DURATION_299: 2.99,
  LIMIT_DURATION_99: 0.99,
  MAX_SPEED_FACTOR: 4,
  FPS: 30,
} as const;

/**
 * Конфигурация Sharp по умолчанию
 */
export const SHARP_CONFIG = {
  DEFAULT_QUALITY: 80,
  DEFAULT_EFFORT: 4,
  LIMIT_INPUT_PIXELS: false,
  BORDER_SIZE: 2,
} as const;

/**
 * Токены для Dependency Injection
 */
export const MEDIA_PROCESSING_TOKENS = {
  FFMPEG_ADAPTER: Symbol('IFFmpegAdapter'),
  SHARP_ADAPTER: Symbol('ISharpAdapter'),
  FFMPEG_PATH: Symbol('FFMPEG_PATH'),
  FFPROBE_PATH: Symbol('FFPROBE_PATH'),
} as const;
