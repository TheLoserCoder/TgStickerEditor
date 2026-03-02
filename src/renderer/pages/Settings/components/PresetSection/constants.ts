export const PRESET_LABELS = {
  ADD_PRESET: 'Добавить пресет',
  NO_PRESETS: 'Нет сохраненных пресетов',
  DELETE_CONFIRMATION_TITLE: 'Удалить пресет?',
  DELETE_CONFIRMATION_DESCRIPTION: (name: string) => `Вы уверены, что хотите удалить пресет "${name}"?`,
  DELETE_CONFIRM_TEXT: 'Удалить',
  DELETE_CANCEL_TEXT: 'Отмена',
} as const;

export const PRESET_DIALOG_LABELS = {
  CREATE_TITLE: 'Создать пресет',
  EDIT_TITLE: 'Редактировать пресет',
  CREATE_DESCRIPTION: 'Настройте параметры обработки изображений для нового пресета',
  EDIT_DESCRIPTION: 'Измените параметры обработки изображений для пресета',
  NAME_LABEL: 'Название',
  NAME_PLACEHOLDER: 'Введите название пресета',
  COLUMNS: 'Колонки',
  ROWS: 'Строки',
  CROP: 'Обрезка пустот',
  RESCALE_QUALITY: 'Умный рескейл',
  ANIMATION: 'Анимация',
  CANCEL: 'Отмена',
  CREATE: 'Создать',
  SAVE: 'Сохранить',
} as const;

export const CREATE_PRESET_LABELS = PRESET_DIALOG_LABELS;
export const EDIT_PRESET_LABELS = PRESET_DIALOG_LABELS;
