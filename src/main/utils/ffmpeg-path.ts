/**
 * Утилита для получения пути к бинарнику FFmpeg
 * Корректно работает как в режиме разработки, так и в packaged приложении
 */

import { app } from 'electron';
import path from 'path';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from '@ffprobe-installer/ffprobe';

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
      // Заменяем app.asar на app.asar.unpacked (работает на Windows и Linux)
      return ffmpegStatic.replace(/app\.asar([/\\])/, 'app.asar.unpacked$1');
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
  if (!ffprobeStatic.path) {
    return 'ffprobe'; // Fallback на системный ffprobe
  }

  // В packaged приложении ASAR unpacked файлы доступны по особому пути
  if (app.isPackaged) {
    // Проверяем, содержит ли путь .asar (значит файл внутри ASAR)
    if (ffprobeStatic.path.includes('.asar') && !ffprobeStatic.path.includes('.asar.unpacked')) {
      // Заменяем app.asar на app.asar.unpacked (работает на Windows и Linux)
      return ffprobeStatic.path.replace(/app\.asar([/\\])/, 'app.asar.unpacked$1');
    }
    
    return ffprobeStatic.path;
  }

  // В режиме разработки используем путь как есть
  return ffprobeStatic.path;
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
