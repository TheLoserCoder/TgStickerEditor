/**
 * Типы для домена логирования
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  meta?: any;
  timestamp: number;
  className?: string;
  methodName?: string;
}
