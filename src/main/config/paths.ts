import * as path from 'path';
import { StickerPackFolderName } from '@/shared/domains/sticker-pack/enums';

export const getStickerPackBasePath = (): string => {
  const { app } = require('electron');
  return path.join(app.getPath('userData'), StickerPackFolderName.BASE);
};

export const getLogFilePaths = (): string[] => {
  const { app } = require('electron');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `app_${timestamp}.log`;
  
  return [
    path.join(app.getPath('userData'), 'logs', fileName),
    path.join(process.cwd(), 'logs', fileName)
  ];
};
