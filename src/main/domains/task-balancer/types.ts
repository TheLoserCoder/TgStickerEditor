import { TaskPriority, TaskStatus } from './enums';

/**
 * Входные данные для задачи
 */
export interface TaskInput<T = unknown> {
  taskType: string;
  data: T;
  priority?: TaskPriority;
  weight?: number;
}

/**
 * Результат выполнения задачи
 */
export interface TaskResult<R = unknown> {
  success: boolean;
  result?: R;
  error?: string;
}

/**
 * Задача в очереди
 */
export interface QueuedTask<T = unknown> {
  id: string;
  taskType: string;
  data: T;
  priority: TaskPriority;
  weight: number;
  status: TaskStatus;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

/**
 * Сообщение для воркера
 */
export interface WorkerMessage<T = unknown> {
  id: string;
  taskType: string;
  data: T;
}

/**
 * Ответ от воркера
 */
export interface WorkerResponse<R = unknown> {
  id: string;
  success: boolean;
  result?: R;
  error?: string;
}

/**
 * Конфигурация балансировщика
 */
export interface BalancerConfig {
  workerPath: string;
  maxThreads?: number;
  idleTimeout?: number;
  reservedThreads?: number;
}

/**
 * Статистика балансировщика
 */
export interface BalancerStats {
  activeWorkers: number;
  maxWorkers: number;
  queueSize: number;
  currentLoad: number;
  maxLoad: number;
}
