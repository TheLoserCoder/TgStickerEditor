/**
 * Регистрация домена MediaProcessing в Container
 * Зона ответственности: DI регистрация адаптеров и зависимостей
 */

import { container } from '../core/Container';
import { MEDIA_PROCESSING_TOKENS } from './constants';
import { FFmpegAdapter } from './adapters/FFmpegAdapter';
import { SharpAdapter } from './adapters/SharpAdapter';
import { getFFmpegPath, getFFprobePath } from '../../utils/ffmpeg-path';

/**
 * Регистрация путей к бинарникам FFmpeg
 */
container.register(
  MEDIA_PROCESSING_TOKENS.FFMPEG_PATH,
  () => getFFmpegPath()
);

/**
 * Регистрация пути к FFprobe
 */
container.register(
  MEDIA_PROCESSING_TOKENS.FFPROBE_PATH,
  () => getFFprobePath()
);

/**
 * Регистрация FFmpegAdapter
 */
container.register(
  MEDIA_PROCESSING_TOKENS.FFMPEG_ADAPTER,
  () => new FFmpegAdapter(
    container.resolve<string>(MEDIA_PROCESSING_TOKENS.FFMPEG_PATH),
    container.resolve<string>(MEDIA_PROCESSING_TOKENS.FFPROBE_PATH)
  )
);

/**
 * Регистрация SharpAdapter
 */
container.register(
  MEDIA_PROCESSING_TOKENS.SHARP_ADAPTER,
  () => new SharpAdapter()
);

// Экспорты публичного API
export type { IFFmpegAdapter } from './interfaces/IFFmpegAdapter';
export type { ISharpAdapter } from './interfaces/ISharpAdapter';
export { MEDIA_PROCESSING_TOKENS } from './constants';
export { MediaFormat, MediaProcessingError } from './enums';
export * from './types';
