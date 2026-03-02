/**
 * Константы для домена логирования
 */

export const LOGGER_SERVICE_TOKEN = 'LoggerService';

export const LOG_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const LOG_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export const BatchConfig = {
  BATCH_SIZE: 50,
  DEBOUNCE_TIME: 100
} as const;

export const LogLimits = {
  MAX_MESSAGE_LENGTH: 5000,
  MAX_META_LENGTH: 10000,
  MAX_ARGS_LENGTH: 2000
} as const;
