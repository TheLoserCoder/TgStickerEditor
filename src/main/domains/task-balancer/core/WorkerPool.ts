import { Worker } from 'worker_threads';
import { WorkerMessage, WorkerResponse } from '../types';
import { IDLE_TIMEOUT } from '../constants';

/**
 * Пул воркеров для выполнения задач
 */
export class WorkerPool {
  private workers: Set<Worker> = new Set();
  private availableWorkers: Worker[] = [];
  private idleTimers: Map<Worker, NodeJS.Timeout> = new Map();
  private pendingTasks: Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }> = new Map();

  constructor(
    private readonly workerPath: string,
    private readonly maxWorkers: number,
    private readonly idleTimeout: number = IDLE_TIMEOUT
  ) {}

  /**
   * Выполнить задачу через воркер
   */
  async execute<T, R>(message: WorkerMessage<T>): Promise<R> {
    const worker = await this.getWorker();

    return new Promise<R>((resolve, reject) => {
      this.pendingTasks.set(message.id, { resolve, reject });

      worker.postMessage(message);
    });
  }

  /**
   * Получить доступного воркера или создать нового
   */
  private async getWorker(): Promise<Worker> {
    let worker = this.availableWorkers.pop();

    if (worker) {
      this.clearIdleTimer(worker);
      return worker;
    }

    if (this.workers.size < this.maxWorkers) {
      worker = this.createWorker();
      this.workers.add(worker);
      return worker;
    }

    return new Promise((resolve) => {
      const checkAvailable = () => {
        const availableWorker = this.availableWorkers.pop();
        if (availableWorker) {
          this.clearIdleTimer(availableWorker);
          resolve(availableWorker);
        } else {
          setTimeout(checkAvailable, 10);
        }
      };
      checkAvailable();
    });
  }

  /**
   * Создать нового воркера
   */
  private createWorker(): Worker {
    const worker = new Worker(this.workerPath);

    worker.on('message', (response: WorkerResponse) => {
      const pending = this.pendingTasks.get(response.id);
      if (pending) {
        this.pendingTasks.delete(response.id);
        if (response.success) {
          pending.resolve(response.result);
        } else {
          pending.reject(new Error(response.error || 'Unknown error'));
        }
      }
      this.releaseWorker(worker);
    });

    worker.on('error', (error) => {
      this.handleWorkerError(worker, error);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        this.handleWorkerExit(worker, code);
      }
    });

    return worker;
  }

  /**
   * Вернуть воркера в пул
   */
  private releaseWorker(worker: Worker): void {
    if (!this.workers.has(worker)) return;

    this.availableWorkers.push(worker);
    this.startIdleTimer(worker);
  }

  /**
   * Запустить таймер простоя
   */
  private startIdleTimer(worker: Worker): void {
    this.clearIdleTimer(worker);

    const timer = setTimeout(() => {
      this.terminateWorker(worker);
    }, this.idleTimeout);

    this.idleTimers.set(worker, timer);
  }

  /**
   * Очистить таймер простоя
   */
  private clearIdleTimer(worker: Worker): void {
    const timer = this.idleTimers.get(worker);
    if (timer) {
      clearTimeout(timer);
      this.idleTimers.delete(worker);
    }
  }

  /**
   * Завершить воркера
   */
  private terminateWorker(worker: Worker): void {
    this.clearIdleTimer(worker);
    this.workers.delete(worker);
    const index = this.availableWorkers.indexOf(worker);
    if (index !== -1) {
      this.availableWorkers.splice(index, 1);
    }
    worker.terminate();
  }

  /**
   * Обработать ошибку воркера
   */
  private handleWorkerError(worker: Worker, error: Error): void {
    this.pendingTasks.forEach((pending) => {
      pending.reject(error);
    });
    this.pendingTasks.clear();
    this.terminateWorker(worker);
  }

  /**
   * Обработать выход воркера
   */
  private handleWorkerExit(worker: Worker, code: number): void {
    this.workers.delete(worker);
    const index = this.availableWorkers.indexOf(worker);
    if (index !== -1) {
      this.availableWorkers.splice(index, 1);
    }
  }

  /**
   * Получить количество активных воркеров
   */
  getActiveWorkers(): number {
    return this.workers.size - this.availableWorkers.length;
  }

  /**
   * Получить максимальное количество воркеров
   */
  getMaxWorkers(): number {
    return this.maxWorkers;
  }

  /**
   * Graceful shutdown - завершить все воркеры
   */
  async destroy(): Promise<void> {
    this.idleTimers.forEach((timer) => clearTimeout(timer));
    this.idleTimers.clear();

    const terminatePromises = Array.from(this.workers).map((worker) =>
      worker.terminate()
    );

    await Promise.all(terminatePromises);
    this.workers.clear();
    this.availableWorkers = [];
    this.pendingTasks.clear();
  }
}
