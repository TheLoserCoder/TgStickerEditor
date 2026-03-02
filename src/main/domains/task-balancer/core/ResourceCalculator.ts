import * as os from 'os';
import { RESERVED_THREADS } from '../constants';

/**
 * Утилита для вычисления доступных ресурсов
 */
export class ResourceCalculator {
  private readonly maxThreads: number;

  constructor(reservedThreads: number = RESERVED_THREADS) {
    const cpuCount = os.cpus().length;
    this.maxThreads = Math.max(1, cpuCount - reservedThreads);
  }

  /**
   * Получить максимальное количество потоков
   */
  getMaxThreads(): number {
    return this.maxThreads;
  }

  /**
   * Проверить, можно ли принять задачу с данным весом
   */
  canAcceptTask(currentLoad: number, taskWeight: number): boolean {
    return currentLoad + taskWeight <= this.maxThreads;
  }

  /**
   * Вычислить доступную нагрузку
   */
  getAvailableLoad(currentLoad: number): number {
    return Math.max(0, this.maxThreads - currentLoad);
  }
}
