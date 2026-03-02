/**
 * FileTransport - транспорт для записи логов в файл
 * Используется в main процессе
 */

import * as fs from 'fs';
import * as path from 'path';
import { ILogTransport } from '@/shared/domains/logger/interfaces/ILogTransport';
import { LogEntry } from '@/shared/domains/logger/types';
import { LogLimits } from '../constants';

export class FileTransport implements ILogTransport {
  private logFilePath: string;
  private writeStream: fs.WriteStream;

  constructor(logFilePath: string) {
    this.logFilePath = logFilePath;
    this.ensureLogDirectory();
    this.writeStream = fs.createWriteStream(this.logFilePath, { flags: 'a', encoding: 'utf-8' });
  }

  write(entry: LogEntry): void {
    const sanitizedEntry = this.sanitizeEntry(entry);
    const logLine = JSON.stringify(sanitizedEntry) + '\n';
    
    if (!this.writeStream.write(logLine)) {
      this.writeStream.once('drain', () => {});
    }
  }

  close(): void {
    this.writeStream.end();
  }

  private sanitizeEntry(entry: LogEntry): LogEntry {
    return {
      ...entry,
      message: this.truncateString(entry.message, LogLimits.MAX_MESSAGE_LENGTH),
      meta: this.sanitizeMeta(entry.meta)
    };
  }

  private sanitizeMeta(meta: any): any {
    if (!meta) return meta;

    const metaString = JSON.stringify(meta);
    if (metaString.length <= LogLimits.MAX_META_LENGTH) {
      return meta;
    }

    if (typeof meta === 'object') {
      const sanitized: any = {};
      
      // Сохраняем error и stack без обрезки
      if (meta.error) {
        sanitized.error = meta.error;
      }
      
      // Обрезаем args если есть
      if (meta.args) {
        sanitized.args = this.truncateString(JSON.stringify(meta.args), LogLimits.MAX_ARGS_LENGTH);
      }
      
      // Копируем остальные поля с ограничением
      for (const key in meta) {
        if (key !== 'error' && key !== 'args' && meta.hasOwnProperty(key)) {
          const value = JSON.stringify(meta[key]);
          sanitized[key] = value.length > 500 ? this.truncateString(value, 500) : meta[key];
        }
      }
      
      return sanitized;
    }

    return this.truncateString(metaString, LogLimits.MAX_META_LENGTH);
  }

  private truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '... [truncated]';
  }

  private ensureLogDirectory(): void {
    const dir = path.dirname(this.logFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
