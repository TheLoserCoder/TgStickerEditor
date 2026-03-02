export const PAGE_TITLE = 'Настройки';

export const SECTIONS = {
  GENERAL: 'general',
  BOTS: 'bots',
  PRESETS: 'presets',
} as const;

export const SECTION_LABELS = {
  [SECTIONS.GENERAL]: 'Общие',
  [SECTIONS.BOTS]: 'Боты',
  [SECTIONS.PRESETS]: 'Пресеты',
};

export const GENERAL_LABELS = {
  THEME: 'Тема',
  THEME_LIGHT: 'Светлая',
  THEME_DARK: 'Тёмная',
  THEME_SYSTEM: 'Системная'
};

export const BOTS_LABELS = {
  ADD_BOT: 'Добавить бота',
  NO_BOTS: 'Нет добавленных ботов'
};
