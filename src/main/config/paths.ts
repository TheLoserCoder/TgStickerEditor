import * as path from 'path';
import { app } from 'electron';
import { StickerPackFolderName } from '@/shared/domains/sticker-pack/enums';

/**
 * Получить базовый путь к ресурсам приложения
 */
export const getAppResourcesPath = (): string => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app.asar');
  }
  return path.join(__dirname, '../..');
};

/**
 * Получить путь к dist-main
 */
export const getDistMainPath = (): string => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app.asar', 'dist-main');
  }
  return path.join(process.cwd(), 'dist-main');
};

export const getStickerPackBasePath = (): string => {
  return path.join(app.getPath('userData'), StickerPackFolderName.BASE);
};

export const getLogFilePaths = (): string[] => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `app_${timestamp}.log`;
  
  return [
    path.join(app.getPath('userData'), 'logs', fileName),
    path.join(process.cwd(), 'logs', fileName)
  ];
};
