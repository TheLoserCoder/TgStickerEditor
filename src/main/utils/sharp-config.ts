/**
 * Утилита для настройки Sharp
 * Корректно инициализирует sharp для packaged приложения
 */

import { app } from 'electron';
import path from 'path';
import sharp from 'sharp';

/**
 * Инициализировать Sharp с правильными путями
 * Вызывать один раз при старте приложения
 */
export function initSharp(): void {
  if (app.isPackaged) {
    // В packaged приложении sharp должен использовать unpacked бинарники
    const sharpPath = path.join(
      process.resourcesPath,
      'app.asar.unpacked',
      'node_modules',
      'sharp'
    );

    // Настраиваем кэширование
    sharp.cache({
      files: 50,
      items: 100,
    });

    // Настраиваем параллелизм
    sharp.concurrency(4);

    console.log('[Sharp] Initialized with unpacked path:', sharpPath);
  } else {
    // В режиме разработки
    sharp.cache({
      files: 50,
      items: 100,
    });
    sharp.concurrency(4);
  }
}

/**
 * Получить путь к бинарникам sharp (libvips)
 */
export function getSharpLibPath(): string {
  if (app.isPackaged) {
    return path.join(
      process.resourcesPath,
      'app.asar.unpacked',
      'node_modules',
      'sharp',
      'vendor',
      process.platform,
      'lib'
    );
  }

  return path.join(__dirname, '..', '..', 'node_modules', 'sharp', 'vendor');
}
