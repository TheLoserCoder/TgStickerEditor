export enum ImageProcessingError {
  DETECTION_FAILED = 'Failed to detect image format',
  CONVERSION_FAILED = 'Failed to convert image',
  TRIM_FAILED = 'Failed to trim image',
  RESCALE_FAILED = 'Failed to rescale image',
  FRAGMENTATION_FAILED = 'Failed to fragment image',
  WEBP_CONVERSION_FAILED = 'Failed to convert to WebP',
  AGGREGATION_FAILED = 'Failed to aggregate results',
  PROCESSING_ABORTED = 'Processing was aborted',
  TEMP_FILE_ERROR = 'Temporary file operation failed',
  APNG_DETECTION_FAILED = 'Failed to detect APNG format',
  GIF_COMPRESSION_FAILED = 'Failed to compress GIF',
  FILE_SIZE_EXCEEDED = 'File size exceeds Telegram limits'
}

export enum ProcessingStage {
  DETECT_CONVERT = 'detect-convert',
  TRIM = 'trim',
  RESCALE = 'rescale',
  PRECOMPRESS = 'precompress',
  FRAGMENT = 'fragment',
  PADDING = 'padding',
  CONVERT_WEBP = 'convert-webp',
  AGGREGATE = 'aggregate'
}

export enum StageWeight {
  DETECT_CONVERT = 1.0,
  TRIM = 1.0,
  RESCALE = 1.0,
  PRECOMPRESS = 0.5,
  FRAGMENT = 1.0,
  PADDING = 0.5,
  CONVERT_WEBP = 1.0,
  AGGREGATE = 1.0
}

export enum TelegramLimits {
  STATIC_MAX_SIZE = 524288,
  ANIMATED_MAX_SIZE = 65536,
  VIDEO_MAX_SIZE = 262144,
  STICKER_SIZE = 512,
  EMOJI_SIZE = 100,
  MAX_DURATION = 3.0,
  TARGET_FPS = 30
}
