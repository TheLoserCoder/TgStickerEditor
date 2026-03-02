/**
 * Типы для домена обработки ошибок
 */

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export type ErrorContext = {
  className: string;
  methodName: string;
  args?: any[];
};

export type ErrorEntry = {
  error: Error;
  context: ErrorContext;
  severity: ErrorSeverity;
  timestamp: number;
};
