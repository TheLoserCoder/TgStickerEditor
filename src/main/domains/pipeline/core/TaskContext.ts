import { ITaskContext } from '../types';

/**
 * Контекст задачи
 * Сохраняет метаданные через всю цепочку обработки
 */
export class TaskContext implements ITaskContext {
  constructor(
    public readonly sessionId: string,
    public readonly metadata: Record<string, unknown> = {}
  ) {}

  /**
   * Создать новый контекст с дополнительными метаданными
   */
  withMetadata(metadata: Record<string, unknown>): TaskContext {
    return new TaskContext(this.sessionId, { ...this.metadata, ...metadata });
  }

  /**
   * Получить значение из метаданных
   */
  get<T>(key: string): T | undefined {
    return this.metadata[key] as T | undefined;
  }

  /**
   * Установить значение в метаданные
   */
  set(key: string, value: unknown): TaskContext {
    return this.withMetadata({ [key]: value });
  }
}
