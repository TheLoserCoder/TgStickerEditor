import { QueuedTask } from '../types';
import { TaskPriority } from '../enums';

/**
 * Очередь задач с приоритетами и весами
 */
export class TaskQueue {
  private queue: QueuedTask[] = [];

  /**
   * Добавить задачу в очередь
   */
  enqueue(task: QueuedTask): void {
    this.queue.push(task);
    this.sort();
  }

  /**
   * Извлечь задачу с наивысшим приоритетом
   */
  dequeue(): QueuedTask | undefined {
    return this.queue.shift();
  }

  /**
   * Посмотреть следующую задачу без извлечения
   */
  peek(): QueuedTask | undefined {
    return this.queue[0];
  }

  /**
   * Проверить, пуста ли очередь
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Получить размер очереди
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Сортировка: приоритет DESC, вес ASC (легкие задачи вперед при равном приоритете)
   */
  private sort(): void {
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.weight - b.weight;
    });
  }
}
