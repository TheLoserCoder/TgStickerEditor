export const TELEGRAM_STICKER_SIZE = {
  STICKER: 512,
  EMOJI: 100,
} as const;

export const TELEGRAM_UPLOAD_DELAY = 1000;

export const TELEGRAM_DEFAULT_EMOJI = '😀';

export const TELEGRAM_PACK_URL_BASE = 'https://t.me/addstickers/';

export const TELEGRAM_FILE_EXTENSIONS = {
  VIDEO: '.webm',
  ANIMATED: '.tgs',
} as const;

export const TELEGRAM_ERROR_MESSAGES = {
  NETWORK: ['Network', 'ENOTFOUND', 'ETIMEDOUT'],
  PEER_INVALID: ['user not found', 'PEER_ID_INVALID', 'bot was blocked'],
  DIMENSIONS: ['STICKER_PNG_DIMENSIONS', 'STICKER_VIDEO_DIMENSIONS'],
  NAME_TAKEN: ['STICKERSET_INVALID', 'name is already taken'],
} as const;

export const TELEGRAM_USER_ERROR_MESSAGES = {
  NETWORK: 'Ошибка сети. Проверьте подключение к интернету',
  PEER_INVALID: 'Вы должны написать боту /start перед созданием пака',
  DIMENSIONS: 'Неверные размеры стикера',
  NAME_TAKEN: 'Имя стикерпака уже занято',
  PACK_NOT_FOUND: 'Стикерпак не найден в Telegram',
  UNKNOWN: 'Ошибка Telegram',
} as const;
