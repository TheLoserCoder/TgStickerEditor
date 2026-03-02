export const PACK_VIEW_LABELS = {
  ADD_IMAGES: 'Добавить изображения',
  NORMALIZE_GRID: 'Нормализовать',
  UPLOAD_TO_TELEGRAM: 'Загрузить в Telegram',
  UPDATE_TELEGRAM: 'Обновить в Telegram',
  COPY_LINK: 'Копировать ссылку',
  UPLOADING: 'Загрузка',
  DELETING: 'Удаление',
  UPLOADING_PROGRESS: 'Загрузка',
  EMPTY_STATE: 'Пак пуст. Добавьте изображения для начала работы.',
  LOADING: 'Загрузка...',
  BOT_NOT_FOUND: 'Bot not found',
  UPDATE_FAILED: 'Update failed',
  UPLOAD_FAILED: 'Upload failed',
} as const;

export const PACK_VIEW_ROUTES = {
  STICKER_PACKS: '/sticker-packs',
  EDIT_PACK: '/edit-pack',
} as const;

export const PACK_VIEW_UI = {
  BUTTON_SIZE: '2',
  TEXT_SIZE_SMALL: '1',
  TEXT_SIZE_MEDIUM: '3',
  HEADING_SIZE: '6',
  FLEX_GAP_SMALL: '1',
  FLEX_GAP_MEDIUM: '3',
  TEXT_COLOR_GRAY: 'gray',
  BUTTON_VARIANT_SOFT: 'soft',
} as const;

export enum UploadStage {
  DELETING = 'deleting',
  UPLOADING = 'uploading',
}
