/**
 * ENUM для IPC домена
 */

export enum ServiceName {
  STORE_SERVICE = 'StoreService',
  LOGGER_SERVICE = 'LoggerService',
  ERROR_SERVICE = 'ErrorService',
  EDITOR_PRESET_SERVICE = 'EditorPresetService',
}

export enum ErrorName {
  ERROR = 'Error',
  UNKNOWN_ERROR = 'Unknown error'
}
