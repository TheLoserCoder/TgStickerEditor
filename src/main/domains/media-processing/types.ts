/**
 * Типы домена MediaProcessing
 * Зона ответственности: Общие типы для обработки медиа
 */

/**
 * Базовый тип медиа-ресурса
 */
export interface MediaAsset {
  id: string;
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  hasAlpha: boolean;
  isAnimated: boolean;
  sourceId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Настройки сетки для нарезки фрагментов
 */
export interface GridSettings {
  columns: number;
  rows: number;
}

/**
 * Результат обработки медиа
 */
export interface ProcessingResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
