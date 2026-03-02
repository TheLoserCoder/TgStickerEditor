import { TaskInput, BalancerStats } from '../types';

/**
 * Интерфейс сервиса балансировки задач
 */
export interface ITaskBalancerService {
  /**
   * Выполнить задачу
   */
  execute<T, R>(input: TaskInput<T>): Promise<R>;

  /**
   * Получить статистику балансировщика
   */
  getStats(): BalancerStats;

  /**
   * Graceful shutdown - завершить все задачи и воркеры
   */
  shutdown(): Promise<void>;
}
