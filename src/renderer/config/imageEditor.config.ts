/**
 * Конфигурация редактора изображений
 * Зона ответственности: Настройки, опции, дефолты для ImageEditor
 */

export enum RescaleQuality {
  NONE = 'none',
  SHARP = 'sharp',
  SMOOTH = 'smooth',
}

export interface ImageEditorSettings {
  columns: number;
  rows: number;
  crop: boolean;
  rescaleQuality: RescaleQuality;
  animation: boolean;
  zoom: number;
  border: number;
  dividerMode: boolean;
}

export const DEFAULT_SETTINGS: ImageEditorSettings = {
  columns: 1,
  rows: 1,
  crop: true,
  rescaleQuality: RescaleQuality.NONE,
  animation: true,
  zoom: 100,
  border: 0,
  dividerMode: false,
};

export const RESCALE_QUALITY_OPTIONS = [
  { label: 'Без улучшения', value: RescaleQuality.NONE },
  { label: 'Максимально четкий', value: RescaleQuality.SHARP },
  { label: 'Максимально сглаженный', value: RescaleQuality.SMOOTH },
];

export const BOOLEAN_OPTIONS = [
  { label: 'Да', value: 'true' },
  { label: 'Нет', value: 'false' },
];

export const ZOOM_STEP = 10;
export const MIN_ZOOM = 10;
export const MAX_ZOOM = 500;

export const MIN_BORDER = 0;
export const MAX_BORDER = 20;

export const CONFIRMATION_MESSAGES = {
  RESET_INDIVIDUAL_SETTINGS: {
    title: 'Подтверждение',
    message: 'Изменение общих настроек сбросит индивидуальные настройки для всех изображений. Продолжить?',
    confirmLabel: 'Продолжить',
    cancelLabel: 'Отмена',
  },
} as const;
