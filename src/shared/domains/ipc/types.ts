/**
 * Типы для IPC коммуникации между процессами
 */

export type ServiceCall = {
  service: string;
  method: string;
  args: any[];
};

export type ServiceResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: SerializedError;
};

export type SerializedError = {
  name: string;
  message: string;
  stack?: string;
};
