/**
 * ENUM для домена логирования
 */

export enum ConsoleMethod {
  LOG = 'log',
  WARN = 'warn',
  ERROR = 'error'
}

export enum BatchConfig {
  BATCH_SIZE = 50,
  DEBOUNCE_TIME = 100
}

export enum LogLimits {
  MAX_MESSAGE_LENGTH = 1000,
  MAX_META_LENGTH = 5000,
  MAX_ARGS_LENGTH = 2000
}
