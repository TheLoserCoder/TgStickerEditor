import { nanoid } from 'nanoid';
import { ITaskBalancerService } from './ITaskBalancerService';
import { WorkerPool } from '../core/WorkerPool';
import { TaskQueue } from '../core/TaskQueue';
import { ResourceCalculator } from '../core/ResourceCalculator';
import { TaskInput, QueuedTask, BalancerStats, BalancerConfig, WorkerMessage } from '../types';
import { TaskPriority, TaskStatus } from '../enums';
import { MIN_WEIGHT, MAX_WEIGHT } from '../constants';

export class TaskBalancerService implements ITaskBalancerService {
  private readonly workerPool: WorkerPool;
  private readonly taskQueue: TaskQueue;
  private readonly resourceCalculator: ResourceCalculator;
  private readonly currentLoad: Map<string, number> = new Map();
  private isProcessingQueue = false;

  constructor(config: BalancerConfig) {
    this.resourceCalculator = new ResourceCalculator(config.reservedThreads);
    const maxThreads = config.maxThreads || this.resourceCalculator.getMaxThreads();
    
    this.workerPool = new WorkerPool(
      config.workerPath,
      maxThreads,
      config.idleTimeout
    );
    this.taskQueue = new TaskQueue();
  }

  async execute<T, R>(input: TaskInput<T>): Promise<R> {
    const task = this.createTask(input);
    const currentLoadValue = this.getCurrentLoadValue();
    
    if (this.resourceCalculator.canAcceptTask(currentLoadValue, task.weight)) {
      return this.executeTask<R>(task);
    }
    
    return this.enqueueTask<R>(task);
  }

  getStats(): BalancerStats {
    return {
      activeWorkers: this.workerPool.getActiveWorkers(),
      maxWorkers: this.workerPool.getMaxWorkers(),
      queueSize: this.taskQueue.size(),
      currentLoad: this.getCurrentLoadValue(),
      maxLoad: this.resourceCalculator.getMaxThreads()
    };
  }

  async shutdown(): Promise<void> {
    await this.workerPool.destroy();
    this.currentLoad.clear();
  }

  private createTask<T>(input: TaskInput<T>): QueuedTask<T> {
    return {
      id: nanoid(),
      taskType: input.taskType,
      data: input.data,
      priority: input.priority ?? TaskPriority.NORMAL,
      weight: this.normalizeWeight(input.weight ?? 1.0),
      status: TaskStatus.PENDING,
      resolve: () => {},
      reject: () => {}
    };
  }

  private normalizeWeight(weight: number): number {
    return Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, weight));
  }

  private async executeTask<R>(task: QueuedTask): Promise<R> {
    task.status = TaskStatus.RUNNING;
    this.currentLoad.set(task.id, task.weight);

    try {
      const message: WorkerMessage = {
        id: task.id,
        taskType: task.taskType,
        data: task.data
      };

      const result = await this.workerPool.execute<unknown, R>(message);
      task.status = TaskStatus.COMPLETED;
      return result;
    } catch (error) {
      task.status = TaskStatus.FAILED;
      throw error;
    } finally {
      this.currentLoad.delete(task.id);
      this.processQueue();
    }
  }

  private enqueueTask<R>(task: QueuedTask): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      task.resolve = resolve as (value: unknown) => void;
      task.reject = reject;
      this.taskQueue.enqueue(task);
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.taskQueue.isEmpty()) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (!this.taskQueue.isEmpty()) {
        const nextTask = this.taskQueue.peek();
        if (!nextTask) break;

        const currentLoadValue = this.getCurrentLoadValue();
        if (!this.resourceCalculator.canAcceptTask(currentLoadValue, nextTask.weight)) {
          break;
        }

        this.taskQueue.dequeue();
        this.executeTask(nextTask)
          .then((result) => nextTask.resolve(result))
          .catch((error) => nextTask.reject(error));
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private getCurrentLoadValue(): number {
    return Array.from(this.currentLoad.values()).reduce((sum, weight) => sum + weight, 0);
  }
}
