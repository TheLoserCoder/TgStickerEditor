/**
 * Утилита для получения пути к бинарнику FFmpeg
 * Корректно работает как в режиме разработки, так и в packaged приложении
 */

import { app } from 'electron';
import path from 'path';
import ffmpegStatic from 'ffmpeg-static';

/**
 * Получить путь к бинарнику FFmpeg
 * В packaged приложении путь ведёт к unpacked файлу из ASAR
 */
export function getFFmpegPath(): string {
  if (!ffmpegStatic) {
    return 'ffmpeg'; // Fallback на системный ffmpeg
  }

  // В packaged приложении ASAR unpacked файлы доступны по особому пути
  if (app.isPackaged) {
    // Проверяем, содержит ли путь .asar (значит файл внутри ASAR)
    if (ffmpegStatic.includes('.asar') && !ffmpegStatic.includes('.asar.unpacked')) {
      // Заменяем app.asar на app.asar.unpacked для бинарников (кроссплатформенно)
      return ffmpegStatic.replace(path.sep + 'app.asar' + path.sep, path.sep + 'app.asar.unpacked' + path.sep);
    }
    
    return ffmpegStatic;
  }

  // В режиме разработки используем путь как есть
  return ffmpegStatic;
}

/**
 * Получить путь к бинарнику FFprobe
 */
export function getFFprobePath(): string {
  // ffmpeg-static предоставляет только ffmpeg
  // Для ffprobe используем системный или ищем рядом с ffmpeg
  const ffmpegPath = getFFmpegPath();
  
  // Пробуем найти ffprobe рядом с ffmpeg
  const ffprobePath = ffmpegPath.replace('ffmpeg', 'ffprobe');
  
  // Проверяем существование файла (в runtime)
  // В main процессе можно использовать fs, но здесь возвращаем путь
  return ffprobePath;
}

/**
 * Получить путь к пакету sharp (для unpacked ресурсов)
 */
export function getSharpPath(): string {
  if (app.isPackaged) {
    // В packaged приложении sharp должен быть unpacked
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'sharp');
  }
  
  // В режиме разработки
  return path.join(__dirname, '..', '..', 'node_modules', 'sharp');
}
